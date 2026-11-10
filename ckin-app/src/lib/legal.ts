import { HOLD_DAYS, MAX_ACTIVE_ORDERS, MIN_WITHDRAWAL } from "./survey";
import { MAX_KOS, PAYMENT_WINDOW_HOURS, PRICE_PER_KOS, SERVICE_FEE, TOPUP_ADMIN_FEE } from "./pricing";

/**
 * Isi halaman Syarat & Ketentuan (customer & surveyor) dan Kebijakan Privasi.
 * Ditulis dua bahasa supaya ikut tombol ID/EN. Angka diambil dari konstanta
 * aplikasi agar selalu sesuai aturan yang berjalan.
 *
 * Catatan: ini draf untuk proyek; tinjau bersama pihak yang berwenang sebelum produksi.
 */
export type Bi = { id: string; en: string };
export type LegalSection = { title: Bi; points: Bi[] };
export type LegalDoc = { slug: string; title: Bi; intro: Bi; updated: string; sections: LegalSection[] };

const rp = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
const b = (id: string, en: string): Bi => ({ id, en });

export const LEGAL_UPDATED = "2026-11-10";

export const CUSTOMER_TERMS: LegalDoc = {
  slug: "customer",
  updated: LEGAL_UPDATED,
  title: b("Syarat & Ketentuan Pengguna", "Customer Terms & Conditions"),
  intro: b(
    "Ketentuan ini mengatur penggunaan layanan CKIN (Cari Kost) oleh pencari kos (customer). Dengan membuat akun atau memesan survei, kamu dianggap telah membaca dan menyetujui ketentuan ini.",
    "These terms govern the use of CKIN (Cari Kost) by kos seekers (customers). By creating an account or ordering a survey, you confirm that you have read and agree to these terms.",
  ),
  sections: [
    {
      title: b("1. Layanan CKIN", "1. CKIN services"),
      points: [
        b("CKIN mempertemukan customer dengan surveyor lokal yang mengecek kos secara langsung lalu mengirim laporan berisi foto, video, harga terkonfirmasi, dan catatan.", "CKIN connects customers with local surveyors who check a kos in person and send a report with photos, videos, confirmed rent, and notes."),
        b("CKIN tidak menyediakan pemesanan (booking) atau sewa kos. Keputusan dan transaksi sewa dilakukan langsung antara customer dan pemilik kos.", "CKIN does not provide kos booking or rental. Rental decisions and payments are made directly between the customer and the kos owner."),
        b(`Satu pesanan dapat mencakup 1 sampai ${MAX_KOS} kos di satu kecamatan yang dijangkau surveyor aktif.`, `One order can cover 1 to ${MAX_KOS} kos in a single district covered by an active surveyor.`),
      ],
    },
    {
      title: b("2. Akun", "2. Account"),
      points: [
        b("Kamu wajib memberikan data yang benar (nama, email, nomor WhatsApp) dan menjaga kerahasiaan kata sandi.", "You must provide accurate data (name, email, WhatsApp number) and keep your password confidential."),
        b("Satu akun digunakan oleh satu orang. Aktivitas di akunmu menjadi tanggung jawabmu.", "One account is for one person. Activity on your account is your responsibility."),
      ],
    },
    {
      title: b("3. Pemesanan & jadwal", "3. Orders & schedule"),
      points: [
        b("Tanggal survei paling cepat H+2 dan paling lambat 7 hari sebelum rencana tanggal masuk kos.", "The survey date must be at least 2 days from today and at least 7 days before your planned move-in date."),
        b("Jam kunjungan disepakati dengan surveyor melalui chat setelah pesanan diambil.", "The visit time is agreed with the surveyor via chat after the order is taken."),
        b("Untuk kos pilihan sendiri, pastikan nama, alamat, dan kontak pemilik yang kamu berikan benar agar surveyor dapat berkunjung.", "For your own kos choices, make sure the name, address, and owner contact are correct so the surveyor can visit."),
      ],
    },
    {
      title: b("4. Biaya & pembayaran", "4. Fees & payment"),
      points: [
        b(`Biaya survei ${rp(PRICE_PER_KOS)} per kos ditambah biaya layanan ${rp(SERVICE_FEE)} per pesanan.`, `The survey fee is ${rp(PRICE_PER_KOS)} per kos plus a ${rp(SERVICE_FEE)} service fee per order.`),
        b(`Pembayaran dilakukan dengan Saldo CKIN atau melalui Midtrans (Virtual Account, QRIS, e-wallet) paling lambat ${PAYMENT_WINDOW_HOURS} jam setelah pesanan dibuat. Pesanan yang tidak dibayar akan kedaluwarsa.`, `Payment is made with your CKIN balance or via Midtrans (Virtual Account, QRIS, e-wallet) within ${PAYMENT_WINDOW_HOURS} hours of ordering. Unpaid orders expire.`),
        b("Pesanan baru terlihat oleh surveyor setelah pembayaran terkonfirmasi.", "Orders are visible to surveyors only after payment is confirmed."),
      ],
    },
    {
      title: b("5. Saldo CKIN & top up", "5. CKIN balance & top-ups"),
      points: [
        b(`Top up saldo dilakukan melalui Midtrans dengan biaya admin ${rp(TOPUP_ADMIN_FEE)} per transaksi. Biaya admin tidak dapat dikembalikan.`, `Balance top-ups are made via Midtrans with a ${rp(TOPUP_ADMIN_FEE)} admin fee per transaction. The admin fee is non-refundable.`),
        b("Saldo CKIN hanya dapat dipakai untuk membayar layanan di CKIN dan tidak dapat dicairkan menjadi uang tunai.", "The CKIN balance can only be used to pay for CKIN services and cannot be withdrawn as cash."),
        b("Semua top up, pembayaran, dan refund tercatat di riwayat transaksi.", "All top-ups, payments, and refunds are recorded in your transaction history."),
      ],
    },
    {
      title: b("6. Pembatalan & refund", "6. Cancellation & refunds"),
      points: [
        b("Pesanan dapat dibatalkan selama belum diambil surveyor.", "An order can be cancelled as long as no surveyor has taken it."),
        b("Pesanan yang sudah dibayar lalu dibatalkan dikembalikan penuh ke Saldo CKIN, termasuk pembayaran yang masuk setelah pesanan dibatalkan atau kedaluwarsa.", "Paid orders that are cancelled are fully refunded to your CKIN balance, including payments received after an order was cancelled or expired."),
        b("Setelah surveyor mengambil pesanan, pembatalan hanya dapat dilakukan melalui tim CKIN dengan alasan yang wajar.", "Once a surveyor has taken the order, cancellation can only be arranged through the CKIN team for a reasonable cause."),
      ],
    },
    {
      title: b("7. Laporan & ulasan", "7. Reports & reviews"),
      points: [
        b("Laporan menggambarkan kondisi kos pada saat kunjungan. Kondisi, harga, dan ketersediaan kamar dapat berubah setelahnya.", "The report reflects the kos at the time of the visit. Condition, rent, and room availability may change afterwards."),
        b("Ulasan harus jujur, sopan, dan berdasarkan pengalaman nyata. Ulasan menyelesaikan pesanan dan melepas pendapatan surveyor.", "Reviews must be honest, polite, and based on real experience. A review completes the order and releases the surveyor's earnings."),
      ],
    },
    {
      title: b("8. Chat & Asisten CKIN", "8. Chat & CKIN Assistant"),
      points: [
        b("Gunakan chat untuk keperluan survei. Dilarang mengirim konten yang melecehkan, menipu, atau melanggar hukum.", "Use chat for survey purposes only. Harassing, fraudulent, or unlawful content is prohibited."),
        b("Asisten CKIN adalah layanan otomatis yang hanya menjawab topik seputar CKIN berdasarkan data akunmu, dengan batas 300 karakter per pertanyaan dan 30 pertanyaan per hari.", "The CKIN Assistant is an automated service that only answers CKIN topics based on your account data, limited to 300 characters per question and 30 questions per day."),
      ],
    },
    {
      title: b("9. Batasan tanggung jawab", "9. Limitation of liability"),
      points: [
        b("CKIN berupaya memastikan laporan akurat, tetapi tidak bertanggung jawab atas perjanjian sewa, pembayaran sewa, atau sengketa antara customer dan pemilik kos.", "CKIN strives for accurate reports but is not responsible for rental agreements, rent payments, or disputes between customers and kos owners."),
      ],
    },
    {
      title: b("10. Perubahan & kontak", "10. Changes & contact"),
      points: [
        b("Ketentuan dapat diperbarui sewaktu-waktu; tanggal pembaruan tercantum di halaman ini.", "These terms may be updated at any time; the update date is shown on this page."),
        b("Pertanyaan dapat dikirim ke bantuan@ckin.id.", "Questions can be sent to bantuan@ckin.id."),
      ],
    },
  ],
};

