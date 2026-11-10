/** Aturan harga & jadwal pesanan survei (dipakai client dan server). */

export const PRICE_PER_KOS = 75000;
export const SERVICE_FEE = 5000;
export const MAX_KOS = 4;

/** Top up Saldo CKIN via Midtrans. Biaya admin ditanggung customer di luar nominal top up. */
export const TOPUP_ADMIN_FEE = 2500;
export const TOPUP_MIN = 10000;
export const TOPUP_MAX = 10_000_000;
export const TOPUP_PRESETS = [50000, 100000, 200000, 500000];

/** Survei paling cepat H+2 dari hari ini. */
export const MIN_SURVEY_DAYS_AHEAD = 2;
/** Survei paling lambat 7 hari sebelum rencana masuk kos. */
export const SURVEY_GAP_BEFORE_MOVE_IN = 7;
/** Batas waktu pembayaran setelah pesanan dibuat. */
export const PAYMENT_WINDOW_HOURS = 24;

export const SURVEY_TIME_SLOTS = ["09.00–12.00 WIB", "13.00–16.00 WIB", "16.00–18.00 WIB"] as const;
export type SurveyTimeSlot = (typeof SURVEY_TIME_SLOTS)[number];

/** Pendapatan surveyor per order = biaya survei per kos × jumlah kos (biaya layanan milik CKIN). */
export function surveyorEarning(kosCount: number) {
  return kosCount * PRICE_PER_KOS;
}

export function orderTotal(kosCount: number) {
  return kosCount * PRICE_PER_KOS + SERVICE_FEE;
}

/** Tanggal lokal Asia/Jakarta dalam format YYYY-MM-DD. */
export function jakartaDate(offsetDays = 0, from: Date = new Date()) {
  const shifted = new Date(from.getTime() + offsetDays * 86400000);
  return shifted.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

/** Tambah n hari ke string YYYY-MM-DD. */
export function addDays(ymd: string, days: number) {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function minSurveyDate() {
  return jakartaDate(MIN_SURVEY_DAYS_AHEAD);
}

export function minMoveInDate() {
  return addDays(minSurveyDate(), SURVEY_GAP_BEFORE_MOVE_IN);
}

export function maxSurveyDateFor(moveInDate: string) {
  return addDays(moveInDate, -SURVEY_GAP_BEFORE_MOVE_IN);
}
