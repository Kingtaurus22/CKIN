/**
 * Shared response contracts for the Anggota 4 screens.
 * These types are intentionally transport-agnostic so mock data can later be
 * replaced by the agreed API responses without changing the UI components.
 */
export type OrderStatus =
  | "Belum dibayar"
  | "Menunggu surveyor"
  | "Dalam proses"
  | "Laporan diterima"
  | "Selesai"
  | "Dibatalkan"
  | "Kedaluwarsa";

export interface CustomerOrderSummary {
  id: string;
  customerId: string;
  surveyorId: string;
  location: string;
  surveyDate: string;
  status: OrderStatus;
  paymentStatus: "Belum dibayar" | "Sudah dibayar" | "Dikembalikan";
  amount: number;
}

export interface SurveyReportItem {
  kostName: string;
  address: string;
  size?: string;
  genderPreference?: string;
  price: number;
  facilities: string[];
  photos: string[];
  videos: string[];
  pros: string[];
  cons: string[];
  notes?: string;
}

export interface SurveyReportResponse {
  orderId: string;
  surveyorId: string;
  submittedAt: string;
  items: SurveyReportItem[];
}

export interface CustomerReviewPayload {
  orderId: string;
  customerId: string;
  surveyorId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "in" | "out";
  amount: number;
  description: string;
  status: "Berhasil" | "Diproses" | "Gagal";
  createdAt: string;
}

export interface CustomerWalletResponse {
  userId: string;
  balance: number;
  transactions: WalletTransaction[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: "customer" | "surveyor";
  text: string;
  createdAt: number;
  readAt?: number;
}
