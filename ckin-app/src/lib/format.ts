/** Helper format tampilan (aman dipakai di server maupun client). */

export function formatRupiah(amount: number | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(amount ?? 0)
    .replace(/\s/g, "");
}

const TZ = "Asia/Jakarta";

export function formatDate(value: string | Date | null | undefined, style: "short" | "long" = "short") {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return "";
  return new Date(value)
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    .replace(":", ".");
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "-";
  return `${formatDate(value, "long")}, ${formatTime(value)} WIB`;
}

/** "09.20" untuk hari ini, "Kemarin", atau "04 Nov". */
export function formatRelativeShort(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  if (dayKey(date) === dayKey(today)) return formatTime(date);
  if (dayKey(date) === dayKey(yesterday)) return "Kemarin";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", timeZone: TZ });
}

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/** "Bima Wicaksono" → "Bima W." */
export function shortName(name: string | null | undefined) {
  if (!name) return "";
  const [first, second] = name.trim().split(/\s+/);
  return second ? `${first} ${second[0].toUpperCase()}.` : first;
}

export function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] ?? "";
}

/** "KABUPATEN SLEMAN" → "Kabupaten Sleman", "DI YOGYAKARTA" → "DI Yogyakarta". */
export function regionLabel(name: string | null | undefined) {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word) =>
      ["di", "dki"].includes(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** "KABUPATEN SLEMAN" → "Sleman" */
export function shortCity(name: string | null | undefined) {
  return regionLabel((name ?? "").replace(/^(KABUPATEN|KAB\.?|KOTA ADM\.?|KOTA)\s+/i, ""));
}
