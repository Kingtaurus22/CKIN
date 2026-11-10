import { ObjectId, type Filter } from "mongodb";
import { getDb } from "../config/mongodb";
import { orderCode, orderLocation } from "./OrderModel";
import type {
  CustomerDocument,
  OrderDocument,
  ReportMedia,
  SurveyReportDocument,
  SurveyReportItem,
  SurveyorDocument,
  WithdrawalDocument,
} from "./types";
import { ApiError } from "@/src/lib/api";
import { rawStatusesFor, toCanonicalStatus, type CanonicalStatus } from "@/src/lib/order-status";
import { surveyorEarning } from "@/src/lib/pricing";
import { HOLD_DAYS, MAX_ACTIVE_ORDERS, SURVEYOR_STATUS } from "@/src/lib/survey";
import type {
  EarningsData,
  ReportItemDraft,
  SurveyorDashboardData,
  SurveyorOrderCard,
  SurveyorOrderDetail,
} from "@/src/types/surveyor";

/**
 * Modul surveyor (Anggota 3): order tersedia, ambil order, order saya,
 * progres survei, laporan, dan penghasilan.
 *
 * Alur status order (field `status`):
 *   WAITING_SURVEYOR → (ambil) ASSIGNED → (mulai) IN_PROGRESS
 *   → (kirim laporan) REPORT_SUBMITTED → (customer kirim ulasan) COMPLETED
 */

const db = () => getDb();
const orders = () => db().collection<OrderDocument>("orders");
const reports = () => db().collection<SurveyReportDocument>("surveyReports");
const withdrawals = () => db().collection<WithdrawalDocument>("surveyorWithdrawals");

const ACTIVE = rawStatusesFor(["ASSIGNED", "IN_PROGRESS"]);
const TZ = "Asia/Jakarta";

function dateKey(value: Date | string) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: TZ });
}

function iso(value: Date | string | undefined | null) {
  return value ? new Date(value).toISOString() : null;
}

function surveyorLabel(status: CanonicalStatus) {
  return SURVEYOR_STATUS[status] ?? { label: "Menunggu surveyor", tone: "info" as const };
}

async function customerNames(ids: ObjectId[]) {
  if (ids.length === 0) return new Map<string, CustomerDocument>();
  const list = await db()
    .collection<CustomerDocument>("customers")
    .find({ _id: { $in: ids } }, { projection: { fullname: 1, phone: 1 } })
    .toArray();
  return new Map(list.map((c) => [c._id.toString(), c]));
}

function toCard(
  order: OrderDocument,
  customers: Map<string, CustomerDocument>,
  revealTargets: boolean,
): SurveyorOrderCard {
  const status = toCanonicalStatus(order.status);
  const label = surveyorLabel(status);
  const customer = customers.get(order.UserId?.toString());
  const req = order.requirements ?? {};
  const isUserChoice = !/RECOM/i.test(order.serviceType ?? "");

  return {
    id: order._id.toString(),
    code: orderCode(order),
    customer: { id: order.UserId?.toString() ?? "", name: customer?.fullname ?? "Customer" },
    location: orderLocation(order),
    district: order.surveyLocation?.district ?? "",
    kosCount: order.kosCount ?? 0,
    serviceType: isUserChoice ? "Pilihan pengguna" : "Rekomendasi surveyor",
    isUserChoice,
    surveyDate: iso(order.surveyDate),
    surveyTimeSlot: order.surveyTimeSlot ?? null,
    status,
    statusLabel: label.label,
    statusTone: label.tone,
    earning: surveyorEarning(order.kosCount ?? 0),
    requirements: {
      genderPreferences: req.genderPreferences ?? null,
      budget: req.budget ?? null,
      facilities: req.facilities ?? [],
      landmark: req.landmark ?? null,
      notes: req.notes ?? null,
    },
    targets: (order.targets ?? []).map((t, i) => ({
      name: t.propertyName ?? t.name ?? `Kos ${i + 1}`,
      address: revealTargets ? (t.address ?? null) : null,
      link: revealTargets ? t.googleMapsUrls || t.link || null : null,
      ownerContact: revealTargets ? t.ownerContact || null : null,
    })),
    createdAt: iso(order.createdAt) ?? new Date().toISOString(),
  };
}

async function toCards(list: OrderDocument[], revealTargets: boolean) {
  const customers = await customerNames(list.map((o) => o.UserId).filter(Boolean));
  return list.map((o) => toCard(o, customers, revealTargets));
}

