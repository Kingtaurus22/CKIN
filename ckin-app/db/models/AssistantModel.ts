import type { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import { orderCode, orderLocation, paidTotal } from "./OrderModel";
import SurveyorWorkModel from "./SurveyorWorkModel";
import WalletModel from "./WalletModel";
import type { CustomerDocument, OrderDocument, SurveyorDocument } from "./types";
import type { CustomerFacts, SurveyorFacts } from "@/src/lib/assistant/answer";
import { ASSISTANT_DAILY_LIMIT } from "@/src/lib/assistant/limits";
import { STATUS_LABEL, paymentLabel, toCanonicalStatus } from "@/src/lib/order-status";


/**
 * Data untuk chatbot (bagian Retrieval pada RAG).
 * HANYA data milik pengguna yang sedang login yang diambil, sehingga
 * asisten tidak pernah bisa membocorkan pesanan orang lain.
 */
class AssistantModel {
  static async customerFacts(customerId: ObjectId): Promise<CustomerFacts> {
    const db = getDb();
    const [customer, orders, wallet] = await Promise.all([
      db.collection<CustomerDocument>("customers").findOne({ _id: customerId }, { projection: { fullname: 1 } }),
      db.collection<OrderDocument>("orders").find({ UserId: customerId }).sort({ createdAt: -1 }).limit(30).toArray(),
      WalletModel.viewFor(customerId, 10),
    ]);
    const surveyorIds = orders.map((o) => o.SurveyorId).filter((id): id is ObjectId => Boolean(id));
    const surveyors = new Map(
      (
        await db
          .collection<SurveyorDocument>("surveyors")
          .find({ _id: { $in: surveyorIds } }, { projection: { fullname: 1 } })
          .toArray()
      ).map((s) => [s._id.toString(), s.fullname]),
    );

    return {
      name: customer?.fullname ?? "",
      balance: wallet.balance,
      transactions: wallet.transactions.slice(0, 5).map((t) => ({
        description: t.description,
        amount: t.amount,
        type: t.type,
        status: t.status,
        reference: t.reference,
        createdAt: t.createdAt,
      })),
      orders: orders.map((o) => {
        const status = toCanonicalStatus(o.status);
        return {
          id: o._id.toString(),
          code: orderCode(o),
          status,
          statusLabel: STATUS_LABEL[status],
          location: orderLocation(o),
          kosCount: o.kosCount,
          total: paidTotal(o),
          payment: paymentLabel(o.payment?.paymentStatus, o.paidAt, status),
          surveyDate: o.surveyDate ? new Date(o.surveyDate).toISOString() : null,
          expiresAt: o.expiresAt ? new Date(o.expiresAt).toISOString() : null,
          surveyor: o.SurveyorId ? (surveyors.get(o.SurveyorId.toString()) ?? null) : null,
          refunded: Boolean(o.refundedAt) || o.payment?.paymentStatus === "REFUNDED",
          createdAt: new Date(o.createdAt).toISOString(),
        };
      }),
    };
  }

  static async surveyorFacts(surveyorId: ObjectId): Promise<SurveyorFacts> {
    const [mine, open, earnings, surveyor] = await Promise.all([
      SurveyorWorkModel.listMine(surveyorId),
      SurveyorWorkModel.listOpen(surveyorId).catch(() => []),
      SurveyorWorkModel.earnings(surveyorId),
      SurveyorWorkModel.getSurveyor(surveyorId),
    ]);
    return {
      name: surveyor.fullname,
      verification: surveyor.verification?.status ?? "PENDING",
      rejectionReason: surveyor.verification?.rejectionReason ?? null,
      acceptingOrders: surveyor.acceptingOrders !== false,
      coverage: surveyor.coverageArea?.districts ?? [],
      openCount: open.length,
      orders: mine.map((o) => ({
        id: o.id,
        code: o.code,
        status: o.status,
        statusLabel: o.statusLabel,
        customer: o.customer.name,
        location: o.location,
        kosCount: o.kosCount,
        surveyDate: o.surveyDate,
        earning: o.earning,
      })),
      earnings: {
        monthIncome: earnings.monthIncome,
        available: earnings.available,
        held: earnings.held,
        heldKos: earnings.heldKos,
        withdrawals: earnings.withdrawals.slice(0, 3).map((w) => ({ code: w.code, amount: w.amount, status: w.status, note: w.note })),
      },
    };
  }

  /**
   * Hitung pemakaian harian (koleksi `assistantUsage`) dan tolak bila lewat batas.
   * Mengembalikan sisa kuota hari ini setelah pertanyaan ini.
   */
  static async consumeDaily(userId: ObjectId) {
    const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const col = getDb().collection<{ userId: ObjectId; day: string; count: number; updatedAt: Date }>("assistantUsage");
    const current = await col.findOne({ userId, day });
    const used = current?.count ?? 0;
    if (used >= ASSISTANT_DAILY_LIMIT) return { allowed: false as const, remaining: 0 };
    await col.updateOne({ userId, day }, { $set: { count: used + 1, updatedAt: new Date() } }, { upsert: true });
    return { allowed: true as const, remaining: ASSISTANT_DAILY_LIMIT - used - 1 };
  }

  static async remainingToday(userId: ObjectId) {
    const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const current = await getDb().collection<{ userId: ObjectId; day: string; count: number }>("assistantUsage").findOne({ userId, day });
    return Math.max(0, ASSISTANT_DAILY_LIMIT - (current?.count ?? 0));
  }
}

export default AssistantModel;
