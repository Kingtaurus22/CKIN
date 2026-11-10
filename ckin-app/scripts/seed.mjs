/**
 * Data contoh untuk mencoba fitur Anggota 1 & 4 sebelum modul Anggota 2 & 3 digabung.
 *
 *   npm run seed
 *
 * Akun yang dibuat (kata sandi sama: ckin12345):
 *   customer : alya.putri@email.com
 *   surveyor : bima.wicaksono@email.com
 *
 * Aman dijalankan ulang: data contoh lama (ditandai `seed: true`) dihapus dulu.
 */
import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI belum diatur. Isi file .env terlebih dahulu.");
  process.exit(1);
}

const client = new MongoClient(uri);
const db = client.db(process.env.MONGODB_DB || "ckin");
const days = (n) => new Date(Date.now() + n * 86400000);
const area = (districtId, district) => ({
  provinceId: "34",
  province: "DI YOGYAKARTA",
  cityId: "3404",
  city: "KABUPATEN SLEMAN",
  districtId,
  district,
});

try {
  const password = await bcrypt.hash("ckin12345", 10);
  const seedEmails = ["alya.putri@email.com", "bima.wicaksono@email.com"];

  // Bersihkan data contoh sebelumnya.
  await Promise.all([
    db.collection("customers").deleteMany({ email: { $in: seedEmails } }),
    db.collection("surveyors").deleteMany({ email: { $in: seedEmails } }),
    ...["orders", "surveyReports", "reviews", "conversations", "messages", "walletTransactions", "surveyorWithdrawals"].map((c) =>
      db.collection(c).deleteMany({ seed: true }),
    ),
  ]);

  const customerId = new ObjectId();
  const surveyorId = new ObjectId();
  const now = new Date();

  await db.collection("customers").insertOne({
    _id: customerId,
    fullname: "Alya Putri",
    email: seedEmails[0],
    phone: "+6281234567890",
    password,
    avatar: null,
    domicile: area("3404070", "DEPOK"),
    createdAt: days(-60),
    updatedAt: now,
  });

  await db.collection("surveyors").insertOne({
    _id: surveyorId,
    fullname: "Bima Wicaksono",
    email: seedEmails[1],
    phone: "+6281298765432",
    password,
    avatar: null,
    domicile: area("3404070", "DEPOK"),
    coverageArea: {
      provinceId: "34",
      province: "DI YOGYAKARTA",
      cityId: "3404",
      city: "KABUPATEN SLEMAN",
      districts: ["DEPOK", "MLATI", "NGAGLIK"],
      districtIds: ["3404070", "3404060", "3404120"],
    },
    experience: "Saya tinggal di Depok selama 5 tahun dan mengenal area kampus UGM serta UNY.",
    acceptingOrders: true,
    documents: { ktpPublicId: "seed/ktp", selfiePublicId: "seed/selfie" },
    verification: { status: "APPROVED", reviewedAt: days(-170), rejectionReason: null },
    rating: { average: 4.9, count: 112 },
    createdAt: days(-180),
    updatedAt: now,
  });

  const baseOrder = (code, status, extra = {}) => ({
    _id: new ObjectId(),
    seed: true,
    orderCode: code,
    UserId: customerId,
    SurveyorId: null,
    serviceType: "SURVEYOR_RECOMMENDATION",
    surveyLocation: area("3404070", "DEPOK"),
    kosCount: 3,
    requirements: {
      facilities: ["Kamar mandi dalam", "AC", "Wi-Fi", "Parkir motor", "CCTV"],
      budget: { min: 1000000, max: 1800000 },
      genderPreferences: "putri",
      landmark: "",
      notes: "Dekat kampus UGM. Prioritaskan lingkungan tenang. Tolong cek tekanan air dan sinyal Wi-Fi.",
    },
    targets: [],
    surveyDate: days(9),
    surveyTimeSlot: "09.00–12.00 WIB",
    assignmentStatus: "OPEN",
    payment: { provider: "MIDTRANS", paymentStatus: "UNPAID" },
    moveInDate: days(22),
    status,
    pricing: { perKos: 75000, serviceFee: 5000, total: 230000 },
    createdAt: days(-1),
    updatedAt: now,
    statusHistory: [{ status: "PENDING_PAYMENT", changedAt: days(-1), reason: "Pesanan dibuat" }],
    ...extra,
  });

  const unpaid = baseOrder("SGH-261108", "PENDING_PAYMENT", { expiresAt: days(1) });
  const inProgress = baseOrder("SGH-261102", "IN_PROGRESS", {
    SurveyorId: surveyorId,
    serviceType: "CUSTOMER_CHOICE",
    surveyLocation: area("3404060", "MLATI"),
    kosCount: 2,
    surveyDate: days(-3),
    pricing: { perKos: 75000, serviceFee: 5000, total: 155000 },
    targets: [
      { propertyName: "Kos Melati", address: "Jl. Magelang KM 6, Mlati", googleMapsUrls: "", ownerContact: "" },
      { propertyName: "Kos Seroja", address: "Jl. Monjali, Mlati", googleMapsUrls: "", ownerContact: "" },
    ],
    paidAt: days(-7),
    payment: { provider: "MIDTRANS", paymentStatus: "PAID" },
    assignmentStatus: "ASSIGNED",
    createdAt: days(-7),
    statusHistory: [
      { status: "PENDING_PAYMENT", changedAt: days(-7), reason: "Pesanan dibuat" },
      { status: "WAITING_SURVEYOR", changedAt: days(-7), reason: "Pembayaran berhasil" },
      { status: "ASSIGNED", changedAt: days(-6), reason: "Diambil Bima Wicaksono" },
      { status: "IN_PROGRESS", changedAt: days(-3), reason: "Survei dimulai" },
    ],
  });
  const reported = baseOrder("SGH-261024", "REPORT_SUBMITTED", {
    SurveyorId: surveyorId,
    assignedAt: days(-17),
    reportSubmittedAt: days(-14),
    surveyDate: days(-14),
    paidAt: days(-18),
    payment: { provider: "SALDO", paymentStatus: "PAID" },
    assignmentStatus: "ASSIGNED",
    createdAt: days(-18),
    statusHistory: [
      { status: "WAITING_SURVEYOR", changedAt: days(-18), reason: "Pembayaran berhasil" },
      { status: "ASSIGNED", changedAt: days(-17), reason: "Diambil Bima Wicaksono" },
      { status: "REPORT_SUBMITTED", changedAt: days(-14), reason: "Laporan dikirim" },
    ],
  });
  const cancelled = baseOrder("SGH-261019", "CANCELLED", {
    kosCount: 1,
    surveyDate: days(-21),
    payment: { provider: "MIDTRANS", paymentStatus: "REFUNDED" },
    assignmentStatus: "CANCELLED",
    pricing: { perKos: 75000, serviceFee: 5000, total: 80000 },
    createdAt: days(-25),
  });

  // Order terbayar yang belum diambil — muncul di "Order tersedia" surveyor (Anggota 3).
  const paid = { provider: "MIDTRANS", paymentStatus: "PAID" };
  const paidHistory = (d) => [
    { status: "PENDING_PAYMENT", changedAt: days(d), reason: "Pesanan dibuat" },
    { status: "WAITING_SURVEYOR", changedAt: days(d), reason: "Pembayaran berhasil" },
  ];
  const open1 = baseOrder("SGH-261110", "WAITING_SURVEYOR", {
    serviceType: "USER_CHOICE",
    surveyLocation: area("3404060", "MLATI"),
    kosCount: 2,
    requirements: { genderPreferences: "MALE", budget: { min: 1000000, max: 1500000 }, facilities: ["Kamar mandi dalam", "Wi-Fi"], landmark: "", notes: "Dekat UGM. Akses motor mudah, kamar mandi dalam." },
    targets: [
      { propertyName: "Kos Griya Mahasiswa", address: "Jl. Kaliurang KM 7, Sendangadi", googleMapsUrls: "https://maps.google.com/?q=Sendangadi", ownerContact: "Pak Darto · 0812 1111 2222" },
      { propertyName: "Kos Pandan Asri", address: "Jl. Pandanaran, Sinduadi", googleMapsUrls: "", ownerContact: "Bu Sri · 0813 3333 4444" },
    ],
    surveyDate: days(4),
    pricing: { perKos: 75000, serviceFee: 5000, total: 155000 },
    paidAt: days(-1),
    payment: paid,
    statusHistory: paidHistory(-1),
  });
  const open2 = baseOrder("SGH-261111", "WAITING_SURVEYOR", {
    surveyDate: days(5),
    surveyTimeSlot: "13.00–16.00 WIB",
    paidAt: days(-1),
    payment: paid,
    statusHistory: paidHistory(-1),
  });
  const open3 = baseOrder("SGH-261112", "WAITING_SURVEYOR", {
    surveyLocation: area("3404120", "NGAGLIK"),
    kosCount: 1,
    requirements: { genderPreferences: "ANY", budget: { min: 1200000, max: 1800000 }, facilities: ["Parkir mobil"], notes: "" },
    surveyDate: days(6),
    pricing: { perKos: 75000, serviceFee: 5000, total: 80000 },
    paidAt: days(0),
    payment: paid,
    statusHistory: paidHistory(0),
  });
  // Order selesai (laporan diterima) — pendapatan masuk "Saldo dapat ditarik".
  const completed = baseOrder("SGH-261003", "COMPLETED", {
    SurveyorId: surveyorId,
    kosCount: 2,
    surveyDate: days(-30),
    pricing: { perKos: 75000, serviceFee: 5000, total: 155000 },
    paidAt: days(-34),
    payment: paid,
    assignmentStatus: "ASSIGNED",
    assignedAt: days(-33),
    reportSubmittedAt: days(-29),
    completedAt: days(-27),
    createdAt: days(-34),
    statusHistory: [
      ...paidHistory(-34),
      { status: "ASSIGNED", changedAt: days(-33), reason: "Diambil Bima Wicaksono" },
      { status: "REPORT_SUBMITTED", changedAt: days(-29), reason: "Laporan survei dikirim" },
      { status: "COMPLETED", changedAt: days(-27), reason: "Ulasan customer" },
    ],
  });

  await db
    .collection("orders")
    .insertMany([unpaid, inProgress, reported, cancelled, open1, open2, open3, completed]);

  const allChecks = [
    "Dinding & lantai", "Ventilasi & cahaya", "Air & kamar mandi",
    "Wi-Fi & sinyal", "Listrik & biaya", "Parkir & keamanan",
    "Akses jalan", "Kebisingan sekitar",
  ];

  // Draf laporan untuk order yang sedang dikerjakan (belum terlihat customer).
  await db.collection("surveyReports").insertOne({
    seed: true,
    orderId: inProgress._id,
    surveyorId,
    status: "DRAFT",
    updatedAt: days(-1),
    submittedAt: null,
    items: [
      {
        kostName: "Kos Melati",
        address: "Jl. Magelang KM 6, Mlati",
        price: 1250000,
        availability: "1 kamar kosong",
        condition: "Kamar bersih, dinding tidak lembap, dan ventilasi baik. Air mengalir lancar.",
        notes: "",
        checkedItems: allChecks,
        media: [],
      },
      {
        kostName: "Kos Seroja",
        address: "Jl. Monjali, Mlati",
        price: null,
        availability: "",
        condition: "",
        notes: "",
        checkedItems: allChecks.slice(0, 3),
        media: [],
      },
    ],
  });

  await db.collection("surveyReports").insertOne({
    seed: true,
    orderId: completed._id,
    surveyorId,
    status: "SUBMITTED",
    updatedAt: days(-29),
    submittedAt: days(-29),
    items: [
      { kostName: "Kos Kenanga", address: "Jl. Seturan, Depok", price: 1400000, availability: "2 kamar kosong", condition: "Bangunan baru, kamar luas dan terang.", checkedItems: allChecks, photos: [], videos: [] },
      { kostName: "Kos Dahlia", address: "Jl. Babarsari, Depok", price: 1300000, availability: "1 kamar kosong", condition: "Kamar bersih, parkir sempit.", checkedItems: allChecks, photos: [], videos: [] },
    ],
  });

  await db.collection("surveyReports").insertOne({
    seed: true,
    orderId: reported._id,
    surveyorId,
    status: "SUBMITTED",
    updatedAt: days(-14),
    submittedAt: days(-14),
    items: [
      {
        kostName: "Griya Soka",
        address: "Jl. Kaliurang KM 5, Caturtunggal, Depok",
        size: "3 × 4 m",
        genderPreference: "Kos putri",
        price: 1650000,
        availability: "2 kamar tersedia",
        photos: [],
        videos: [],
        pros: ["AC & kamar mandi dalam berfungsi", "Wi-Fi 42 Mbps, sinyal stabil", "8 menit ke UGM"],
        cons: ["Listrik token terpisah", "Jam tamu sampai 21.00 WIB"],
        notes: "Pilihan paling cocok untuk kerja dari kos. Kamar menghadap taman.",
        score: 9,
        distanceNote: "8 menit ke UGM",
      },
      {
        kostName: "Paviliun Rindang",
        address: "Jl. Pandega Marta, Depok",
        size: "3 × 3 m",
        genderPreference: "Kos putri",
        price: 1500000,
        availability: "1 kamar tersedia",
        pros: ["Harga terjangkau"],
        cons: ["Kamar mandi luar"],
        score: 8,
        distanceNote: "12 menit ke UGM",
      },
      {
        kostName: "Taman Utara",
        address: "Jl. Monjali, Mlati",
        size: "4 × 4 m",
        genderPreference: "Kos campur",
        price: 1800000,
        availability: "Penuh",
        score: 8,
        distanceNote: "10 menit ke UGM",
      },
    ],
  });

  const conversationId = new ObjectId();
  const at = (minutesAgo) => new Date(Date.now() - minutesAgo * 60000);
  await db.collection("conversations").insertOne({
    _id: conversationId,
    seed: true,
    orderId: inProgress._id,
    customerId,
    surveyorId,
    lastMessage: { text: "Siap, saya sudah di Kos Melati.", senderRole: "surveyor", createdAt: at(10) },
    createdAt: at(30),
    updatedAt: at(10),
  });
  await db.collection("messages").insertMany([
    {
      seed: true,
      conversationId,
      orderId: inProgress._id,
      senderId: customerId,
      senderRole: "customer",
      text: "Selamat pagi, Mas Bima. Tolong cek ventilasi dan tekanan air di kedua kos, ya.",
      attachment: null,
      createdAt: at(15),
      readAt: at(12),
    },
    {
      seed: true,
      conversationId,
      orderId: inProgress._id,
      senderId: surveyorId,
      senderRole: "surveyor",
      text: "Siap, saya sudah di Kos Melati.",
      attachment: null,
      createdAt: at(10),
      readAt: null,
    },
  ]);

  await db.collection("walletTransactions").insertMany([
    { seed: true, customerId, type: "in", category: "topup", amount: 500000, adminFee: 2500, description: "Top up saldo", reference: "#TU-SEED01", method: "Midtrans · Virtual Account", status: "SUCCESS", createdAt: days(-30) },
    { seed: true, customerId, type: "out", category: "payment", amount: 155000, description: "Pembayaran survei", reference: "#SGH-261102", method: "Saldo CKIN", orderId: inProgress._id, status: "SUCCESS", createdAt: days(-7) },
    { seed: true, customerId, type: "out", category: "payment", amount: 230000, description: "Pembayaran survei", reference: "#SGH-261024", method: "Midtrans · BCA VA", orderId: reported._id, external: true, status: "SUCCESS", createdAt: days(-18) },
    { seed: true, customerId, type: "in", category: "refund", amount: 80000, description: "Refund pesanan dibatalkan", reference: "#SGH-261019", method: "Saldo CKIN", orderId: cancelled._id, status: "SUCCESS", createdAt: days(-21) },
  ]);

  // Super admin (verifikasi surveyor & proses tarik dana) — login di /login, diarahkan ke /admin.
  await db.collection("admins").deleteMany({ email: "admin@ckin.id" });
  await db.collection("admins").insertOne({
    fullname: "Admin CKIN",
    email: "admin@ckin.id",
    phone: "",
    password,
    createdAt: now,
    updatedAt: now,
  });

  console.log("✓ Data contoh siap.");
  console.log("  Customer : alya.putri@email.com / ckin12345");
  console.log("  Surveyor : bima.wicaksono@email.com / ckin12345");
  console.log("  Admin    : admin@ckin.id / ckin12345  (ganti sandi untuk produksi)");
} catch (error) {
  console.error("Seed gagal:", error);
  process.exitCode = 1;
} finally {
  await client.close();
}