export const SURVEYOR_TERMS: LegalDoc = {
  slug: "surveyor",
  updated: LEGAL_UPDATED,
  title: b("Perjanjian Kemitraan & Syarat Surveyor", "Surveyor Partnership Agreement & Terms"),
  intro: b(
    "Ketentuan ini berlaku bagi mitra surveyor CKIN. Dengan mendaftar sebagai surveyor, kamu menyetujui perjanjian kemitraan ini.",
    "These terms apply to CKIN surveyor partners. By registering as a surveyor, you agree to this partnership agreement.",
  ),
  sections: [
    {
      title: b("1. Pendaftaran & verifikasi", "1. Registration & verification"),
      points: [
        b("Surveyor wajib mengisi data asli, memilih domisili dan area jangkauan, serta mengunggah foto KTP dan swafoto dengan KTP.", "Surveyors must provide real data, choose a domicile and coverage area, and upload an ID card photo and a selfie with the ID card."),
        b("Akun baru berstatus menunggu verifikasi. Order baru dapat diambil setelah admin CKIN menyetujui akun. CKIN berhak menolak atau mencabut verifikasi.", "New accounts await verification. Orders can be taken only after a CKIN admin approves the account. CKIN may reject or revoke verification."),
      ],
    },
    {
      title: b("2. Status kemitraan", "2. Partnership status"),
      points: [
        b("Surveyor adalah mitra independen, bukan karyawan CKIN, dan bebas menentukan waktu kerja dengan mengaktifkan atau menonaktifkan penerimaan order.", "Surveyors are independent partners, not CKIN employees, and are free to choose their working time by turning order acceptance on or off."),
      ],
    },
    {
      title: b("3. Mengambil order", "3. Taking orders"),
      points: [
        b("Surveyor hanya dapat mengambil order yang sudah dibayar dan berada di kecamatan area jangkauannya.", "Surveyors can only take paid orders in their coverage districts."),
        b(`Maksimal ${MAX_ACTIVE_ORDERS} order berjalan sekaligus, dan setiap order harus berada di tanggal survei yang berbeda.`, `A maximum of ${MAX_ACTIVE_ORDERS} ongoing orders at a time, each on a different survey date.`),
        b("Satu order hanya dapat diambil oleh satu surveyor. Order yang sudah diambil wajib dikerjakan sesuai jadwal.", "Each order can be taken by only one surveyor. A taken order must be carried out on schedule."),
      ],
    },
    {
      title: b("4. Pelaksanaan survei & laporan", "4. Conducting surveys & reports"),
      points: [
        b("Surveyor wajib datang langsung, memeriksa 8 aspek checklist, dan mengunggah foto/video asli tanpa rekayasa.", "Surveyors must visit in person, inspect all 8 checklist points, and upload original, unedited photos/videos."),
        b("Laporan harus objektif, termasuk kekurangan kos. Laporan yang terkirim tidak dapat diubah.", "Reports must be objective, including the kos's drawbacks. Sent reports cannot be edited."),
        b("Dilarang meminta pembayaran tambahan dari customer atau pemilik kos di luar CKIN.", "Asking customers or kos owners for extra payment outside CKIN is prohibited."),
      ],
    },
    {
      title: b("5. Kerahasiaan data", "5. Data confidentiality"),
      points: [
        b("Data customer dan kontak pemilik kos hanya boleh digunakan untuk keperluan order terkait dan tidak boleh disebarkan.", "Customer data and kos owner contacts may only be used for the related order and must not be shared."),
      ],
    },
    {
      title: b("6. Pendapatan & dana tertahan", "6. Earnings & held funds"),
      points: [
        b(`Surveyor menerima ${rp(PRICE_PER_KOS)} bersih per kos yang disurvei. Biaya layanan customer menjadi pendapatan CKIN.`, `Surveyors receive ${rp(PRICE_PER_KOS)} net per kos surveyed. The customer service fee is CKIN's revenue.`),
        b(`Pendapatan berstatus dana tertahan setelah laporan dikirim, lalu dilepas ke saldo dapat ditarik saat customer memberi ulasan atau otomatis ${HOLD_DAYS} hari setelah laporan dikirim.`, `Earnings are held after the report is sent, then released to the withdrawable balance when the customer reviews or automatically ${HOLD_DAYS} days after the report.`),
      ],
    },
    {
      title: b("7. Penarikan dana", "7. Withdrawals"),
      points: [
        b(`Penarikan minimal ${rp(MIN_WITHDRAWAL)} ke rekening atas nama surveyor sendiri, diproses admin CKIN dalam 1–2 hari kerja tanpa biaya transfer.`, `Withdrawals start at ${rp(MIN_WITHDRAWAL)} to an account in the surveyor's own name, processed by CKIN admin within 1–2 business days with no transfer fee.`),
        b("Penarikan yang ditolak (mis. data rekening tidak sesuai) dikembalikan ke saldo surveyor beserta alasannya.", "Rejected withdrawals (e.g. mismatched account details) are returned to the surveyor's balance with a reason."),
      ],
    },
    {
      title: b("8. Pelanggaran & pengakhiran", "8. Violations & termination"),
      points: [
        b("Laporan palsu, tidak hadir tanpa kabar, atau penyalahgunaan data dapat berakibat penahanan pendapatan, pencabutan verifikasi, atau penutupan akun.", "False reports, no-shows without notice, or misuse of data may lead to withheld earnings, revoked verification, or account closure."),
        b("Surveyor dapat mengakhiri kemitraan kapan saja setelah menyelesaikan order yang sedang berjalan.", "Surveyors may end the partnership at any time after completing ongoing orders."),
      ],
    },
    {
      title: b("9. Kontak", "9. Contact"),
      points: [b("Pertanyaan seputar kemitraan dapat dikirim ke bantuan@ckin.id.", "Partnership questions can be sent to bantuan@ckin.id.")],
    },
  ],
};