function toDraftItem(item: SurveyReportItem): ReportItemDraft {
  return {
    kostName: item.kostName ?? "",
    address: item.address ?? "",
    price: typeof item.price === "number" ? item.price : null,
    availability: item.availability ?? "",
    condition: item.condition ?? "",
    notes: item.notes ?? "",
    checkedItems: item.checkedItems ?? [],
    media: (item.media ?? []).map((m) => ({ ...m })),
  };
}

class SurveyorWorkModel {
  static async getSurveyor(surveyorId: ObjectId) {
    const surveyor = await db()
      .collection<SurveyorDocument>("surveyors")
      .findOne({ _id: surveyorId }, { projection: { password: 0, documents: 0 } });
    if (!surveyor) throw new ApiError(404, "Akun surveyor tidak ditemukan.");
    return surveyor;
  }

  // ------------------------------------------------------------------
  // Order tersedia (Open Order) sesuai area jangkauan
  // ------------------------------------------------------------------

  static openFilter(surveyor: SurveyorDocument): Filter<OrderDocument> | null {
    const coverage = surveyor.coverageArea;
    const ids = coverage?.districtIds ?? [];
    const names = coverage?.districts ?? [];
    if (ids.length === 0 && names.length === 0) return null;

    return {
      status: { $in: rawStatusesFor(["WAITING_SURVEYOR"]) },
      SurveyorId: null,
      $or: [
        // Order baru: dicocokkan lewat ID kecamatan.
        ...(ids.length ? [{ "surveyLocation.districtId": { $in: ids } }] : []),
        // Order lama tanpa ID: cocokkan nama kecamatan di kota yang sama.
        ...(names.length
          ? [
              {
                "surveyLocation.districtId": { $exists: false },
                "surveyLocation.city": coverage.city,
                "surveyLocation.district": { $in: names },
              },
            ]
          : []),
      ],
    } as Filter<OrderDocument>;
  }

  static async listOpen(surveyorId: ObjectId) {
    const surveyor = await this.getSurveyor(surveyorId);
    const filter = this.openFilter(surveyor);
    if (!filter) return [];
    const list = await orders().find(filter).sort({ surveyDate: 1, createdAt: 1 }).limit(100).toArray();
    // Alamat & kontak pemilik baru tampil setelah order diambil.
    return toCards(list, false);
  }

  /** Tanggal survei (YYYY-MM-DD, WIB) dari order yang sedang berjalan. */
  static async activeDates(surveyorId: ObjectId) {
    const list = await orders()
      .find({ SurveyorId: surveyorId, status: { $in: ACTIVE } }, { projection: { surveyDate: 1 } })
      .toArray();
    return list.map((o) => dateKey(o.surveyDate));
  }

  static countActive(surveyorId: ObjectId) {
    return orders().countDocuments({ SurveyorId: surveyorId, status: { $in: ACTIVE } });
  }

