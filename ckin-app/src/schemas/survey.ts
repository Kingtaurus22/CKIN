import { z } from "zod";
import { AVAILABILITY_OPTIONS, CHECKLIST_ITEMS, MIN_WITHDRAWAL } from "@/src/lib/survey";

/**
 * Validasi laporan survei (Anggota 3) — dipakai form "Kelola survei" dan API surveyor.
 * Draf boleh belum lengkap; laporan final (submit) wajib lengkap per kos.
 */

const mediaSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  name: z.string().max(200).default(""),
  size: z.number().nonnegative().default(0),
  type: z.enum(["image", "video"]),
});

const draftItemSchema = z.object({
  kostName: z.string().trim().max(120).default(""),
  address: z.string().trim().max(300).default(""),
  price: z.number().int().nonnegative().max(100_000_000).nullable().default(null),
  availability: z.string().trim().max(60).default(""),
  condition: z.string().trim().max(3000).default(""),
  notes: z.string().trim().max(2000).default(""),
  checkedItems: z
    .array(z.string())
    .default([])
    .transform((list) => [...new Set(list)].filter((label) => CHECKLIST_ITEMS.includes(label))),
  media: z.array(mediaSchema).max(20, "Maksimal 20 file per kos").default([]),
});

export const reportDraftSchema = z.object({
  items: z.array(draftItemSchema).min(1).max(4),
});

const submitItemSchema = draftItemSchema.superRefine((item, ctx) => {
  const name = item.kostName || "Kos";
  const issue = (message: string) => ctx.addIssue({ code: "custom", message });
  if (!item.kostName) issue("Nama kos wajib diisi untuk setiap kos.");
  if (!item.address) issue(`Alamat ${name} wajib diisi.`);
  if (!item.price) issue(`Harga sewa terkonfirmasi ${name} wajib diisi.`);
  if (!AVAILABILITY_OPTIONS.includes(item.availability)) issue(`Pilih ketersediaan kamar ${name}.`);
  if (item.checkedItems.length < CHECKLIST_ITEMS.length) {
    issue(`Checklist ${name} belum lengkap (${item.checkedItems.length}/${CHECKLIST_ITEMS.length}).`);
  }
  if (!item.media.some((m) => m.type === "image")) issue(`Unggah minimal 1 foto bukti untuk ${name}.`);
  if (item.condition.length < 10) issue(`Isi kondisi, fasilitas & lingkungan ${name} (min. 10 karakter).`);
});

export const reportSubmitSchema = z.object({
  items: z.array(submitItemSchema).min(1).max(4),
});

export type ReportDraftInput = z.infer<typeof reportDraftSchema>;

export const withdrawalSchema = z.object({
  amount: z
    .number({ error: "Nominal wajib diisi" })
    .int("Nominal harus bilangan bulat")
    .min(MIN_WITHDRAWAL, `Minimal penarikan Rp${MIN_WITHDRAWAL.toLocaleString("id-ID")}`),
  bankName: z.string().trim().min(2, "Nama bank wajib diisi").max(60),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, "Nomor rekening harus 6–20 digit angka"),
  accountHolder: z.string().trim().min(3, "Nama pemilik rekening wajib diisi").max(100),
});