export const PRIVACY_POLICY: LegalDoc = {
  slug: "privacy",
  updated: LEGAL_UPDATED,
  title: b("Kebijakan Privasi", "Privacy Policy"),
  intro: b(
    "Kebijakan ini menjelaskan data apa yang dikumpulkan CKIN, bagaimana data digunakan, dan bagaimana kami melindunginya.",
    "This policy explains what data CKIN collects, how it is used, and how we protect it.",
  ),
  sections: [
    {
      title: b("1. Data yang dikumpulkan", "1. Data we collect"),
      points: [
        b("Data akun: nama, email, nomor WhatsApp, domisili, dan kata sandi (disimpan terenkripsi).", "Account data: name, email, WhatsApp number, domicile, and password (stored hashed)."),
        b("Data pesanan: lokasi, preferensi kos, jadwal, laporan, ulasan, dan percakapan.", "Order data: location, kos preferences, schedule, reports, reviews, and conversations."),
        b("Khusus surveyor: foto KTP, swafoto dengan KTP, area jangkauan, dan rekening penarikan.", "For surveyors: ID card photo, selfie with ID card, coverage area, and withdrawal bank account."),
        b("Data transaksi: top up, pembayaran, dan refund. Data kartu/rekening pembayaran diproses oleh Midtrans, bukan disimpan CKIN.", "Transaction data: top-ups, payments, and refunds. Card/bank payment details are processed by Midtrans, not stored by CKIN."),
      ],
    },
    {
      title: b("2. Penggunaan data", "2. How we use data"),
      points: [
        b("Menjalankan layanan survei, mencocokkan pesanan dengan surveyor di area terkait, memproses pembayaran, dan mengirim notifikasi.", "To run the survey service, match orders with surveyors in the area, process payments, and send notifications."),
        b("Menjawab pertanyaanmu melalui Asisten CKIN; asisten hanya membaca data milik akunmu sendiri.", "To answer your questions via the CKIN Assistant; it only reads data from your own account."),
      ],
    },
    {
      title: b("3. Berbagi data", "3. Sharing data"),
      points: [
        b("Nama dan detail pesanan customer terlihat oleh surveyor; alamat lengkap dan kontak pemilik kos baru terlihat setelah order diambil.", "Customer names and order details are visible to surveyors; full addresses and owner contacts appear only after the order is taken."),
        b("Dokumen identitas surveyor hanya dapat dibuka admin CKIN melalui tautan bertanda tangan untuk verifikasi.", "Surveyor ID documents can only be opened by CKIN admins through signed links for verification."),
        b("Kami tidak menjual data pribadimu kepada pihak lain.", "We do not sell your personal data."),
      ],
    },
    {
      title: b("4. Penyimpanan & keamanan", "4. Storage & security"),
      points: [
        b("Sesi masuk memakai cookie httpOnly. Foto dan video disimpan di Cloudinary; dokumen identitas disimpan sebagai aset privat.", "Login sessions use httpOnly cookies. Photos and videos are stored on Cloudinary; ID documents are stored as private assets."),
        b("Preferensi bahasa dan tema disimpan di browser-mu.", "Language and theme preferences are stored in your browser."),
      ],
    },
    {
      title: b("5. Hak pengguna", "5. Your rights"),
      points: [
        b("Kamu dapat memperbarui profil di Pengaturan akun, serta meminta salinan atau penghapusan data melalui bantuan@ckin.id.", "You can update your profile in Account settings and request a copy or deletion of your data via bantuan@ckin.id."),
      ],
    },
  ],
};

export const LEGAL_DOCS = [CUSTOMER_TERMS, SURVEYOR_TERMS, PRIVACY_POLICY];

export const LEGAL_HREF = {
  customer: "/syarat-ketentuan",
  surveyor: "/syarat-ketentuan/surveyor",
  privacy: "/kebijakan-privasi",
} as const;
