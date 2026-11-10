import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import type { OrderDocument, WalletTransactionDocument } from "./types";
import type { WalletView } from "@/src/types/customer";

/**
 * Saldo CKIN customer (koleksi `walletTransactions`).
 *
 * - Saldo = jumlah transaksi SUCCESS yang `external !== true` (masuk − keluar).
 * - Top up lewat Midtrans: transaksi PENDING dibuat dulu, lalu menjadi SUCCESS
 *   saat webhook / sinkronisasi Midtrans menyatakan lunas. Customer membayar
 *   nominal + biaya admin; yang masuk saldo hanya nominalnya.
 * - Pembayaran pesanan langsung via Midtrans dicatat sebagai transaksi
 *   `external` supaya riwayat lengkap tanpa mengurangi saldo.
 * - Pesanan yang sudah dibayar lalu dibatalkan → refund penuh ke saldo.
 */
class WalletModel {
  static collection() {
    return getDb().collection<WalletTransactionDocument>("walletTransactions");
  }

  static async balanceFor(customerId: ObjectId) {
    const [row] = await this.collection()
      .aggregate<{ totalIn: number; totalOut: number }>([
        { $match: { customerId, status: "SUCCESS", external: { $ne: true } } },
        {
          $group: {
            _id: null,
            totalIn: { $sum: { $cond: [{ $eq: ["$type", "in"] }, "$amount", 0] } },
            totalOut: { $sum: { $cond: [{ $eq: ["$type", "out"] }, "$amount", 0] } },
          },
        },
      ])
      .toArray();

    const totalIn = row?.totalIn ?? 0;
    const totalOut = row?.totalOut ?? 0;
    return { totalIn, totalOut, balance: totalIn - totalOut };
  }

  static async viewFor(customerId: ObjectId, limit = 100): Promise<WalletView> {
    const [totals, transactions] = await Promise.all([
      this.balanceFor(customerId),
      this.collection().find({ customerId }).sort({ createdAt: -1 }).limit(limit).toArray(),
    ]);

    return {
      ...totals,
      transactions: transactions.map((trx) => ({
        id: trx._id.toString(),
        type: trx.type,
        category: trx.category,
        amount: trx.amount,
        description: trx.description,
        reference: trx.reference ?? null,
        method: trx.method ?? null,
        status: trx.status,
        createdAt: new Date(trx.createdAt).toISOString(),
        external: trx.external === true,
        adminFee: trx.adminFee ?? 0,
        orderId: trx.orderId?.toString() ?? null,
        redirectUrl: trx.status === "PENDING" ? (trx.redirectUrl ?? null) : null,
      })),
    };
  }

  // ------------------------------------------------------------------
  // Top up
  // ------------------------------------------------------------------

  static async createTopup(customerId: ObjectId, amount: number, adminFee: number, method: string) {
    const _id = new ObjectId();
    const now = new Date();
    const trx: WalletTransactionDocument = {
      _id,
      customerId,
      type: "in",
      category: "topup",
      amount,
      adminFee,
      description: "Top up saldo",
      method: `Midtrans · ${method === "bank" ? "Virtual Account" : method === "qris" ? "QRIS" : "E-wallet"}`,
      status: "PENDING",
      midtransOrderId: `TOPUP-${_id.toString()}-${Date.now()}`,
      reference: `#TU-${_id.toString().slice(-6).toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
    };
    await this.collection().insertOne(trx);
    return trx;
  }

  static saveTopupSession(id: ObjectId, session: { redirectUrl: string; snapToken: string }) {
    return this.collection().updateOne({ _id: id }, { $set: { ...session, updatedAt: new Date() } });
  }

  static findTopup(id: ObjectId, customerId: ObjectId) {
    return this.collection().findOne({ _id: id, customerId, category: "topup" });
  }

  static findByMidtransOrderId(midtransOrderId: string) {
    return this.collection().findOne({ midtransOrderId });
  }

  /** Ubah status top up; hanya dari PENDING → idempoten untuk webhook berulang. */
  static async settleTopup(midtransOrderId: string, status: "SUCCESS" | "FAILED", paymentType?: string) {
    const result = await this.collection().updateOne(
      { midtransOrderId, status: "PENDING" },
      { $set: { status, updatedAt: new Date(), ...(paymentType ? { paymentType } : {}) } },
    );
    return result.modifiedCount > 0;
  }

  // ------------------------------------------------------------------
  // Riwayat pembayaran pesanan & refund
  // ------------------------------------------------------------------

  /** Catat pembayaran pesanan via Midtrans di riwayat (tidak memotong saldo). */
  static async recordExternalPayment(order: OrderDocument, total: number, code: string, paymentType?: string) {
    const exists = await this.collection().countDocuments({ orderId: order._id, category: "payment" });
    if (exists) return;
    await this.collection().insertOne({
      _id: new ObjectId(),
      customerId: order.UserId,
      type: "out",
      category: "payment",
      amount: total,
      description: "Pembayaran survei",
      reference: `#${code}`,
      method: `Midtrans${paymentType ? ` · ${paymentType.replace(/_/g, " ").toUpperCase()}` : ""}`,
      status: "SUCCESS",
      external: true,
      orderId: order._id,
      createdAt: new Date(),
    });
  }

  /** Refund penuh pesanan ke Saldo CKIN. Satu pesanan hanya bisa di-refund sekali. */
  static async refundOrder(order: OrderDocument, total: number, code: string) {
    if (total <= 0) return false;
    const exists = await this.collection().countDocuments({ orderId: order._id, category: "refund" });
    if (exists) return false;
    await this.collection().insertOne({
      _id: new ObjectId(),
      customerId: order.UserId,
      type: "in",
      category: "refund",
      amount: total,
      description: "Refund pesanan dibatalkan",
      reference: `#${code}`,
      method: "Saldo CKIN",
      status: "SUCCESS",
      orderId: order._id,
      createdAt: new Date(),
    });
    return true;
  }
}

export default WalletModel;
