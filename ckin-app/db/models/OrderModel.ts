import { ObjectId, type Filter } from "mongodb";
import { getDb } from "../config/mongodb";
import WalletModel from "./WalletModel";
import SurveyorModel from "./SurveyorModel";
import type { OrderDocument, SurveyorDocument, WalletTransactionDocument } from "./types";
import { PAYMENT_WINDOW_HOURS, orderTotal } from "@/src/lib/pricing";
import type { CreateOrderData } from "@/src/schemas/order";
import {
  STATUS_LABEL,
  STATUS_TONE,
  buildJourney,
  paymentLabel,
  rawStatusesFor,
  statusGroup,
  statusesForFilter,
  toCanonicalStatus,
  type OrderFilter,
} from "@/src/lib/order-status";
import type {
  CustomerOrderDetail,
  CustomerOrderSummary,
  OrderCounts,
} from "@/src/types/customer";

/**
 * Akses koleksi `orders`.
 * - Anggota 2: membuat pesanan, area tersedia, pembayaran (Midtrans / Saldo CKIN)
 * - Anggota 4: daftar, detail, timeline, pembatalan oleh customer
 * Pengambilan order & progres survei ada di modul Anggota 3.
 */

export function toObjectId(id: string): ObjectId | null {
  return ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id) ? new ObjectId(id) : null;
}

export function orderCode(order: Pick<OrderDocument, "_id" | "orderCode">) {
  return order.orderCode ?? `CKIN-${order._id.toString().slice(-6).toUpperCase()}`;
}

