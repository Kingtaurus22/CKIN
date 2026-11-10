import type { CanonicalStatus, JourneyStep, PaymentLabel, StatusTone } from "@/src/lib/order-status";

/** Bentuk response API yang dikonsumsi halaman customer (Anggota 4). */

export type CustomerOrderSummary = {
  id: string;
  code: string;
  location: string;
  kosCount: number;
  serviceType: "Rekomendasi surveyor" | "Pilihan pengguna";
  surveyDate: string | null;
  surveyTimeSlot: string | null;
  createdAt: string;
  status: CanonicalStatus;
  statusLabel: string;
  statusTone: StatusTone;
  payment: PaymentLabel;
  total: number;
  surveyor: { id: string; name: string } | null;
};

export type CustomerOrderDetail = CustomerOrderSummary & {
  surveyLocation: { province: string; city: string; district: string };
  moveInDate: string | null;
  expiresAt: string | null;
  pricing: { perKos: number; serviceFee: number; total: number };
  requirements: {
    facilities: string[];
    budget: { min?: number; max?: number } | null;
    genderPreferences: string | null;
    landmark: string | null;
    notes: string | null;
  };
  targets: Array<{ name: string; address: string; link: string | null; ownerContact: string | null }>;
  surveyorDetail: {
    id: string;
    name: string;
    district: string;
    city: string;
    rating: { average: number; count: number };
  } | null;
  journey: JourneyStep[];
  history: Array<{ status: string; label: string; at: string; note: string | null }>;
  canCancel: boolean;
  canChat: boolean;
  hasReport: boolean;
};

export type OrderCounts = {
  all: number;
  active: number;
  completed: number;
  other: number;
  unpaid: number;
};

export type CustomerDashboardData = {
  counts: OrderCounts;
  walletBalance: number;
  recentOrders: CustomerOrderSummary[];
};

export type SurveyReportView = {
  orderId: string;
  orderCode: string;
  surveyDate: string | null;
  submittedAt: string;
  surveyor: { id: string; name: string; district: string; city: string } | null;
  summary: string | null;
  status: CanonicalStatus;
  payment: PaymentLabel;
  items: Array<{
    kostName: string;
    address: string;
    size: string | null;
    genderPreference: string | null;
    price: number | null;
    availability: string | null;
    facilities: string[];
    photos: string[];
    videos: string[];
    pros: string[];
    cons: string[];
    notes: string | null;
    score: number | null;
    distanceNote: string | null;
    /** Kondisi, fasilitas & lingkungan (laporan surveyor Anggota 3). */
    condition: string | null;
    /** Checklist pemeriksaan yang sudah dicek surveyor. */
    checkedItems: string[];
  }>;
  review: { rating: number; comment: string; createdAt: string } | null;
};

export type WalletView = {
  balance: number;
  totalIn: number;
  totalOut: number;
  transactions: Array<{
    id: string;
    type: "in" | "out";
    category: "topup" | "payment" | "refund";
    amount: number;
    description: string;
    reference: string | null;
    method: string | null;
    status: "SUCCESS" | "PENDING" | "FAILED";
    createdAt: string;
    external: boolean;
    adminFee: number;
    orderId: string | null;
    /** Top up Midtrans yang masih menunggu: tautan untuk melanjutkan pembayaran. */
    redirectUrl: string | null;
  }>;
};

export type ConversationSummary = {
  orderId: string;
  orderCode: string;
  peer: { id: string; name: string; role: "customer" | "surveyor" };
  location: string;
  status: CanonicalStatus;
  statusLabel: string;
  statusTone: StatusTone;
  lastMessage: { text: string; senderRole: "customer" | "surveyor"; createdAt: string } | null;
  unread: number;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: "customer" | "surveyor";
  text: string;
  attachment: { url: string; name: string } | null;
  createdAt: string;
  readAt: string | null;
};

export type ConversationThread = {
  conversation: ConversationSummary & {
    surveyDate: string | null;
    surveyTimeSlot: string | null;
    kosCount: number;
    payment: PaymentLabel;
  };
  messages: ChatMessage[];
};
