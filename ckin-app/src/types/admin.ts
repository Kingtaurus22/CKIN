export type AdminOverview = {
  pendingSurveyors: number;
  approvedSurveyors: number;
  customers: number;
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  activeOrders: number;
  /** Pendapatan CKIN dari biaya layanan pesanan yang sudah dibayar. */
  serviceRevenue: number;
};

export type AdminSurveyorRow = {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  domicile: string;
  coverage: string[];
  experience: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  ktpUrl: string | null;
  selfieUrl: string | null;
  rating: { average: number; count: number };
};

export type AdminWithdrawalRow = {
  id: string;
  code: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "REJECTED";
  surveyor: { id: string; name: string; email: string };
  bank: { bankName: string; accountNumber: string; accountHolder: string };
  note: string | null;
  createdAt: string;
  processedAt: string | null;
};