  /**
   * Ambil order. Aturan (dari Shania):
   * - akun terverifikasi & sedang aktif menerima order
   * - maksimal 3 order berjalan (ASSIGNED / IN_PROGRESS)
   * - tidak boleh ada order lain di tanggal survei yang sama
   * - satu order hanya bisa diambil satu surveyor (update atomik dengan filter SurveyorId: null)
   */
  static async assign(orderId: ObjectId, surveyorId: ObjectId) {
    const surveyor = await this.getSurveyor(surveyorId);
    if (surveyor.verification?.status !== "APPROVED") {
      throw new ApiError(403, "Akunmu belum diverifikasi tim CKIN, jadi belum bisa mengambil order.");
    }
    if (surveyor.acceptingOrders === false) {
      throw new ApiError(409, "Aktifkan \"Aktif menerima order\" di Pengaturan akun terlebih dahulu.");
    }

    const filter = this.openFilter(surveyor);
    const order = filter ? await orders().findOne({ ...filter, _id: orderId }) : null;
    if (!order) throw new ApiError(409, "Order sudah diambil surveyor lain atau tidak tersedia di areamu.");

    const active = await orders()
      .find({ SurveyorId: surveyorId, status: { $in: ACTIVE } }, { projection: { surveyDate: 1 } })
      .toArray();
    if (active.length >= MAX_ACTIVE_ORDERS) {
      throw new ApiError(
        409,
        `Kamu sudah memiliki ${MAX_ACTIVE_ORDERS} order berjalan. Selesaikan salah satu order terlebih dahulu.`,
      );
    }
    if (active.some((o) => dateKey(o.surveyDate) === dateKey(order.surveyDate))) {
      throw new ApiError(409, "Kamu sudah memiliki jadwal survei pada tanggal tersebut.");
    }

    const now = new Date();
    const claimed = await orders().findOneAndUpdate(
      { _id: orderId, SurveyorId: null, status: { $in: rawStatusesFor(["WAITING_SURVEYOR"]) } },
      {
        $set: {
          SurveyorId: surveyorId,
          status: "ASSIGNED",
          assignmentStatus: "ASSIGNED",
          assignedAt: now,
          updatedAt: now,
        },
        $push: {
          statusHistory: {
            status: "ASSIGNED",
            changedAt: now,
            changedBy: surveyorId.toString(),
            reason: `Diambil ${surveyor.fullname}`,
          },
        },
      },
      { returnDocument: "after" },
    );
    if (!claimed) throw new ApiError(409, "Order sudah diambil surveyor lain.");

    // Jaga-jaga dua permintaan bersamaan dari surveyor yang sama melewati batas.
    if ((await this.countActive(surveyorId)) > MAX_ACTIVE_ORDERS) {
      await orders().updateOne(
        { _id: orderId, SurveyorId: surveyorId },
        {
          $set: { SurveyorId: null, status: "WAITING_SURVEYOR", assignmentStatus: "OPEN", updatedAt: new Date() },
          $pull: { statusHistory: { changedAt: now } },
        },
      );
      throw new ApiError(409, `Batas ${MAX_ACTIVE_ORDERS} order berjalan tercapai.`);
    }
    return claimed;
  }

  // ------------------------------------------------------------------
  // Order milik surveyor
  // ------------------------------------------------------------------

  static async listMine(surveyorId: ObjectId) {
    const list = await orders()
      .find({ SurveyorId: surveyorId })
      .sort({ surveyDate: -1, createdAt: -1 })
      .limit(300)
      .toArray();
    return toCards(list, true);
  }

  static async findMine(orderId: ObjectId, surveyorId: ObjectId) {
    const order = await orders().findOne({ _id: orderId, SurveyorId: surveyorId });
    if (!order) throw new ApiError(404, "Order tidak ditemukan.");
    return order;
  }

  static async detail(orderId: ObjectId, surveyorId: ObjectId): Promise<SurveyorOrderDetail> {
    const order = await this.findMine(orderId, surveyorId);
    const customers = await customerNames([order.UserId]);
    const card = toCard(order, customers, true);
    const report = await reports().findOne({ orderId: order._id });

    // Slot laporan = jumlah kos. Pilihan pengguna → nama & alamat terisi dari daftar customer.
    const items: ReportItemDraft[] = Array.from({ length: order.kosCount || 1 }, (_, i) => {
      const saved = report?.items?.[i];
      const target = order.targets?.[i];
      const base = saved ? toDraftItem(saved) : toDraftItem({ kostName: "" });
      return {
        ...base,
        kostName: base.kostName || target?.propertyName || target?.name || "",
        address: base.address || target?.address || "",
      };
    });

    return {
      ...card,
      surveyLocation: order.surveyLocation,
      customerPhone: customers.get(order.UserId.toString())?.phone ?? null,
      moveInDate: iso(order.moveInDate),
      report: {
        status: report ? (report.status ?? "SUBMITTED") : null,
        items,
        updatedAt: iso(report?.updatedAt),
        submittedAt: iso(report?.submittedAt),
      },
    };
  }

  /** Mulai survei (ASSIGNED → IN_PROGRESS). Dipanggil otomatis saat draf pertama disimpan. */
  static async start(orderId: ObjectId, surveyorId: ObjectId) {
    const now = new Date();
    await orders().updateOne(
      { _id: orderId, SurveyorId: surveyorId, status: { $in: rawStatusesFor(["ASSIGNED"]) } },
      {
        $set: { status: "IN_PROGRESS", updatedAt: now },
        $push: { statusHistory: { status: "IN_PROGRESS", changedAt: now, reason: "Survei dimulai" } },
      },
    );
  }

  static assertEditable(order: OrderDocument) {
    const status = toCanonicalStatus(order.status);
    if (status !== "ASSIGNED" && status !== "IN_PROGRESS") {
      throw new ApiError(409, "Laporan sudah dikirim atau order tidak lagi aktif.");
    }
  }

