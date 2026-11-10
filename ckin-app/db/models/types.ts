import type { ObjectId } from "mongodb";

/**
 * Struktur dokumen MongoDB yang dipakai bersama.
 * Koleksi `orders` dan `surveyReports` dimiliki Anggota 2 & 3 —
 * tipe di sini hanya field yang dibaca oleh fitur Anggota 4.
 */

export type Area = {
  provinceId?: string;
  province: string;
  cityId?: string;
  city: string;
  districtId?: string;
  district: string;
};

export type CoverageArea = {
  provinceId?: string;
  province: string;
  cityId?: string;
  city: string;
  districts: string[]; // nama kecamatan
  districtIds?: string[]; // ID kecamatan (dipakai untuk filter order)
};

export type CustomerDocument = {
  _id: ObjectId;
  fullname: string;
  email: string;
  phone: string;
  password: string;
  avatar: string | null;
  domicile: Area | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Super admin CKIN: verifikasi surveyor & proses penarikan dana. */
export type AdminDocument = {
  _id: ObjectId;
  fullname: string;
  email: string;
  phone: string;
  password: string;
  avatar?: string | null;
  domicile?: Area | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SurveyorDocument = {
  _id: ObjectId;
  fullname: string;
  email: string;
  phone: string;
  password: string;
  avatar: string | null;
  domicile: Area;
  coverageArea: CoverageArea;
  experience: string;
  acceptingOrders: boolean;
  documents: {
    ktpPublicId: string;
    selfiePublicId: string;
  };
  verification: {
    status: VerificationStatus;
    reviewedAt: Date | null;
    rejectionReason: string | null;
  };
  rating: {
    average: number;
    count: number;
  };
  payoutAccount?: { bankName: string; accountNumber: string; accountHolder: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderStatusHistory = {
  status: string;
  changedAt: Date;
  changedBy?: string;
  reason?: string;
};

/** Kos incaran customer (layanan USER_CHOICE). `name`/`link` = format lama. */
export type OrderTarget = {
  propertyName?: string;
  address?: string;
  googleMapsUrls?: string;
  ownerContact?: string;
  name?: string;
  link?: string;
};

export type OrderDocument = {
  _id: ObjectId;
  orderCode?: string;
  UserId: ObjectId; // customers._id
  SurveyorId: ObjectId | null; // surveyors._id
  serviceType: string; // "SURVEYOR_RECOMMENDATION" | "USER_CHOICE"
  surveyLocation: Area;
  kosCount: number;
  requirements?: {
    facilities?: string[];
    budget?: { min?: number; max?: number };
    genderPreferences?: string;
    landmark?: string;
    notes?: string;
  };
  targets?: OrderTarget[];
  surveyDate: Date;
  surveyTimeSlot?: string;
  moveInDate?: Date;
  assignmentStatus?: string;
  status: string;
  payment?: {
    provider?: string; // "MIDTRANS" | "SALDO"
    method?: string; // "saldo" | "bank" | "qris" | "ewallet"
    midtransOrderId?: string;
    snapToken?: string;
    redirectUrl?: string;
    paymentStatus?: string; // UNPAID | PENDING | PAID | FAILED | EXPIRED
    paymentType?: string;
    transactionId?: string;
  };
  pricing?: number | { perKos?: number; serviceFee?: number; total?: number };
  paidAt?: Date;
  assignedAt?: Date;
  reportSubmittedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  statusHistory?: OrderStatusHistory[];
};

/** Foto/video bukti survei yang diunggah surveyor ke Cloudinary. */
export type ReportMedia = {
  url: string;
  publicId: string;
  name: string;
  size: number;
  type: "image" | "video";
};

export type SurveyReportItem = {
  kostName: string;
  address?: string;
  condition?: string; // "Kondisi, fasilitas & lingkungan"
  checkedItems?: string[]; // label checklist yang sudah diperiksa
  media?: ReportMedia[];
  size?: string;
  genderPreference?: string;
  price?: number;
  availability?: string;
  facilities?: string[];
  photos?: string[];
  videos?: string[];
  pros?: string[];
  cons?: string[];
  checklist?: Array<{ label: string; passed: boolean; note?: string }>;
  notes?: string;
  score?: number;
  distanceNote?: string;
};

export type SurveyReportDocument = {
  _id: ObjectId;
  orderId: ObjectId;
  surveyorId: ObjectId;
  /** DRAFT = masih dikerjakan surveyor (tidak terlihat customer). Data lama tanpa status = SUBMITTED. */
  status?: "DRAFT" | "SUBMITTED";
  items: SurveyReportItem[];
  summary?: string;
  updatedAt?: Date;
  submittedAt: Date | null;
};

export type WithdrawalDocument = {
  _id: ObjectId;
  surveyorId: ObjectId;
  code: string;
  amount: number;
  bank: { bankName: string; accountNumber: string; accountHolder: string };
  status: "PENDING" | "SUCCESS" | "REJECTED";
  createdAt: Date;
  processedAt: Date | null;
  /** Catatan admin (mis. alasan penolakan). */
  note?: string | null;
};

export type ReviewDocument = {
  _id: ObjectId;
  orderId: ObjectId;
  customerId: ObjectId;
  surveyorId: ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
};

export type ConversationDocument = {
  _id: ObjectId;
  orderId: ObjectId;
  customerId: ObjectId;
  surveyorId: ObjectId;
  lastMessage: {
    text: string;
    senderRole: "customer" | "surveyor";
    createdAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MessageDocument = {
  _id: ObjectId;
  conversationId: ObjectId;
  orderId: ObjectId;
  senderId: ObjectId;
  senderRole: "customer" | "surveyor";
  text: string;
  attachment: { url: string; publicId: string; name: string } | null;
  createdAt: Date;
  readAt: Date | null;
};

export type WalletTransactionDocument = {
  _id: ObjectId;
  customerId: ObjectId;
  type: "in" | "out";
  category: "topup" | "payment" | "refund";
  /** Nominal yang masuk/keluar dari Saldo CKIN (top up: tanpa biaya admin). */
  amount: number;
  description: string;
  reference?: string;
  method?: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  createdAt: Date;
  updatedAt?: Date;
  /**
   * true = transaksi di luar saldo (mis. bayar pesanan langsung via Midtrans).
   * Tetap tampil di riwayat, tetapi tidak memengaruhi saldo.
   */
  external?: boolean;
  /** Pesanan terkait (pembayaran / refund). */
  orderId?: ObjectId;
  /** Top up via Midtrans. */
  adminFee?: number;
  midtransOrderId?: string;
  redirectUrl?: string;
  snapToken?: string;
  paymentType?: string;
};
