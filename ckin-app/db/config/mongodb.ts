import { MongoClient, type Db } from "mongodb";

/**
 * Satu MongoClient dipakai bersama untuk seluruh aplikasi.
 * Disimpan di globalThis agar tidak membuat koneksi baru setiap kali
 * file di-reload saat development (hot reload).
 */
const globalForMongo = globalThis as unknown as {
  __ckinMongoClient?: MongoClient;
};

function getClient(): MongoClient {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI belum diatur. Salin .env.example menjadi .env lalu isi nilainya.",
    );
  }

  if (!globalForMongo.__ckinMongoClient) {
    globalForMongo.__ckinMongoClient = new MongoClient(uri);
  }

  return globalForMongo.__ckinMongoClient;
}

/** Ambil database CKIN. Koneksi dibuka otomatis oleh driver saat query pertama. */
export function getDb(): Db {
  return getClient().db(process.env.MONGODB_DB || "ckin");
}
