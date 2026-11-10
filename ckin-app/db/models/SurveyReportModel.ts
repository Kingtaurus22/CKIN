import type { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import type { ReviewDocument, SurveyReportDocument } from "./types";

/**
 * Koleksi `surveyReports` ditulis oleh modul surveyor (Anggota 3).
 * Di sini hanya dibaca untuk halaman hasil laporan customer.
 */
class SurveyReportModel {
  static collection() {
    return getDb().collection<SurveyReportDocument>("surveyReports");
  }

  /** Draf surveyor belum boleh terlihat customer. Dokumen lama tanpa `status` dianggap terkirim. */
  static submittedFilter(orderId: ObjectId) {
    return { orderId, status: { $ne: "DRAFT" as const } };
  }

  static findByOrderId(orderId: ObjectId) {
    return this.collection().findOne(this.submittedFilter(orderId), { sort: { submittedAt: -1 } });
  }

  static async existsForOrder(orderId: ObjectId) {
    return (await this.collection().countDocuments(this.submittedFilter(orderId), { limit: 1 })) > 0;
  }
}

export class ReviewModel {
  static collection() {
    return getDb().collection<ReviewDocument>("reviews");
  }

  static findByOrderId(orderId: ObjectId) {
    return this.collection().findOne({ orderId });
  }

  /** Simpan ulasan (satu order hanya boleh satu ulasan) dan perbarui rating surveyor. */
  static async create(input: Omit<ReviewDocument, "_id" | "createdAt">) {
    await this.collection()
      .createIndex({ orderId: 1 }, { unique: true, name: "ckin_review_order_unique" })
      .catch((error) => console.warn("[ckin] Index reviews belum bisa dibuat:", error?.message));

    if (await this.findByOrderId(input.orderId)) {
      throw Object.assign(new Error("duplicate review"), { code: 11000, keyPattern: { orderId: 1 } });
    }

    const result = await this.collection().insertOne({
      ...input,
      createdAt: new Date(),
    } as ReviewDocument);

    const [stats] = await this.collection()
      .aggregate<{ average: number; count: number }>([
        { $match: { surveyorId: input.surveyorId } },
        { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
      ])
      .toArray();

    if (stats) {
      await getDb()
        .collection("surveyors")
        .updateOne(
          { _id: input.surveyorId },
          {
            $set: {
              rating: { average: Math.round(stats.average * 10) / 10, count: stats.count },
            },
          },
        );
    }

    return result.insertedId;
  }
}

export default SurveyReportModel;
