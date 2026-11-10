# CKIN — Cari Kost

CKIN adalah aplikasi berbasis web yang membantu calon penyewa kos mendapatkan informasi dan melakukan survei kos tanpa harus datang langsung ke lokasi. Platform ini menghubungkan **customer** (calon penyewa) dengan **surveyor** (penyedia jasa survei) di area domisili dan jangkauannya.

Folder ini adalah **gabungan kerja keempat anggota — Anggota 1 (Ilham), Anggota 2 (Reynaldo), Anggota 3 (Shania), dan Anggota 4 (Olga)** — sudah dirapikan dan disesuaikan dengan Figma.

---

## Menjalankan

```bash
cd ckin-app
cp .env.example .env      # isi MONGODB_URI, JWT_SECRET, CLOUDINARY_URL, MIDTRANS_*
npm install
npm run seed              # opsional: data contoh untuk mencoba fitur
npm run dev               # http://localhost:3000 (Next.js + Socket.IO)
```

| Script | Fungsi |
| --- | --- |
| `npm run dev` | Server dev (Next.js + chat real-time Socket.IO dalam satu port) |
| `npm run dev:next` | `next dev` biasa — chat tetap jalan dengan mode polling |
| `npm run build` / `npm start` | Build & jalankan production |
| `npm run seed` | Akun contoh (sandi `ckin12345`): customer `alya.putri@email.com`, surveyor `bima.wicaksono@email.com`, super admin `admin@ckin.id` + 3 order terbayar di "Order tersedia" |
| `npm run admin -- create-admin <email> <sandi> "<nama>"` | Buat akun super admin baru |
| `npm run admin -- approve-surveyor <email>` | Alternatif CLI untuk menyetujui surveyor (biasanya lewat dashboard `/admin`) |

---

## Revisi terbaru

| Fitur | Ringkasan |
| --- | --- |
| **Saldo customer** | Top up lewat **Midtrans** (VA, QRIS, e-wallet) dengan **biaya admin Rp2.500** per top up (nominal masuk saldo utuh). Pesanan yang sudah dibayar lalu dibatalkan → **refund otomatis ke Saldo CKIN**. Riwayat menampilkan **semua transaksi**: top up, pembayaran survei (saldo maupun Midtrans), refund. |
| **Form pesanan** | Field "patokan" dihapus → digabung ke **Kebutuhan khusus**. **Pemilihan jam survei dihapus** — customer hanya memilih tanggal, jam kunjungan diatur lewat chat. |
| **Laporan** | Tombol "Booking kos" diganti tombol **Lihat laporan** & **Ulasan**; tidak ada fitur booking. |
| **Asisten CKIN (chatbot RAG)** | Menggantikan "Hubungi bantuan". Retrieval = data pesanan/saldo/penghasilan **milik pengguna yang login** dari MongoDB → pertanyaan diklasifikasikan ke topik CKIN (`src/lib/assistant/answer.ts`) → jawaban faktual disusun dari data itu. Bila `GEMINI_API_KEY` diisi, Gemini hanya merapikan bahasa dan divalidasi agar tidak mengubah kode pesanan/nominal. **Batasan:** hanya topik CKIN (di luar topik ditolak sopan), 300 karakter/pertanyaan, 6 pertanyaan/menit, 30 pertanyaan/hari (koleksi `assistantUsage`), 20 pesan per percakapan — masing-masing dengan pesan saat batas terlewati. |
| **Media laporan** | Carousel berjalan otomatis + strip thumbnail semua foto/video; klik thumbnail → lompat; klik media besar → popup layar penuh (panah, Esc, penghitung). |
| **Syarat & ketentuan** | Halaman publik `/syarat-ketentuan` (customer), `/syarat-ketentuan/surveyor`, `/kebijakan-privasi` (ID/EN). Ditautkan dari checkbox register dan semua footer. |
| **Bahasa ID ⇄ EN** | Tombol ID/EN di topbar, landing, dan halaman login. Kamus di `src/i18n/en.ts`. |
| **Dark / light mode** | Tombol bulan/matahari; default mengikuti sistem operasi. |
| **Responsive** | Konten di tengah & lebih lebar di layar besar; tabel jadi kartu, topbar & filter menyesuaikan di layar kecil. |
| **Super admin** | Role `admin` (koleksi `admins`) dengan dashboard sendiri `/admin`: ringkasan, **verifikasi surveyor** (lihat KTP/selfie via URL Cloudinary bertanda tangan), **proses tarik dana** (tandai sudah ditransfer / tolak → dana kembali ke saldo surveyor). |
| **Logo** | Logo SVG baru (rumah + centang) tanpa latar putih, mengikuti tema. |
| **Order tersedia** | Tulisan **"Maks. 3 pesanan per surveyor"** + meter kuota; order di tanggal yang sudah terisi ditandai "Bentrok dengan jadwalmu" dan tidak bisa diambil. |
| **Dana tertahan** | Pendapatan dari laporan yang sudah dikirim tapi masih masa review customer. Dilepas ke saldo saat customer memberi ulasan **atau otomatis 3 hari** setelah laporan dikirim. |

