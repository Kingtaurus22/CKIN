import { z } from "zod";

/**
 * Skema validasi yang dipakai bersama oleh form (client) dan API (server),
 * supaya aturan dan pesan error selalu sama.
 */

/** Ubah "+62 812-3456 7890" / "0812..." / "62812..." menjadi "+628123456789". */
export function normalizePhone(value: string): string {
  const digits = value.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+62")) return digits;
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  return digits;
}

export const emailField = z
  .string({ error: "Email wajib diisi" })
  .trim()
  .toLowerCase()
  .min(1, "Email wajib diisi")
  .email("Format email tidak valid");

export const phoneField = z
  .string({ error: "Nomor WhatsApp wajib diisi" })
  .trim()
  .min(1, "Nomor WhatsApp wajib diisi")
  .transform(normalizePhone)
  .refine(
    (value) => /^\+628[1-9][0-9]{6,11}$/.test(value),
    "Format nomor WhatsApp tidak valid. Contoh: 0812 3456 7890",
  );

export const passwordField = z
  .string({ error: "Kata sandi wajib diisi" })
  .min(8, "Kata sandi minimal 8 karakter")
  .max(72, "Kata sandi maksimal 72 karakter")
  .refine(
    (value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value),
    "Kata sandi harus menggabungkan huruf dan angka",
  );

export const nameField = z
  .string({ error: "Nama lengkap wajib diisi" })
  .trim()
  .min(3, "Nama lengkap minimal 3 karakter")
  .max(80, "Nama lengkap maksimal 80 karakter");

export const loginSchema = z.object({
  email: emailField,
  password: z.string({ error: "Kata sandi wajib diisi" }).min(1, "Kata sandi wajib diisi"),
  remember: z.boolean().optional().default(false),
});

export const registerCustomerSchema = z.object({
  fullname: nameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
  agreement: z
    .boolean({ error: "Silakan centang persetujuan" })
    .refine((value) => value === true, "Silakan setujui Syarat & Ketentuan dan Kebijakan Privasi"),
});

/**
 * Wilayah disimpan lengkap dengan ID dari API wilayah Indonesia (emsifa),
 * supaya pencocokan order ↔ area jangkauan surveyor (Anggota 2 & 3)
 * bisa memakai ID kecamatan yang pasti sama, bukan teks nama.
 */
export const areaSchema = z.object(
  {
  provinceId: z.string({ error: "Provinsi wajib dipilih" }).trim().min(1, "Provinsi wajib dipilih"),
  province: z.string({ error: "Provinsi wajib dipilih" }).trim().min(1, "Provinsi wajib dipilih"),
  cityId: z.string({ error: "Kabupaten/kota wajib dipilih" }).trim().min(1, "Kabupaten/kota wajib dipilih"),
  city: z.string({ error: "Kabupaten/kota wajib dipilih" }).trim().min(1, "Kabupaten/kota wajib dipilih"),
  districtId: z.string({ error: "Kecamatan wajib dipilih" }).trim().min(1, "Kecamatan wajib dipilih"),
  district: z.string({ error: "Kecamatan wajib dipilih" }).trim().min(1, "Kecamatan wajib dipilih"),
  },
  { error: "Domisili wajib dipilih" },
);

export const coverageDistrictsField = z
  .array(
    z.object({ id: z.string().trim().min(1), name: z.string().trim().min(1) }),
    { error: "Pilih minimal satu kecamatan area jangkauan" },
  )
  .min(1, "Pilih minimal satu kecamatan area jangkauan")
  .max(10, "Maksimal 10 kecamatan area jangkauan")
  .transform((list) => Array.from(new Map(list.map((item) => [item.id, item])).values()));

export const registerSurveyorSchema = z.object({
  fullname: nameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
  domicile: areaSchema,
  coverageDistricts: coverageDistrictsField,
  experience: z
    .string({ error: "Pengalaman singkat wajib diisi" })
    .trim()
    .min(20, "Ceritakan pengalaman singkatmu minimal 20 karakter")
    .max(600, "Pengalaman singkat maksimal 600 karakter"),
  agreement: z
    .boolean({ error: "Silakan centang persetujuan" })
    .refine((value) => value === true, "Silakan setujui Perjanjian Kemitraan Surveyor"),
});

export const updateCustomerProfileSchema = z.object({
  fullname: nameField,
  phone: phoneField,
  domicile: areaSchema.nullable().optional(),
});

export const updateSurveyorProfileSchema = z.object({
  fullname: nameField,
  phone: phoneField,
  domicile: areaSchema,
  coverageDistricts: coverageDistrictsField,
  experience: z.string().trim().max(600, "Pengalaman singkat maksimal 600 karakter").optional(),
  acceptingOrders: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama",
    path: ["confirmPassword"],
  });

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type RegisterSurveyorInput = z.infer<typeof registerSurveyorSchema>;
