import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import type { AdminDocument, CustomerDocument, SurveyorDocument } from "./types";
import type { AppRole } from "@/src/lib/auth/jwt";

/**
 * Helper lintas koleksi `customers` dan `surveyors`.
 * Email harus unik di KEDUA koleksi: satu email hanya boleh dipakai
 * sebagai customer ATAU surveyor.
 */

let indexesReady: Promise<void> | null = null;

/**
 * Index unik email hanya untuk dokumen yang punya field `email` berupa string
 * (partial index), supaya data lama di database tim yang belum punya email
 * tidak membuat pembuatan index gagal.
 *
 * Kegagalan membuat index TIDAK menghalangi pendaftaran: email tetap dicek
 * lewat isEmailTaken(). Penyebabnya dicatat di terminal agar bisa dibereskan.
 */
export function ensureAccountIndexes() {
  if (!indexesReady) {
    const db = getDb();
    const uniqueEmail = {
      name: "ckin_email_unique",
      unique: true,
      partialFilterExpression: { email: { $type: "string" } },
    };
    const jobs: Array<[string, Promise<string>]> = [
      ["customers.email", db.collection("customers").createIndex({ email: 1 }, uniqueEmail)],
      ["surveyors.email", db.collection("surveyors").createIndex({ email: 1 }, uniqueEmail)],
      ["admins.email", db.collection("admins").createIndex({ email: 1 }, uniqueEmail)],
      [
        "surveyors.coverageArea",
        db.collection("surveyors").createIndex(
          { "coverageArea.districtIds": 1 },
          { name: "ckin_coverage_districts" },
        ),
      ],
    ];

    indexesReady = Promise.allSettled(jobs.map(([, job]) => job)).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.warn(
            `[ckin] Index ${jobs[index][0]} belum bisa dibuat (pendaftaran tetap berjalan):`,
            (result.reason as Error)?.message ?? result.reason,
          );
        }
      });
    });
  }
  return indexesReady;
}

export type AccountMatch =
  | { role: "customer"; account: CustomerDocument }
  | { role: "surveyor"; account: SurveyorDocument }
  | { role: "admin"; account: AdminDocument };

export async function findAccountByEmail(email: string): Promise<AccountMatch | null> {
  const db = getDb();
  const normalized = email.trim().toLowerCase();

  const customer = await db
    .collection<CustomerDocument>("customers")
    .findOne({ email: normalized });
  if (customer) return { role: "customer", account: customer };

  const surveyor = await db
    .collection<SurveyorDocument>("surveyors")
    .findOne({ email: normalized });
  if (surveyor) return { role: "surveyor", account: surveyor };

  const admin = await db.collection<AdminDocument>("admins").findOne({ email: normalized });
  if (admin) return { role: "admin", account: admin };

  return null;
}

export async function isEmailTaken(email: string): Promise<boolean> {
  return (await findAccountByEmail(email)) !== null;
}

export async function findAccountById(role: AppRole, id: string) {
  if (!ObjectId.isValid(id)) return null;
  const collection = role === "customer" ? "customers" : role === "admin" ? "admins" : "surveyors";
  return getDb()
    .collection<CustomerDocument | SurveyorDocument | AdminDocument>(collection)
    .findOne({ _id: new ObjectId(id) });
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string | undefined | null) {
  // Dokumen lama tanpa password (skema sebelumnya) dianggap tidak cocok.
  if (typeof hash !== "string" || !hash) return false;
  return bcrypt.compare(password, hash);
}

/** Error duplikat dari index unik MongoDB. */
export function isDuplicateKeyError(error: unknown, field?: string) {
  if (typeof error !== "object" || error === null) return false;
  const err = error as { code?: number; keyPattern?: Record<string, unknown>; message?: string };
  if (err.code !== 11000) return false;
  if (!field) return true;
  // Pastikan duplikatnya memang di field yang dimaksud (mis. "email").
  return Boolean(err.keyPattern?.[field]) || Boolean(err.message?.includes(`${field}_`));
}

/** Data akun yang aman dikirim ke client (tanpa password & dokumen). */
export function toPublicAccount(role: AppRole, account: CustomerDocument | SurveyorDocument | AdminDocument) {
  const base = {
    id: account._id.toString(),
    role,
    fullname: account.fullname,
    email: account.email,
    phone: account.phone,
    avatar: account.avatar ?? null,
    domicile: account.domicile ?? null,
    createdAt: account.createdAt,
  };

  if (role === "surveyor") {
    const surveyor = account as SurveyorDocument;
    return {
      ...base,
      coverageArea: surveyor.coverageArea,
      experience: surveyor.experience ?? "",
      acceptingOrders: surveyor.acceptingOrders ?? true,
      verificationStatus: surveyor.verification?.status ?? "PENDING",
      rejectionReason: surveyor.verification?.rejectionReason ?? null,
      rating: surveyor.rating ?? { average: 0, count: 0 },
    };
  }

  return base;
}

export type PublicAccount = ReturnType<typeof toPublicAccount>;
