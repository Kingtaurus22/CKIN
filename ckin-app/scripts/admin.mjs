/**
 * Perintah admin sederhana (belum ada panel admin di aplikasi):
 *
 *   npm run admin -- approve-surveyor <email>   → setujui verifikasi akun surveyor
 *   npm run admin -- reject-surveyor <email> "<alasan>"
 *   npm run admin -- payout-withdrawals         → tandai semua penarikan PENDING sebagai berhasil
 *   npm run admin -- create-admin <email> <sandi> "<nama>"  → buat akun super admin
 *
 * Semua aksi di atas juga tersedia lewat dashboard /admin (login dengan akun admin).
 * Surveyor baru berstatus PENDING dan belum bisa mengambil order sampai disetujui.
 */
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI belum diatur. Jalankan lewat `npm run admin -- ...` agar .env terbaca.");
  process.exit(1);
}

const [command, email, ...rest] = process.argv.slice(2);
const client = new MongoClient(uri);
const db = client.db(process.env.MONGODB_DB || "ckin");

try {
  if (command === "approve-surveyor" || command === "reject-surveyor") {
    if (!email) throw new Error("Sertakan email surveyor.");
    const approve = command === "approve-surveyor";
    const result = await db.collection("surveyors").updateOne(
      { email: email.trim().toLowerCase() },
      {
        $set: {
          "verification.status": approve ? "APPROVED" : "REJECTED",
          "verification.reviewedAt": new Date(),
          "verification.rejectionReason": approve ? null : rest.join(" ") || "Data belum sesuai.",
          updatedAt: new Date(),
        },
      },
    );
    if (!result.matchedCount) throw new Error(`Surveyor ${email} tidak ditemukan.`);
    console.log(`✓ Surveyor ${email} ${approve ? "disetujui" : "ditolak"}.`);
  } else if (command === "create-admin") {
    const [password, ...nameParts] = rest;
    if (!email || !password || password.length < 8) throw new Error("Format: create-admin <email> <sandi min. 8 karakter> \"<nama>\"");
    const normalized = email.trim().toLowerCase();
    for (const c of ["customers", "surveyors", "admins"]) {
      if (await db.collection(c).findOne({ email: normalized })) throw new Error(`Email ${normalized} sudah dipakai.`);
    }
    const now = new Date();
    await db.collection("admins").insertOne({
      fullname: nameParts.join(" ") || "Admin CKIN",
      email: normalized,
      phone: "",
      password: await bcrypt.hash(password, 10),
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✓ Admin ${normalized} dibuat. Login di /login → otomatis ke /admin.`);
  } else if (command === "payout-withdrawals") {
    const result = await db
      .collection("surveyorWithdrawals")
      .updateMany({ status: "PENDING" }, { $set: { status: "SUCCESS", processedAt: new Date() } });
    console.log(`✓ ${result.modifiedCount} penarikan ditandai berhasil.`);
  } else {
    console.log("Perintah: approve-surveyor <email> | reject-surveyor <email> <alasan> | payout-withdrawals | create-admin <email> <sandi> <nama>");
  }
} catch (error) {
  console.error("Gagal:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
