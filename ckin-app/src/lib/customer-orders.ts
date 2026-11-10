export type CustomerOrderStatus =
  | "Belum dibayar"
  | "Menunggu surveyor"
  | "Dalam proses"
  | "Laporan diterima"
  | "Selesai"
  | "Dibatalkan"
  | "Kedaluwarsa";

export type CustomerOrder = {
  id: string;
  location: string;
  createdAt: string;
  surveyDate: string;
  kosCount: number;
  surveyor: string | null;
  status: CustomerOrderStatus;
  paymentStatus: "Belum dibayar" | "Sudah dibayar" | "Dikembalikan";
  amount: number;
  serviceType: "Rekomendasi surveyor" | "Pilihan pengguna";
};

// Data sementara. Ganti implementasi ini dengan response API Anggota 2 saat endpoint siap.
export const customerOrders: CustomerOrder[] = [
  {
    id: "SGH-261108",
    location: "Depok, Sleman",
    createdAt: "8 Nov 2026",
    surveyDate: "18 Nov 2026",
    kosCount: 3,
    surveyor: null,
    status: "Belum dibayar",
    paymentStatus: "Belum dibayar",
    amount: 230000,
    serviceType: "Pilihan pengguna",
  },
  {
    id: "SGH-261102",
    location: "Mlati, Sleman",
    createdAt: "2 Nov 2026",
    surveyDate: "6 Nov 2026",
    kosCount: 2,
    surveyor: "Nanda Rahma",
    status: "Dalam proses",
    paymentStatus: "Sudah dibayar",
    amount: 150000,
    serviceType: "Rekomendasi surveyor",
  },
  {
    id: "SGH-261024",
    location: "Depok, Sleman",
    createdAt: "20 Okt 2026",
    surveyDate: "24 Okt 2026",
    kosCount: 3,
    surveyor: "Bima Wicaksono",
    status: "Selesai",
    paymentStatus: "Sudah dibayar",
    amount: 225000,
    serviceType: "Pilihan pengguna",
  },
  {
    id: "SGH-261019",
    location: "Gondokusuman, Yogyakarta",
    createdAt: "15 Okt 2026",
    surveyDate: "19 Okt 2026",
    kosCount: 1,
    surveyor: "Dito Pratama",
    status: "Dibatalkan",
    paymentStatus: "Dikembalikan",
    amount: 75000,
    serviceType: "Rekomendasi surveyor",
  },
  {
    id: "SGH-261015",
    location: "Banguntapan, Bantul",
    createdAt: "11 Okt 2026",
    surveyDate: "15 Okt 2026",
    kosCount: 2,
    surveyor: "Nanda Rahma",
    status: "Kedaluwarsa",
    paymentStatus: "Belum dibayar",
    amount: 150000,
    serviceType: "Pilihan pengguna",
  },
  {
    id: "SGH-261011",
    location: "Caturtunggal, Sleman",
    createdAt: "7 Okt 2026",
    surveyDate: "11 Okt 2026",
    kosCount: 2,
    surveyor: "Bima Wicaksono",
    status: "Selesai",
    paymentStatus: "Sudah dibayar",
    amount: 150000,
    serviceType: "Rekomendasi surveyor",
  },
  {
    id: "SGH-261008",
    location: "Seturan, Sleman",
    createdAt: "4 Okt 2026",
    surveyDate: "8 Okt 2026",
    kosCount: 2,
    surveyor: "Nanda Rahma",
    status: "Selesai",
    paymentStatus: "Sudah dibayar",
    amount: 150000,
    serviceType: "Pilihan pengguna",
  },
  {
    id: "SGH-261003",
    location: "Condongcatur, Sleman",
    createdAt: "29 Sep 2026",
    surveyDate: "3 Okt 2026",
    kosCount: 1,
    surveyor: "Dito Pratama",
    status: "Selesai",
    paymentStatus: "Sudah dibayar",
    amount: 75000,
    serviceType: "Rekomendasi surveyor",
  },
  {
    id: "SGH-260928",
    location: "Kasihan, Bantul",
    createdAt: "24 Sep 2026",
    surveyDate: "28 Sep 2026",
    kosCount: 2,
    surveyor: "Bima Wicaksono",
    status: "Dibatalkan",
    paymentStatus: "Dikembalikan",
    amount: 150000,
    serviceType: "Pilihan pengguna",
  },
];

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
