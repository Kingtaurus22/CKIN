import type { CanonicalStatus, StatusTone } from "@/src/lib/order-status";

/** Bentuk response API untuk halaman surveyor (Anggota 3). */

export type SurveyorOrderCard = {
  id: string;
  code: string;
  customer: { id: string; name: string };
  location: string;
  district: string;
  kosCount: number;
  serviceType: "Rekomendasi surveyor" | "Pilihan pengguna";
  isUserChoice: boolean;
  surveyDate: string | null;
  surveyTimeSlot: string | null;
  status: CanonicalStatus;
  statusLabel: string;
  statusTone: StatusTone;
  earning: number;
  requirements: {
    genderPreferences: string | null;
    budget: { min?: number; max?: number } | null;
    facilities: string[];
    landmark: string | null;
    notes: string | null;
  };
  /** Order tersedia: hanya nama kos; alamat & kontak tampil setelah order diambil. */
  targets: Array<{ name: string; address: string | null; link: string | null; ownerContact: string | null }>;
  createdAt: string;
};

export type ReportMediaView = {
  url: string;
  publicId: string;
  name: string;
  size: number;
  type: "image" | "video";
};

export type ReportItemDraft = {
  kostName: string;
  address: string;
  price: number | null;
  availability: string;
  condition: string;
  notes: string;
  checkedItems: string[];
  media: ReportMediaView[];
};

export type SurveyorOrderDetail = SurveyorOrderCard & {
  surveyLocation: { province: string; city: string; district: string };
  customerPhone: string | null;
  moveInDate: string | null;
  report: {
    status: "DRAFT" | "SUBMITTED" | null;
    items: ReportItemDraft[];
    updatedAt: string | null;
    submittedAt: string | null;
  };
};

export type SurveyorDashboardData = {
  activeCount: number;
  weekCount: number;
  openCount: number;
  monthIncome: number;
  monthKos: number;
  completedCount: number;
  openOrders: SurveyorOrderCard[];
  recentOrders: SurveyorOrderCard[];
};

export type EarningsData = {
  month: string; // "2026-11"
  monthIncome: number;
  monthKos: number;
  available: number;
  held: number;
  heldKos: number;
  trend: Array<{ key: string; label: string; amount: number }>;
  rows: Array<{
    id: string;
    code: string;
    kosCount: number;
    district: string;
    earning: number;
    state: "Tersedia" | "Tertahan";
    /** Kapan dana tertahan otomatis dilepas (null bila sudah tersedia). */
    releaseAt: string | null;
    date: string | null;
  }>;
  payoutAccount: { bankName: string; accountNumber: string; accountHolder: string } | null;
  withdrawals: Array<{
    id: string;
    code: string;
    amount: number;
    status: "PENDING" | "SUCCESS" | "REJECTED";
    bankName: string;
    accountTail: string;
    createdAt: string;
    processedAt: string | null;
    /** Catatan admin, mis. alasan penolakan. */
    note: string | null;
  }>;
};
