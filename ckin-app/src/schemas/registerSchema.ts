import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Nama lengkap wajib diisi"),

  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),

  phone: z
    .string()
    .trim()
    .min(1, "Nomor WhatsApp wajib diisi")
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,11}$/,
      "Format nomor WhatsApp tidak valid"
    ),

  password: z.string().min(8, "Kata sandi minimal 8 karakter"),

  agreement: z
    .boolean()
    .refine(
      (value) => value === true,
      "Silakan menyetujui Syarat & Ketentuan"
    ),
});


export const registerSurveyorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi"),

  email: z
    .string()
    .trim()
    .email("Format email tidak valid"),

  phone: z
    .string()
    .trim()
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,11}$/,
      "Format nomor WhatsApp tidak valid"
    ),

  password: z
    .string()
    .min(8, "Kata sandi minimal 8 karakter"),

  provinceId: z
    .string()
    .min(1, "Provinsi wajib dipilih"),

  province: z
    .string()
    .trim()
    .min(1, "Provinsi wajib dipilih"),

  cityId: z
    .string()
    .min(1, "Kota atau kabupaten wajib dipilih"),

  city: z
    .string()
    .trim()
    .min(1, "Kota atau kabupaten wajib dipilih"),

  districtId: z
    .string()
    .min(1, "Kecamatan wajib dipilih"),

  district: z
    .string()
    .trim()
    .min(1, "Kecamatan wajib dipilih"),

  surveyDistricts: z
    .array(z.string().trim().min(1))
    .min(1, "Pilih minimal satu area survei"),
});
