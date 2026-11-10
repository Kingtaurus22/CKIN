import midtransClient from "midtrans-client";

/**
 * Klien Midtrans Snap (dari kode Reynaldo), dibuat saat pertama dipakai
 * supaya aplikasi tetap bisa jalan walau key Midtrans belum diisi.
 */
type SnapClient = {
  createTransaction(parameter: Record<string, unknown>): Promise<{ token: string; redirect_url: string }>;
  transaction: {
    notification(body: unknown): Promise<MidtransNotification>;
    status(midtransOrderId: string): Promise<MidtransNotification>;
  };
};

export type MidtransNotification = {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
  gross_amount: string;
};

let snap: SnapClient | null = null;

export function getSnap(): SnapClient {
  if (!snap) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;
    if (!serverKey || !clientKey) {
      throw new Error("MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY belum diatur di .env");
    }
    snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
      serverKey,
      clientKey,
    }) as unknown as SnapClient;
  }
  return snap;
}

/** Metode pilihan customer → daftar `enabled_payments` Snap. */
export const ENABLED_PAYMENTS: Record<string, string[]> = {
  bank: ["bca_va", "bni_va", "bri_va", "echannel", "permata_va", "other_va"],
  qris: ["other_qris"],
  ewallet: ["gopay", "shopeepay"],
};

/**
 * URL aplikasi untuk callback "finish" Midtrans.
 * Diambil dari alamat yang SEDANG dipakai customer (header Host), supaya
 * cookie login ikut terbawa saat kembali dari Midtrans. Contoh: jika aplikasi
 * dibuka lewat http://desktop-abc:3000, customer juga kembali ke alamat itu
 * — bukan ke localhost (cookie per-alamat tidak terbawa → terlihat "logout").
 * NEXT_PUBLIC_BASE_URL hanya dipakai bila header Host tidak tersedia.
 */
export function appBaseUrl(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
      new URL(request.url).protocol.replace(":", "");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
}
