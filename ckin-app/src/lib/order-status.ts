/**
 * Kontrak status pesanan antara Anggota 2 (order & payment), Anggota 3 (survei)
 * dan Anggota 4 (tampilan customer).
 *
 * Status resmi di field `orders.status`:
 *   PENDING_PAYMENT   → order dibuat, belum dibayar
 *   WAITING_SURVEYOR  → sudah dibayar, menunggu diambil surveyor (Open Order)
 *   ASSIGNED          → sudah diambil surveyor
 *   IN_PROGRESS       → surveyor sedang melakukan survei
 *   REPORT_SUBMITTED  → laporan dikirim surveyor
 *   COMPLETED         → customer sudah menerima laporan & memberi ulasan
 *   CANCELLED         → dibatalkan
 *   EXPIRED           → tidak dibayar sampai batas waktu
 *
 * Beberapa alias umum ikut dikenali agar tetap aman bila ada perbedaan penamaan.
 */

export type CanonicalStatus =
  | "PENDING_PAYMENT"
  | "WAITING_SURVEYOR"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "REPORT_SUBMITTED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

const ALIASES: Record<string, CanonicalStatus> = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PENDING: "PENDING_PAYMENT",
  UNPAID: "PENDING_PAYMENT",
  WAITING_PAYMENT: "PENDING_PAYMENT",
  WAITING_SURVEYOR: "WAITING_SURVEYOR",
  PAID: "WAITING_SURVEYOR",
  OPEN: "WAITING_SURVEYOR",
  ASSIGNED: "ASSIGNED",
  ACCEPTED: "ASSIGNED",
  TAKEN: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  ON_PROGRESS: "IN_PROGRESS",
  ON_SURVEY: "IN_PROGRESS",
  SURVEYING: "IN_PROGRESS",
  REPORT_SUBMITTED: "REPORT_SUBMITTED",
  REPORTED: "REPORT_SUBMITTED",
  COMPLETED: "COMPLETED",
  DONE: "COMPLETED",
  FINISHED: "COMPLETED",
  CANCELLED: "CANCELLED",
  CANCELED: "CANCELLED",
  EXPIRED: "EXPIRED",
};

export function toCanonicalStatus(status: string | undefined | null): CanonicalStatus {
  return ALIASES[(status ?? "").toUpperCase()] ?? "PENDING_PAYMENT";
}

export type StatusTone = "warning" | "info" | "success" | "danger" | "muted";

export const STATUS_LABEL: Record<CanonicalStatus, string> = {
  PENDING_PAYMENT: "Belum dibayar",
  WAITING_SURVEYOR: "Menunggu surveyor",
  ASSIGNED: "Dalam proses",
  IN_PROGRESS: "Dalam proses",
  REPORT_SUBMITTED: "Laporan diterima",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Kedaluwarsa",
};

export const STATUS_TONE: Record<CanonicalStatus, StatusTone> = {
  PENDING_PAYMENT: "warning",
  WAITING_SURVEYOR: "info",
  ASSIGNED: "info",
  IN_PROGRESS: "info",
  REPORT_SUBMITTED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  EXPIRED: "muted",
};

/** Kelompok untuk tab filter di dashboard & daftar pesanan. */
export type OrderFilter = "all" | "active" | "completed" | "other";

export function statusGroup(status: CanonicalStatus): Exclude<OrderFilter, "all"> {
  if (status === "COMPLETED") return "completed";
  if (status === "CANCELLED" || status === "EXPIRED") return "other";
  return "active";
}

export function statusesForFilter(filter: OrderFilter): CanonicalStatus[] | null {
  if (filter === "all") return null;
  return (Object.keys(STATUS_LABEL) as CanonicalStatus[]).filter(
    (status) => statusGroup(status) === filter,
  );
}

/** Semua nilai mentah (termasuk alias) yang masuk ke daftar status kanonik. */
export function rawStatusesFor(statuses: CanonicalStatus[]): string[] {
  return Object.entries(ALIASES)
    .filter(([, canonical]) => statuses.includes(canonical))
    .flatMap(([raw]) => [raw, raw.toLowerCase()]);
}

export type PaymentLabel = "Belum dibayar" | "Sudah dibayar" | "Dikembalikan";

export function paymentLabel(
  paymentStatus: string | undefined,
  paidAt: Date | string | undefined,
  status: CanonicalStatus,
): PaymentLabel {
  const value = (paymentStatus ?? "").toLowerCase();
  if (value.includes("refund")) return "Dikembalikan";
  if (
    paidAt ||
    ["settlement", "capture", "paid", "success"].includes(value) ||
    ["WAITING_SURVEYOR", "ASSIGNED", "IN_PROGRESS", "REPORT_SUBMITTED", "COMPLETED"].includes(
      status,
    )
  ) {
    return "Sudah dibayar";
  }
  return "Belum dibayar";
}

export type JourneyStep = {
  key: "payment" | "survey" | "report" | "done";
  label: string;
  state: "done" | "current" | "pending" | "stopped";
  caption: string;
};

/** Empat tahap "Perjalanan pesanan" sesuai Figma. */
export function buildJourney(status: CanonicalStatus): JourneyStep[] {
  const order: CanonicalStatus[] = [
    "PENDING_PAYMENT",
    "WAITING_SURVEYOR",
    "ASSIGNED",
    "IN_PROGRESS",
    "REPORT_SUBMITTED",
    "COMPLETED",
  ];
  const index = order.indexOf(status);
  const stopped = status === "CANCELLED" || status === "EXPIRED";

  const step = (
    key: JourneyStep["key"],
    label: string,
    doneFrom: number,
    currentAt: number[],
    captions: { done: string; current: string; pending: string },
  ): JourneyStep => {
    if (stopped) {
      return {
        key,
        label,
        state: key === "payment" ? "stopped" : "pending",
        caption: key === "payment" ? STATUS_LABEL[status] : "Tidak dilanjutkan",
      };
    }
    if (index >= doneFrom) return { key, label, state: "done", caption: captions.done };
    if (currentAt.includes(index)) {
      return { key, label, state: "current", caption: captions.current };
    }
    return { key, label, state: "pending", caption: captions.pending };
  };

  return [
    step("payment", "Pembayaran", 1, [0], {
      done: "Berhasil",
      current: "Menunggu",
      pending: "Menunggu",
    }),
    step("survey", "Survei", 4, [1, 2, 3], {
      done: "Selesai",
      current: index === 1 ? "Mencari surveyor" : index === 2 ? "Surveyor ditugaskan" : "Sedang berjalan",
      pending: "Belum dimulai",
    }),
    step("report", "Laporan", 5, [4], {
      done: "Diterima",
      current: "Diterima · beri ulasan",
      pending: "Belum diterima",
    }),
    step("done", "Selesai", 5, [], {
      done: "Selesai",
      current: "Setelah ulasan",
      pending: "Setelah ulasan",
    }),
  ];
}
