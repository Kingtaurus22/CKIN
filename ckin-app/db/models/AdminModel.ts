import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import { ensureAccountIndexes, hashPassword } from "./AccountModel";
import type { AdminDocument, OrderDocument, SurveyorDocument, WithdrawalDocument } from "./types";
import { ApiError } from "@/src/lib/api";
import { signedPrivateUrl } from "@/src/lib/cloudinary";
import { rawStatusesFor } from "@/src/lib/order-status";
import { SERVICE_FEE } from "@/src/lib/pricing";
import type { AdminOverview, AdminSurveyorRow, AdminWithdrawalRow } from "@/src/types/admin";

/**
 * Super admin CKIN:
 * - verifikasi akun surveyor (PENDING → APPROVED / REJECTED)
 * - proses penarikan dana surveyor (PENDING → SUCCESS / REJECTED)
 */
const db = () => getDb();
const surveyors = () => db().collection<SurveyorDocument>("surveyors");
const withdrawals = () => db().collection<WithdrawalDocument>("surveyorWithdrawals");

class AdminModel {
  static collection() {
    return db().collection<AdminDocument>("admins");
  }

  static async create(input: { fullname: string; email: string; password: string; phone?: string }) {
    await ensureAccountIndexes();
    const now = new Date();
    const doc: AdminDocument = {
      _id: new ObjectId(),
      fullname: input.fullname,
      email: input.email.trim().toLowerCase(),
      phone: input.phone ?? "",
      password: await hashPassword(input.password),
      createdAt: now,
      updatedAt: now,
    };
    await this.collection().insertOne(doc);
    return doc;
  }

  static async overview(): Promise<AdminOverview> {
    const orders = db().collection<OrderDocument>("orders");
    const [pendingSurveyors, approvedSurveyors, customers, pendingWd, activeOrders, paidOrders] = await Promise.all([
      surveyors().countDocuments({ "verification.status": "PENDING" }),
      surveyors().countDocuments({ "verification.status": "APPROVED" }),
      db().collection("customers").countDocuments({}),
      withdrawals().find({ status: "PENDING" }).toArray(),
      orders.countDocuments({ status: { $in: rawStatusesFor(["WAITING_SURVEYOR", "ASSIGNED", "IN_PROGRESS", "REPORT_SUBMITTED"]) } }),
      orders.countDocuments({ paidAt: { $exists: true }, status: { $nin: rawStatusesFor(["CANCELLED", "EXPIRED"]) } }),
    ]);
    return {
      pendingSurveyors,
      approvedSurveyors,
      customers,
      pendingWithdrawals: pendingWd.length,
      pendingWithdrawalAmount: pendingWd.reduce((s, w) => s + w.amount, 0),
      activeOrders,
      serviceRevenue: paidOrders * SERVICE_FEE,
    };
  }

  static async listSurveyors(status: "PENDING" | "APPROVED" | "REJECTED" | "ALL"): Promise<AdminSurveyorRow[]> {
    const list = await surveyors()
      .find(status === "ALL" ? {} : { "verification.status": status }, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    return list.map((s) => ({
      id: s._id.toString(),
      fullname: s.fullname,
      email: s.email,
      phone: s.phone,
      domicile: s.domicile ? `${s.domicile.district}, ${s.domicile.city}` : "-",
      coverage: s.coverageArea?.districts ?? [],
      experience: s.experience ?? "",
      status: s.verification?.status ?? "PENDING",
      rejectionReason: s.verification?.rejectionReason ?? null,
      reviewedAt: s.verification?.reviewedAt ? new Date(s.verification.reviewedAt).toISOString() : null,
      createdAt: new Date(s.createdAt).toISOString(),
      ktpUrl: signedPrivateUrl(s.documents?.ktpPublicId),
      selfieUrl: signedPrivateUrl(s.documents?.selfiePublicId),
      rating: s.rating ?? { average: 0, count: 0 },
    }));
  }

  static async setVerification(id: ObjectId, status: "APPROVED" | "REJECTED", reason: string | null) {
    const result = await surveyors().updateOne(
      { _id: id },
      {
        $set: {
          "verification.status": status,
          "verification.reviewedAt": new Date(),
          "verification.rejectionReason": status === "REJECTED" ? reason || "Data belum sesuai." : null,
          updatedAt: new Date(),
        },
      },
    );
    if (!result.matchedCount) throw new ApiError(404, "Surveyor tidak ditemukan.");
  }

  static async listWithdrawals(status: "PENDING" | "SUCCESS" | "REJECTED" | "ALL"): Promise<AdminWithdrawalRow[]> {
    const list = await withdrawals()
      .find(status === "ALL" ? {} : { status })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    const names = new Map(
      (
        await surveyors()
          .find({ _id: { $in: list.map((w) => w.surveyorId) } }, { projection: { fullname: 1, email: 1 } })
          .toArray()
      ).map((s) => [s._id.toString(), s]),
    );
    return list.map((w) => ({
      id: w._id.toString(),
      code: w.code,
      amount: w.amount,
      status: w.status,
      surveyor: {
        id: w.surveyorId.toString(),
        name: names.get(w.surveyorId.toString())?.fullname ?? "Surveyor",
        email: names.get(w.surveyorId.toString())?.email ?? "",
      },
      bank: w.bank,
      note: w.note ?? null,
      createdAt: new Date(w.createdAt).toISOString(),
      processedAt: w.processedAt ? new Date(w.processedAt).toISOString() : null,
    }));
  }

  /** Hanya penarikan PENDING yang bisa diproses (aman bila tombol ditekan dua kali). */
  static async processWithdrawal(id: ObjectId, status: "SUCCESS" | "REJECTED", note: string | null) {
    const result = await withdrawals().updateOne(
      { _id: id, status: "PENDING" },
      { $set: { status, processedAt: new Date(), note: note || null } },
    );
    if (!result.matchedCount) throw new ApiError(409, "Penarikan sudah diproses atau tidak ditemukan.");
  }
}

export default AdminModel;