## Pembagian modul

| Anggota | Modul | Status di repo ini |
| --- | --- | --- |
| 1 — Ilham | Authentication & User Management | ✅ Selesai |
| 2 — Reynaldo | Customer Order & Payment | ✅ Selesai |
| 3 — Shania | Surveyor Dashboard & Survey Management | ✅ Selesai |
| 4 — Olga | Customer Dashboard, Order Tracking & Communication | ✅ Selesai |

### Anggota 1 — Authentication & User Management
- Landing page `/`, daftar customer `/register`, daftar surveyor `/register-surveyor`, login `/login`, logout.
- Pengaturan akun & form profil `/customer/settings`, `/surveyor/settings` (profil, domisili, area jangkauan, ganti kata sandi).
- MongoDB `customers` dan `surveyors` (koleksi terpisah) — email **unik lintas kedua koleksi** + index unik.
- Password di-hash bcrypt, sesi **JWT di cookie httpOnly** (opsi "Ingat saya" 30 hari).
- `src/proxy.ts` (route guard Next.js 16) + `requireSession()` di setiap API (authorization per role).
- Domisili & coverage area surveyor disimpan lengkap dengan **ID wilayah** (`coverageArea.districtIds`).
- Dokumen KTP & selfie diunggah ke Cloudinary sebagai aset **privat**.

### Anggota 2 — Customer Order & Payment
- Alur pesanan 4 langkah di `/customer/orders/new` → `sumber-kos` → `preferensi` / `kos-pilihan` → `jadwal` → `konfirmasi`.
- Lokasi hanya menampilkan kecamatan yang dijangkau surveyor aktif (`GET /api/orders/available-surveyors`), 1–4 kos.
- Dua jenis layanan: **rekomendasi surveyor** (tipe kos, budget, patokan, fasilitas, catatan) dan **kos pilihan sendiri** (nama, alamat, tautan, kontak).
- Jadwal: kalender + slot jam; survei paling cepat H+2 dan paling lambat 7 hari sebelum rencana masuk (divalidasi client **dan** server).
- `POST /api/orders` membuat pesanan `PENDING_PAYMENT` dengan batas bayar 24 jam (otomatis `EXPIRED` setelahnya).
- Pembayaran `/customer/orders/[id]/payment`: **Saldo CKIN** (langsung lunas) atau **Midtrans Snap** (VA, QRIS, e-wallet).
- Webhook `POST /api/payments/notification` memverifikasi status ke server Midtrans, mengecek nominal, lalu mengubah pesanan menjadi `WAITING_SURVEYOR`.
- Daftarkan URL webhook di dashboard Midtrans: `https://<domain>/api/payments/notification` (untuk lokal gunakan ngrok).

### Anggota 3 — Surveyor Dashboard & Survey Management
- Dashboard surveyor `/surveyor` (order berjalan, order tersedia, pendapatan bulan ini, order terbaru).
- **Order tersedia** `/surveyor/open-orders`: hanya order **sudah dibayar** (`WAITING_SURVEYOR`), belum punya surveyor, dan kecamatannya ada di `coverageArea.districtIds`; filter area & rentang jadwal, panel detail, tombol **Ambil order ini**. Alamat & kontak pemilik kos baru terlihat setelah order diambil.
- Aturan ambil order (`POST /api/surveyor/open-orders/[id]/assign`): akun harus **APPROVED** dan aktif menerima order, maksimal **3 order berjalan**, tidak boleh ada dua survei di **tanggal yang sama**, dan update atomik dengan filter `SurveyorId: null` → **satu order hanya untuk satu surveyor**.
- **Order survei** `/surveyor/orders`: statistik, pencarian, filter tanggal, tab Terjadwal / Dalam proses / Menunggu review / Selesai, pagination 8 baris.
- **Kelola survei** `/surveyor/orders/[id]`: progres per kos, checklist 8 pemeriksaan (Kondisi, Fasilitas, Lingkungan), upload **foto/video ke Cloudinary** (`ckin/reports/<orderId>/`, foto ≤ 5 MB, video ≤ 50 MB), isi laporan (harga terkonfirmasi, ketersediaan, kondisi, catatan), **Simpan draf** & **Kirim laporan**.
  - Draf pertama mengubah status `ASSIGNED` → `IN_PROGRESS`; draf **tidak terlihat** customer.
  - Kirim laporan divalidasi di client & server (semua kos lengkap, 8/8 checklist, ≥ 1 foto) → order `REPORT_SUBMITTED`, laporan langsung tampil di `/customer/reports/[id]`.