  /** Simpan draf laporan (belum terlihat oleh customer). */
  static async saveDraft(orderId: ObjectId, surveyorId: ObjectId, items: SurveyReportItem[]) {
    const order = await this.findMine(orderId, surveyorId);
    this.assertEditable(order);
    const now = new Date();
    await reports().updateOne(
      { orderId },
      {
        $set: { items, status: "DRAFT", updatedAt: now, surveyorId },
        $setOnInsert: { orderId, submittedAt: null },
      },
      { upsert: true },
    );
    await this.start(orderId, surveyorId);
    return now;
  }

  /** Kirim laporan final → customer bisa melihat laporan (REPORT_SUBMITTED). */
  static async submit(orderId: ObjectId, surveyorId: ObjectId, items: SurveyReportItem[]) {
    const order = await this.findMine(orderId, surveyorId);
    this.assertEditable(order);
    const now = new Date();
    await reports().updateOne(
      { orderId },
      {
        $set: {
          items: items.map((item) => ({
            ...item,
            photos: (item.media ?? []).filter((m) => m.type === "image").map((m) => m.url),
            videos: (item.media ?? []).filter((m) => m.type === "video").map((m) => m.url),
          })),
          status: "SUBMITTED",
          updatedAt: now,
          submittedAt: now,
          surveyorId,
        },
        $setOnInsert: { orderId },
      },
      { upsert: true },
    );
    await orders().updateOne(
      { _id: orderId, SurveyorId: surveyorId },
      {
        $set: { status: "REPORT_SUBMITTED", reportSubmittedAt: now, updatedAt: now },
        $push: { statusHistory: { status: "REPORT_SUBMITTED", changedAt: now, reason: "Laporan survei dikirim" } },
      },
    );
  }

  /** Pastikan file media milik laporan order ini sebelum dihapus. */
  static ownsMedia(orderId: ObjectId, publicId: string) {
    return publicId.startsWith(`ckin/reports/${orderId.toString()}/`);
  }

  // ------------------------------------------------------------------
  // Dashboard & penghasilan
  // ------------------------------------------------------------------

  static async dashboard(surveyorId: ObjectId): Promise<SurveyorDashboardData> {
    const [open, mine] = await Promise.all([this.listOpen(surveyorId), this.listMine(surveyorId)]);
    const now = new Date();
    const monthKey = dateKey(now).slice(0, 7);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const weekStartKey = dateKey(weekStart);
    const weekEndKey = dateKey(new Date(weekStart.getTime() + 6 * 86400000));

    const active = mine.filter((o) => o.status === "ASSIGNED" || o.status === "IN_PROGRESS");
    const earned = await this.earnedOrders(surveyorId);
    const monthOrders = earned.filter((o) => o.reportSubmittedAt && dateKey(o.reportSubmittedAt).startsWith(monthKey));

    return {
      activeCount: active.length,
      weekCount: active.filter((o) => {
        const key = o.surveyDate ? dateKey(o.surveyDate) : "";
        return key >= weekStartKey && key <= weekEndKey;
      }).length,
      openCount: open.length,
      monthIncome: monthOrders.reduce((sum, o) => sum + surveyorEarning(o.kosCount ?? 0), 0),
      monthKos: monthOrders.reduce((sum, o) => sum + (o.kosCount ?? 0), 0),
      completedCount: mine.filter((o) => o.status === "COMPLETED").length,
      openOrders: open.slice(0, 3),
      recentOrders: mine.slice(0, 5),
    };
  }

  /** Order yang laporannya sudah dikirim (pendapatan dihitung dari sini). */
  static earnedOrders(surveyorId: ObjectId) {
    return orders()
      .find({ SurveyorId: surveyorId, status: { $in: rawStatusesFor(["REPORT_SUBMITTED", "COMPLETED"]) } })
      .sort({ reportSubmittedAt: -1, updatedAt: -1 })
      .toArray();
  }

