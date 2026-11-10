import OrderModel, { orderCode, paidTotal } from "@/db/models/OrderModel";
import WalletModel from "@/db/models/WalletModel";
import { toCanonicalStatus } from "./order-status";
import type { MidtransNotification } from "./midtrans";

function isSuccess(n: MidtransNotification) {
  return n.transaction_status === "settlement" || (n.transaction_status === "capture" && (!n.fraud_status || n.fraud_status === "accept"));
}

/**
 * Terapkan status transaksi Midtrans.
 * - order_id `TOPUP-…` → top up Saldo CKIN
 * - order_id `CKIN-…`  → pembayaran pesanan
 *
 * Dipakai oleh webhook (/api/payments/notification) DAN sinkronisasi manual
 * (/api/payments/sync, /api/customer/wallet/topup/sync) — penting saat
 * development di localhost, karena webhook Midtrans tidak menjangkau komputer lokal.
 */
export async function applyMidtransStatus(notification: MidtransNotification) {
  if (notification.order_id.startsWith("TOPUP-")) return applyTopupStatus(notification);

  const { order_id, transaction_status, transaction_id, payment_type, gross_amount } = notification;

  const order = await OrderModel.findByMidtransOrderId(order_id);
  if (!order) return { ok: false as const, reason: "NOT_FOUND" as const };

  const total = paidTotal(order);
  if (Number(gross_amount) !== total) {
    console.error("[midtrans] nominal tidak cocok", order_id, gross_amount, total);
    return { ok: false as const, reason: "AMOUNT_MISMATCH" as const };
  }

  const details = { transactionId: transaction_id, paymentType: payment_type };
  const success = isSuccess(notification);

  if (success) {
    // markPaid hanya berlaku untuk pesanan PENDING_PAYMENT → aman dipanggil berulang.
    const paid = await OrderModel.markPaid({ "payment.midtransOrderId": order_id }, details);
    if (paid) {
      await WalletModel.recordExternalPayment(paid, total, orderCode(paid), payment_type);
    } else {
      // Customer membayar VA setelah pesanan dibatalkan/kedaluwarsa → uang masuk ke saldo.
      const status = toCanonicalStatus(order.status);
      if (status === "CANCELLED" || status === "EXPIRED") {
        await WalletModel.recordExternalPayment(order, total, orderCode(order), payment_type);
        await WalletModel.refundOrder(order, total, orderCode(order));
      }
    }
  } else if (transaction_status === "pending") {
    await OrderModel.updatePaymentStatus(order_id, { ...details, paymentStatus: "PENDING" });
  } else if (transaction_status === "expire") {
    await OrderModel.updatePaymentStatus(order_id, { ...details, paymentStatus: "EXPIRED" }, true);
  } else if (["deny", "cancel", "failure"].includes(transaction_status)) {
    // Pesanan tetap menunggu pembayaran supaya customer bisa mencoba lagi.
    await OrderModel.updatePaymentStatus(order_id, { ...details, paymentStatus: "FAILED" });
  }

  return { ok: true as const, paid: success, status: transaction_status };
}

/** Top up saldo: nominal + biaya admin harus sama dengan gross_amount Midtrans. */
export async function applyTopupStatus(notification: MidtransNotification) {
  const { order_id, transaction_status, payment_type, gross_amount } = notification;
  const trx = await WalletModel.findByMidtransOrderId(order_id);
  if (!trx) return { ok: false as const, reason: "NOT_FOUND" as const };

  if (Number(gross_amount) !== trx.amount + (trx.adminFee ?? 0)) {
    console.error("[midtrans] nominal top up tidak cocok", order_id, gross_amount);
    return { ok: false as const, reason: "AMOUNT_MISMATCH" as const };
  }

  const success = isSuccess(notification);
  if (success) await WalletModel.settleTopup(order_id, "SUCCESS", payment_type);
  else if (["deny", "cancel", "failure", "expire"].includes(transaction_status)) {
    await WalletModel.settleTopup(order_id, "FAILED", payment_type);
  }
  return { ok: true as const, paid: success, status: transaction_status };
}