- **Penghasilan** `/surveyor/earnings`: Rp75.000 bersih per kos; dana **tertahan** sampai customer menerima laporan (`COMPLETED`), lalu masuk **saldo dapat ditarik**; tren 6 bulan, rincian per order, tarik dana (min. Rp50.000, rekening disimpan), riwayat pencairan (`surveyorWithdrawals`).
- API: `/api/surveyor/dashboard`, `open-orders`, `open-orders/[id]/assign`, `orders`, `orders/[id]`, `orders/[id]/start`, `orders/[id]/report` (PUT draf), `orders/[id]/report/submit`, `orders/[id]/media` (POST/DELETE), `earnings`, `withdrawals` — semuanya `requireSession("surveyor")` dan hanya untuk order milik surveyor tersebut.

### Anggota 4 — Customer Dashboard, Order Tracking & Communication
- Dashboard customer `/customer`, daftar & filter pesanan `/customer/orders`, detail + timeline progres `/customer/orders/[id]`.
- Hasil laporan survei + ulasan surveyor `/customer/reports/[id]`, saldo `/customer/wallet`.
- Chat customer ↔ surveyor `/customer/messages`, `/surveyor/messages` (MongoDB `conversations` & `messages`, Socket.IO, lampiran foto).
- Hanya customer pemilik order & surveyor yang ditugaskan yang bisa mengakses percakapan (dicek di API **dan** di server socket).

---

## Kontrak data antar modul

Semua modul mengikuti kontrak di **`db/models/types.ts`** dan **`src/lib/order-status.ts`**:

- `orders.UserId` → `customers._id` (ObjectId), `orders.SurveyorId` → `surveyors._id` (ObjectId / `null`).
- `orders.status`: `PENDING_PAYMENT` → `WAITING_SURVEYOR` → `ASSIGNED` → `IN_PROGRESS` → `REPORT_SUBMITTED` → `COMPLETED` (atau `CANCELLED` / `EXPIRED`). Setiap perubahan sebaiknya ditambahkan ke `statusHistory`.
- `orders.surveyLocation` menyimpan `districtId` dari API wilayah; Open Order surveyor cukup memfilter `status = WAITING_SURVEYOR`, `SurveyorId = null`, dan `surveyLocation.districtId ∈ coverageArea.districtIds`.
- Saat surveyor mengambil order: set `SurveyorId`, `status = ASSIGNED`, `assignmentStatus = ASSIGNED` dengan filter `SurveyorId: null` agar satu order hanya bisa diambil satu surveyor.
- `serviceType`: `SURVEYOR_RECOMMENDATION` / `USER_CHOICE`; `targets[]`: `{ propertyName, address, googleMapsUrls, ownerContact }`; `requirements`: `{ genderPreferences: FEMALE|MALE|ANY, budget{min,max}, facilities[], landmark, notes }`.
- `surveyReports`: `{ orderId, surveyorId, status: "DRAFT"|"SUBMITTED", updatedAt, submittedAt, items: [{ kostName, address, price, availability, condition, notes, checkedItems[], media[{url, publicId, name, size, type}], photos[], videos[] }] }` — dokumen lama tanpa `status` dianggap sudah terkirim.
- `surveyorWithdrawals`: `{ surveyorId, code, amount, bank{bankName, accountNumber, accountHolder}, status: PENDING|SUCCESS|REJECTED }`.
- `walletTransactions`: `{ customerId, type: "in"|"out", category: "topup"|"payment"|"refund", amount, adminFee?, description, reference, method, status: "SUCCESS"|"PENDING"|"FAILED", external?, orderId?, midtransOrderId? }` — saldo = SUCCESS & `external !== true`.
- `admins`: `{ fullname, email, password (bcrypt) }` — login di `/login`, diarahkan ke `/admin`.
- Ulasan customer otomatis mengubah order `REPORT_SUBMITTED` → `COMPLETED` dan memperbarui `surveyors.rating`.

## Struktur singkat

```
ckin-app/
├─ server.mjs              # custom server Next.js + Socket.IO
├─ scripts/seed.mjs        # data contoh
├─ scripts/admin.mjs       # setujui surveyor, proses penarikan dana
├─ db/config/mongodb.ts    # koneksi MongoDB (lazy, satu client)
├─ db/models/              # Customer, Surveyor, Account, Order, Chat, SurveyReport, Wallet, SurveyorWork
└─ src/
   ├─ proxy.ts             # route guard per role
   ├─ app/                 # halaman & API (api/auth, api/profile, api/customer, api/orders, api/payments, api/surveyor, api/conversations)
   ├─ components/          # auth, workspace (sidebar/topbar), customer, chat, surveyor, ui
   ├─ lib/                 # jwt/session, order-status, format, cloudinary, client-api
   └─ schemas/             # validasi Zod auth, order, survey (dipakai client & server)
```
