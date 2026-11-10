import { z } from "zod";
import {
  MAX_KOS,
  TOPUP_MAX,
  TOPUP_MIN,
  SURVEY_TIME_SLOTS,
  maxSurveyDateFor,
  minMoveInDate,
  minSurveyDate,
} from "@/src/lib/pricing";

/**
 * Validasi pesanan baru (Anggota 2) — dipakai form client dan API POST /api/orders.
 * Jenis layanan:
 *  - SURVEYOR_RECOMMENDATION: surveyor mencarikan kos sesuai preferensi
 *  - USER_CHOICE: customer sudah punya daftar kos
 */
export const SERVICE_TYPES = ["SURVEYOR_RECOMMENDATION", "USER_CHOICE"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];
export const GENDER_PREFERENCES = ["FEMALE", "MALE", "ANY"] as const;

const ymd = z.string({ error: "Tanggal wajib dipilih" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid");

export const surveyLocationSchema = z.object(
  {
    provinceId: z.string().trim().min(1, "Provinsi wajib dipilih"),
    province: z.string().trim().min(1, "Provinsi wajib dipilih"),
    cityId: z.string().trim().min(1, "Kota/kabupaten wajib dipilih"),
    city: z.string().trim().min(1, "Kota/kabupaten wajib dipilih"),
    districtId: z.string().trim().min(1, "Kecamatan wajib dipilih"),
    district: z.string().trim().min(1, "Kecamatan wajib dipilih"),
  },
  { error: "Lokasi survei wajib dipilih" },
);

export const targetSchema = z.object({
  propertyName: z.string().trim().min(1, "Nama kos wajib diisi").max(120),
  address: z.string().trim().min(5, "Alamat kos wajib diisi").max(300),
  googleMapsUrls: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//i.test(v) || /^(maps\.app\.goo\.gl|goo\.gl|www\.google)/i.test(v), "Tautan harus berupa URL")
    .optional()
    .default(""),
  ownerContact: z.string().trim().max(120).optional().default(""),
});

export const requirementsSchema = z.object({
  genderPreferences: z.enum(GENDER_PREFERENCES).optional(),
  budget: z
    .object({
      min: z.number().int().min(0, "Budget minimum tidak valid"),
      max: z.number().int().min(1, "Budget maksimum wajib diisi").max(100_000_000),
    })
    .refine((b) => b.min <= b.max, "Budget minimum tidak boleh melebihi maksimum")
    .optional(),
  facilities: z.array(z.string().trim().min(1).max(60)).max(20).optional().default([]),
  landmark: z.string().trim().max(160).optional().default(""),
  notes: z.string().trim().max(500, "Catatan maksimal 500 karakter").optional().default(""),
});

export const createOrderSchema = z
  .object({
    serviceType: z.enum(SERVICE_TYPES, { error: "Pilih cara mencari kos" }),
    surveyLocation: surveyLocationSchema,
    kosCount: z
      .number({ error: "Jumlah kos wajib dipilih" })
      .int()
      .min(1, "Minimal 1 kos")
      .max(MAX_KOS, `Maksimal ${MAX_KOS} kos per pesanan`),
    requirements: requirementsSchema.optional().default({ facilities: [], landmark: "", notes: "" }),
    targets: z.array(targetSchema).max(MAX_KOS).optional().default([]),
    moveInDate: ymd,
    surveyDate: ymd,
    // Jam survei tidak lagi dipilih customer — surveyor mengatur jam kunjungan lewat chat.
    surveyTimeSlot: z.enum(SURVEY_TIME_SLOTS).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.serviceType === "USER_CHOICE" && data.targets.length !== data.kosCount) {
      ctx.addIssue({
        code: "custom",
        path: ["targets"],
        message: `Lengkapi data ${data.kosCount} kos yang ingin disurvei`,
      });
    }

    if (data.serviceType === "SURVEYOR_RECOMMENDATION") {
      if (!data.requirements.genderPreferences) {
        ctx.addIssue({ code: "custom", path: ["requirements", "genderPreferences"], message: "Pilih tipe kos" });
      }
      if (!data.requirements.budget) {
        ctx.addIssue({ code: "custom", path: ["requirements", "budget"], message: "Isi rentang budget" });
      }
    }

    if (data.moveInDate < minMoveInDate()) {
      ctx.addIssue({ code: "custom", path: ["moveInDate"], message: "Tanggal masuk minimal 9 hari dari sekarang" });
    }
    if (data.surveyDate < minSurveyDate()) {
      ctx.addIssue({ code: "custom", path: ["surveyDate"], message: "Tanggal survei minimal 2 hari dari sekarang" });
    }
    if (data.surveyDate > maxSurveyDateFor(data.moveInDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["surveyDate"],
        message: "Survei harus minimal 7 hari sebelum tanggal masuk kos",
      });
    }
  });

export type CreateOrderInput = z.input<typeof createOrderSchema>;
export type CreateOrderData = z.output<typeof createOrderSchema>;

export const PAYMENT_METHODS = ["saldo", "bank", "qris", "ewallet"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const createPaymentSchema = z.object({
  orderId: z.string().regex(/^[a-f0-9]{24}$/i, "ID pesanan tidak valid"),
  method: z.enum(PAYMENT_METHODS, { error: "Pilih metode pembayaran" }),
});

/** Top up Saldo CKIN via Midtrans (tanpa opsi "saldo"). */
export const topupSchema = z.object({
  amount: z
    .number({ error: "Nominal top up wajib diisi" })
    .int("Nominal harus bilangan bulat")
    .min(TOPUP_MIN, `Minimal top up Rp${TOPUP_MIN.toLocaleString("id-ID")}`)
    .max(TOPUP_MAX, `Maksimal top up Rp${TOPUP_MAX.toLocaleString("id-ID")}`),
  method: z.enum(["bank", "qris", "ewallet"], { error: "Pilih metode pembayaran" }),
});
