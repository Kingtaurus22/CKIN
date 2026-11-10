import type { CanonicalStatus, StatusTone } from "./order-status";

/** Checklist pemeriksaan kos (Figma "Kelola survei" — Shania). */
export const CHECKLIST_GROUPS = [
  { title: "Kondisi", icon: "home" as const, items: ["Dinding & lantai", "Ventilasi & cahaya", "Air & kamar mandi"] },
  { title: "Fasilitas", icon: "wifi" as const, items: ["Wi-Fi & sinyal", "Listrik & biaya", "Parkir & keamanan"] },
  { title: "Lingkungan", icon: "pin" as const, items: ["Akses jalan", "Kebisingan sekitar"] },
];
export const CHECKLIST_ITEMS = CHECKLIST_GROUPS.flatMap((g) => g.items);

export const AVAILABILITY_OPTIONS = [
  "1 kamar kosong",
  "2 kamar kosong",
  "3 kamar kosong",
  "Lebih dari 3 kamar kosong",
  "Penuh / tidak tersedia",
];

/** Maksimal order yang sedang dikerjakan (ASSIGNED + IN_PROGRESS) per surveyor. */
export const MAX_ACTIVE_ORDERS = 3;

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/**
 * Dana tertahan: pendapatan order yang laporannya sudah dikirim tetapi belum
 * diterima customer. Dilepas ke saldo saat customer memberi ulasan, atau
 * otomatis setelah HOLD_DAYS hari tanpa keluhan.
 */
export const HOLD_DAYS = 3;

/** Penarikan dana surveyor. */
export const MIN_WITHDRAWAL = 50000;

/** Label status dari sisi surveyor (Figma "Order survei"). */
export const SURVEYOR_STATUS: Partial<Record<CanonicalStatus, { label: string; tone: StatusTone }>> = {
  ASSIGNED: { label: "Terjadwal", tone: "muted" },
  IN_PROGRESS: { label: "Dalam proses", tone: "info" },
  REPORT_SUBMITTED: { label: "Menunggu review", tone: "warning" },
  COMPLETED: { label: "Selesai", tone: "success" },
  CANCELLED: { label: "Dibatalkan", tone: "danger" },
  EXPIRED: { label: "Dibatalkan", tone: "danger" },
};

export type SurveyorTab = "all" | "scheduled" | "progress" | "review" | "done";

export function surveyorTab(status: CanonicalStatus): Exclude<SurveyorTab, "all"> | null {
  if (status === "ASSIGNED") return "scheduled";
  if (status === "IN_PROGRESS") return "progress";
  if (status === "REPORT_SUBMITTED") return "review";
  if (status === "COMPLETED") return "done";
  return null;
}