  static async earnings(surveyorId: ObjectId): Promise<EarningsData> {
    const [surveyor, earned, withdrawList] = await Promise.all([
      this.getSurveyor(surveyorId),
      this.earnedOrders(surveyorId),
      withdrawals().find({ surveyorId }).sort({ createdAt: -1 }).limit(50).toArray(),
    ]);

    const now = new Date();
    const month = dateKey(now).slice(0, 7);
    const doneDate = (o: OrderDocument) => o.reportSubmittedAt ?? o.completedAt ?? o.updatedAt;

    // Tersedia = laporan diterima customer (COMPLETED) ATAU sudah lewat HOLD_DAYS sejak laporan dikirim
    // (customer tidak memberi ulasan → dianggap diterima). Tertahan = laporan terkirim, masih masa review.
    // Order yang masih berjalan belum dihitung sebagai pendapatan.
    const releaseBefore = Date.now() - HOLD_DAYS * 86400000;
    const isReleased = (o: OrderDocument) =>
      toCanonicalStatus(o.status) === "COMPLETED" ||
      new Date(o.reportSubmittedAt ?? o.updatedAt).getTime() <= releaseBefore;
    const completed = earned.filter(isReleased);
    const waitingReview = earned.filter((o) => !isReleased(o));
    const totalCompleted = completed.reduce((s, o) => s + surveyorEarning(o.kosCount ?? 0), 0);
    const withdrawn = withdrawList
      .filter((w) => w.status !== "REJECTED")
      .reduce((s, w) => s + w.amount, 0);
    const heldOrders = waitingReview;

    const monthOrders = earned.filter((o) => dateKey(doneDate(o)).startsWith(month));

    // Tren 6 bulan terakhir.
    const trend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 - (5 - i), 1));
      const key = d.toISOString().slice(0, 7);
      const amount = earned
        .filter((o) => dateKey(doneDate(o)).startsWith(key))
        .reduce((s, o) => s + surveyorEarning(o.kosCount ?? 0), 0);
      return {
        key,
        label: d.toLocaleDateString("id-ID", { month: "short", timeZone: "UTC" }),
        amount,
      };
    });

    return {
      month,
      monthIncome: monthOrders.reduce((s, o) => s + surveyorEarning(o.kosCount ?? 0), 0),
      monthKos: monthOrders.reduce((s, o) => s + (o.kosCount ?? 0), 0),
      available: Math.max(totalCompleted - withdrawn, 0),
      held: heldOrders.reduce((s, o) => s + surveyorEarning(o.kosCount ?? 0), 0),
      heldKos: heldOrders.reduce((s, o) => s + (o.kosCount ?? 0), 0),
      trend,
      rows: earned.slice(0, 50).map((o) => ({
        id: o._id.toString(),
        code: orderCode(o),
        kosCount: o.kosCount ?? 0,
        district: o.surveyLocation?.district ?? "",
        earning: surveyorEarning(o.kosCount ?? 0),
        state: isReleased(o) ? "Tersedia" : "Tertahan",
        releaseAt: isReleased(o)
          ? null
          : new Date(new Date(o.reportSubmittedAt ?? o.updatedAt).getTime() + HOLD_DAYS * 86400000).toISOString(),
        date: iso(doneDate(o)),
      })),
      payoutAccount: surveyor.payoutAccount ?? null,
      withdrawals: withdrawList.map((w) => ({
        id: w._id.toString(),
        code: w.code,
        amount: w.amount,
        status: w.status,
        bankName: w.bank.bankName,
        accountTail: w.bank.accountNumber.slice(-4),
        createdAt: new Date(w.createdAt).toISOString(),
        processedAt: w.processedAt ? new Date(w.processedAt).toISOString() : null,
        note: w.note ?? null,
      })),
    };
  }

  /**
   * Ajukan penarikan dana. Dana diproses tim CKIN (status PENDING → SUCCESS).
   * Rekening disimpan sebagai rekening default surveyor.
   */
  static async requestWithdrawal(
    surveyorId: ObjectId,
    amount: number,
    bank: { bankName: string; accountNumber: string; accountHolder: string },
  ) {
    const { available } = await this.earnings(surveyorId);
    if (amount > available) {
      throw new ApiError(409, "Nominal melebihi saldo yang dapat ditarik.");
    }
    const pending = await withdrawals().countDocuments({ surveyorId, status: "PENDING" });
    if (pending > 0) {
      throw new ApiError(409, "Masih ada penarikan yang sedang diproses. Tunggu hingga selesai.");
    }

    const now = new Date();
    const code = `WD-${dateKey(now).replace(/-/g, "").slice(2)}${Math.floor(Math.random() * 900 + 100)}`;
    await withdrawals().insertOne({
      _id: new ObjectId(),
      surveyorId,
      code,
      amount,
      bank,
      status: "PENDING",
      createdAt: now,
      processedAt: null,
    });
    await db()
      .collection<SurveyorDocument>("surveyors")
      .updateOne({ _id: surveyorId }, { $set: { payoutAccount: bank, updatedAt: now } });
    return code;
  }
}

export type { ReportMedia };
export default SurveyorWorkModel;