export function orderLocation(order: Pick<OrderDocument, "surveyLocation">) {
  const loc = order.surveyLocation;
  if (!loc) return "-";
  const city = (loc.city ?? "").replace(/^(KABUPATEN|KAB\.?|KOTA)\s+/i, "");
  return [loc.district, city].filter(Boolean).map(titleCase).join(", ");
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function paidTotal(order: OrderDocument) {
  return normalizePricing(order).total;
}

function normalizePricing(order: OrderDocument) {
  const pricing = order.pricing;
  if (typeof pricing === "number") {
    const serviceFee = 5000;
    const subtotal = Math.max(pricing - serviceFee, 0);
    return {
      perKos: order.kosCount ? Math.round(subtotal / order.kosCount) : subtotal,
      serviceFee,
      total: pricing,
    };
  }
  const perKos = pricing?.perKos ?? 0;
  const serviceFee = pricing?.serviceFee ?? 0;
  return {
    perKos,
    serviceFee,
    total: pricing?.total ?? perKos * (order.kosCount ?? 0) + serviceFee,
  };
}

function iso(value: Date | string | undefined | null) {
  return value ? new Date(value).toISOString() : null;
}

function toSummary(
  order: OrderDocument,
  surveyors: Map<string, SurveyorDocument>,
): CustomerOrderSummary {
  const status = toCanonicalStatus(order.status);
  const surveyor = order.SurveyorId ? surveyors.get(order.SurveyorId.toString()) : undefined;

  return {
    id: order._id.toString(),
    code: orderCode(order),
    location: orderLocation(order),
    kosCount: order.kosCount ?? 0,
    serviceType:
      /RECOM/i.test(order.serviceType ?? "")
        ? "Rekomendasi surveyor"
        : "Pilihan pengguna",
    surveyDate: iso(order.surveyDate),
    surveyTimeSlot: order.surveyTimeSlot ?? null,
    createdAt: iso(order.createdAt) ?? new Date().toISOString(),
    status,
    statusLabel: STATUS_LABEL[status],
    statusTone: STATUS_TONE[status],
    payment: paymentLabel(order.payment?.paymentStatus, order.paidAt, status),
    total: normalizePricing(order).total,
    surveyor: surveyor ? { id: surveyor._id.toString(), name: surveyor.fullname } : null,
  };
}

class OrderModel {
  static collection() {
    return getDb().collection<OrderDocument>("orders");
  }

  static customerFilter(customerId: ObjectId, filter: OrderFilter = "all"): Filter<OrderDocument> {
    const statuses = statusesForFilter(filter);
    return {
      UserId: customerId,
      ...(statuses ? { status: { $in: rawStatusesFor(statuses) } } : {}),
    };
  }

  static async listForCustomer(
    customerId: ObjectId,
    options: { filter?: OrderFilter; limit?: number; search?: string } = {},
  ) {
    const query = this.customerFilter(customerId, options.filter);

    if (options.search) {
      const pattern = new RegExp(options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { orderCode: pattern },
        { "surveyLocation.district": pattern },
        { "surveyLocation.city": pattern },
      ];
    }

    const cursor = this.collection().find(query).sort({ createdAt: -1 });
    if (options.limit) cursor.limit(options.limit);
    const orders = await cursor.toArray();

    const surveyorIds = orders
      .map((order) => order.SurveyorId)
      .filter((id): id is ObjectId => Boolean(id));
    const surveyors = await SurveyorModel.findNamesByIds(surveyorIds);

    return orders.map((order) => toSummary(order, surveyors));
  }

  static async countsForCustomer(customerId: ObjectId): Promise<OrderCounts> {
    const grouped = await this.collection()
      .aggregate<{ _id: string; count: number }>([
        { $match: { UserId: customerId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray();

    const counts: OrderCounts = { all: 0, active: 0, completed: 0, other: 0, unpaid: 0 };
    for (const row of grouped) {
      const status = toCanonicalStatus(row._id);
      counts.all += row.count;
      counts[statusGroup(status)] += row.count;
      if (status === "PENDING_PAYMENT") counts.unpaid += row.count;
    }
    return counts;
  }

  static findOwnedByCustomer(orderId: ObjectId, customerId: ObjectId) {
    return this.collection().findOne({ _id: orderId, UserId: customerId });
  }

  /** Order yang boleh diakses user (customer pemilik atau surveyor yang ditugaskan). */
  static findForParticipant(orderId: ObjectId, userId: ObjectId, role: "customer" | "surveyor") {
    return this.collection().findOne(
      role === "customer" ? { _id: orderId, UserId: userId } : { _id: orderId, SurveyorId: userId },
    );
  }

  static async toDetail(order: OrderDocument, hasReport: boolean): Promise<CustomerOrderDetail> {
    const surveyor = order.SurveyorId ? await SurveyorModel.findById(order.SurveyorId) : null;
    const surveyorMap = new Map<string, SurveyorDocument>();
    if (surveyor) surveyorMap.set(surveyor._id.toString(), surveyor);

    const summary = toSummary(order, surveyorMap);
    const status = summary.status;
    const req = order.requirements ?? {};

    return {
      ...summary,
      surveyLocation: order.surveyLocation,
      moveInDate: iso(order.moveInDate),
      expiresAt: iso(order.expiresAt),
      pricing: normalizePricing(order),
      requirements: {
        facilities: req.facilities ?? [],
        budget: req.budget ?? null,
        genderPreferences: req.genderPreferences ?? null,
        landmark: req.landmark ?? null,
        notes: req.notes ?? null,
      },
      targets: (order.targets ?? []).map((t, index) => ({
        name: t.propertyName ?? t.name ?? `Kos ${index + 1}`,
        address: t.address ?? "",
        link: t.googleMapsUrls || t.link || null,
        ownerContact: t.ownerContact || null,
      })),
      surveyorDetail: surveyor
        ? {
            id: surveyor._id.toString(),
            name: surveyor.fullname,
            district: surveyor.domicile?.district ?? "",
            city: surveyor.domicile?.city ?? "",
            rating: surveyor.rating ?? { average: 0, count: 0 },
          }
        : null,
      journey: buildJourney(status),
      history: (order.statusHistory ?? [])
        .slice()
        .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
        .map((entry) => ({
          status: entry.status,
          label: STATUS_LABEL[toCanonicalStatus(entry.status)],
          at: new Date(entry.changedAt).toISOString(),
          note: entry.reason ?? null,
        })),
      canCancel:
        !order.SurveyorId && (status === "PENDING_PAYMENT" || status === "WAITING_SURVEYOR"),
      canChat: Boolean(order.SurveyorId) && status !== "CANCELLED" && status !== "EXPIRED",
      hasReport,
    };
  }

  /**
   * Customer membatalkan pesanan yang BELUM diambil surveyor.
   * Pengembalian dana untuk order yang sudah dibayar diproses modul pembayaran (Anggota 2).
   */
  static async cancelByCustomer(orderId: ObjectId, customerId: ObjectId) {
    const now = new Date();
    const cancellable = rawStatusesFor(["PENDING_PAYMENT", "WAITING_SURVEYOR"]);

    const updated = await this.collection().findOneAndUpdate(
      {
        _id: orderId,
        UserId: customerId,
        SurveyorId: null,
        status: { $in: cancellable },
      },
      {
        $set: {
          status: "CANCELLED",
          assignmentStatus: "CANCELLED",
          cancelledAt: now,
          updatedAt: now,
        },
        $push: {
          statusHistory: {
            status: "CANCELLED",
            changedAt: now,
            changedBy: customerId.toString(),
            reason: "Dibatalkan oleh customer",
          },
        },
      },
      { returnDocument: "after" },
    );

    if (updated) {
      // Pesanan yang sudah dibayar (saldo maupun Midtrans) → refund penuh ke Saldo CKIN.
      let refunded = 0;
      if (updated.payment?.paymentStatus === "PAID" || updated.paidAt) {
        const total = normalizePricing(updated).total;
        if (await WalletModel.refundOrder(updated, total, orderCode(updated))) refunded = total;
        await this.collection().updateOne(
          { _id: updated._id },
          { $set: { "payment.paymentStatus": "REFUNDED", refundedAt: now } },
        );
      }
      return { success: true as const, order: updated, refunded };
    }

    const order = await this.findOwnedByCustomer(orderId, customerId);
    if (!order) return { success: false as const, reason: "NOT_FOUND" as const };
    if (order.SurveyorId) return { success: false as const, reason: "ALREADY_ASSIGNED" as const };
    return { success: false as const, reason: "NOT_CANCELLABLE" as const };
  }

  /** Setelah customer memberi ulasan, pesanan dinyatakan selesai. */
  static async markCompletedAfterReview(orderId: ObjectId, customerId: ObjectId) {
    const now = new Date();
    return this.collection().updateOne(
      {
        _id: orderId,
        UserId: customerId,
        status: { $in: rawStatusesFor(["REPORT_SUBMITTED"]) },
      },
      {
        $set: { status: "COMPLETED", updatedAt: now },
        $push: {
          statusHistory: {
            status: "COMPLETED",
            changedAt: now,
            changedBy: customerId.toString(),
            reason: "Customer mengirim ulasan",
          },
        },
      },
    );
  }

  // ------------------------------------------------------------------
  // Anggota 2 — pembuatan pesanan & pembayaran
  // ------------------------------------------------------------------

  /** Kode pesanan pendek untuk ditampilkan, mis. "CKIN-7QK2MD". */
  static generateCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    return `CKIN-${code}`;
  }

  static async create(customerId: ObjectId, data: CreateOrderData) {
    const now = new Date();
    const isChoice = data.serviceType === "USER_CHOICE";
    const doc: OrderDocument = {
      _id: new ObjectId(),
      orderCode: this.generateCode(),
      UserId: customerId,
      SurveyorId: null,
      serviceType: data.serviceType,
      surveyLocation: data.surveyLocation,
      kosCount: data.kosCount,
      requirements: isChoice
        ? { notes: data.requirements.notes }
        : {
            genderPreferences: data.requirements.genderPreferences,
            budget: data.requirements.budget,
            facilities: data.requirements.facilities,
            landmark: data.requirements.landmark,
            notes: data.requirements.notes,
          },
      targets: isChoice ? data.targets : [],
      // Disimpan pukul 00.00 WIB pada tanggal yang dipilih.
      surveyDate: new Date(`${data.surveyDate}T00:00:00+07:00`),
      surveyTimeSlot: data.surveyTimeSlot,
      moveInDate: new Date(`${data.moveInDate}T00:00:00+07:00`),
      assignmentStatus: "OPEN",
      status: "PENDING_PAYMENT",
      payment: { provider: "MIDTRANS", paymentStatus: "UNPAID" },
      pricing: orderTotal(data.kosCount),
      expiresAt: new Date(now.getTime() + PAYMENT_WINDOW_HOURS * 3600000),
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        { status: "PENDING_PAYMENT", changedAt: now, changedBy: customerId.toString(), reason: "Pesanan dibuat" },
      ],
    };
    await this.collection().insertOne(doc);
    return doc;
  }

  /** Pesanan belum dibayar yang lewat batas waktu → EXPIRED. */
  static async expireOverdue(customerId?: ObjectId) {
    const now = new Date();
    await this.collection().updateMany(
      {
        ...(customerId ? { UserId: customerId } : {}),
        status: { $in: rawStatusesFor(["PENDING_PAYMENT"]) },
        expiresAt: { $lt: now },
      },
      {
        $set: {
          status: "EXPIRED",
          assignmentStatus: "CANCELLED",
          "payment.paymentStatus": "EXPIRED",
          updatedAt: now,
        },
        $push: {
          statusHistory: { status: "EXPIRED", changedAt: now, reason: "Batas waktu pembayaran terlewati" },
        },
      },
    );
  }

  /** Simpan sesi pembayaran Midtrans (Snap) pada pesanan. */
  static saveMidtransSession(
    orderId: ObjectId,
    session: { midtransOrderId: string; snapToken: string; redirectUrl: string; method: string },
  ) {
    return this.collection().updateOne(
      { _id: orderId },
      {
        $set: {
          payment: {
            provider: "MIDTRANS",
            method: session.method,
            midtransOrderId: session.midtransOrderId,
            snapToken: session.snapToken,
            redirectUrl: session.redirectUrl,
            paymentStatus: "PENDING",
          },
          updatedAt: new Date(),
        },
      },
    );
  }

  static findByMidtransOrderId(midtransOrderId: string) {
    return this.collection().findOne({ "payment.midtransOrderId": midtransOrderId });
  }

  /**
   * Tandai pesanan lunas (dipanggil webhook Midtrans atau pembayaran Saldo CKIN).
   * Hanya berlaku untuk pesanan yang masih PENDING_PAYMENT → aman dipanggil berulang.
   */
  static async markPaid(
    filter: { _id: ObjectId } | { "payment.midtransOrderId": string },
    payment: Record<string, unknown>,
  ) {
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- path bertitik (payment.x) untuk $set
    const set: Record<string, any> = {
      status: "WAITING_SURVEYOR",
      assignmentStatus: "OPEN",
      paidAt: now,
      updatedAt: now,
      "payment.paymentStatus": "PAID",
    };
    for (const [key, value] of Object.entries(payment)) set[`payment.${key}`] = value;

    return this.collection().findOneAndUpdate(
      { ...filter, status: { $in: rawStatusesFor(["PENDING_PAYMENT"]) } },
      {
        $set: set,
        $push: {
          statusHistory: { status: "WAITING_SURVEYOR", changedAt: now, reason: "Pembayaran berhasil" },
        },
      },
      { returnDocument: "after" },
    );
  }

  /** Perbarui status pembayaran tanpa melunasi (pending / gagal / kedaluwarsa). */
  static updatePaymentStatus(midtransOrderId: string, payment: Record<string, unknown>, expire = false) {
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- path bertitik (payment.x) untuk $set
    const set: Record<string, any> = { updatedAt: now };
    for (const [key, value] of Object.entries(payment)) set[`payment.${key}`] = value;
    if (expire) {
      set.status = "EXPIRED";
      set.assignmentStatus = "CANCELLED";
    }
    return this.collection().updateOne(
      {
        "payment.midtransOrderId": midtransOrderId,
        status: { $in: rawStatusesFor(["PENDING_PAYMENT"]) },
      },
      expire
        ? {
            $set: set,
            $push: { statusHistory: { status: "EXPIRED", changedAt: now, reason: "Pembayaran kedaluwarsa" } },
          }
        : { $set: set },
    );
  }

  /**
   * Bayar memakai Saldo CKIN: cek saldo → lunasi pesanan secara atomik →
   * catat transaksi keluar di walletTransactions.
   */
  static async payWithWallet(order: OrderDocument, balance: number) {
    const total = normalizePricing(order).total;
    if (balance < total) return { success: false as const, reason: "INSUFFICIENT_BALANCE" as const };

    const paid = await this.markPaid({ _id: order._id }, { provider: "SALDO", method: "saldo" });
    if (!paid) return { success: false as const, reason: "NOT_PAYABLE" as const };

    const trx: WalletTransactionDocument = {
      _id: new ObjectId(),
      customerId: order.UserId,
      type: "out",
      category: "payment",
      amount: total,
      description: "Pembayaran survei",
      reference: `#${orderCode(order)}`,
      method: "Saldo CKIN",
      status: "SUCCESS",
      orderId: order._id,
      createdAt: new Date(),
    };
    await getDb().collection<WalletTransactionDocument>("walletTransactions").insertOne(trx);
    return { success: true as const, order: paid };
  }
}

export default OrderModel;
