import SurveyorModel from "@/db/models/SurveyorModel";
import { isDuplicateKeyError, isEmailTaken, toPublicAccount } from "@/db/models/AccountModel";
import { fail, handleApiError, ok } from "@/src/lib/api";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
  validateUpload,
} from "@/src/lib/cloudinary";
import { registerSurveyorSchema } from "@/src/schemas/auth";

const IMAGE_TYPES = ["image/jpeg", "image/png"];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Area jangkauan dikirim sebagai JSON: [{ id, name }, ...]. Validasi detail oleh Zod. */
function parseJsonArray(raw: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** POST /api/auth/register-surveyor — daftar mitra surveyor (multipart/form-data). */
export async function POST(request: Request) {
  const uploaded: string[] = [];

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return fail("Format data tidak valid.", 400);
    }

    const data = registerSurveyorSchema.parse({
      fullname: getString(formData, "fullname"),
      email: getString(formData, "email"),
      phone: getString(formData, "phone"),
      password: getString(formData, "password"),
      domicile: {
        provinceId: getString(formData, "provinceId"),
        province: getString(formData, "province"),
        cityId: getString(formData, "cityId"),
        city: getString(formData, "city"),
        districtId: getString(formData, "districtId"),
        district: getString(formData, "district"),
      },
      coverageDistricts: parseJsonArray(getString(formData, "coverageDistricts")),
      experience: getString(formData, "experience"),
      agreement: getString(formData, "agreement") === "true",
    });

    const ktp = formData.get("ktp");
    const selfie = formData.get("selfie");

    const fileError =
      validateUpload(ktp, "Foto KTP", IMAGE_TYPES) ??
      validateUpload(selfie, "Swafoto dengan KTP", IMAGE_TYPES);
    if (fileError) return fail(fileError, 400);

    // Cek email SEBELUM upload agar tidak ada file yatim di Cloudinary.
    if (await isEmailTaken(data.email)) {
      return fail("Email sudah terdaftar. Silakan masuk atau gunakan email lain.", 409);
    }

    // Dokumen identitas disimpan sebagai aset privat.
    const ktpUpload = await uploadToCloudinary(ktp as File, "ckin/surveyors/ktp", {
      privateAsset: true,
    });
    uploaded.push(ktpUpload.publicId);

    const selfieUpload = await uploadToCloudinary(selfie as File, "ckin/surveyors/selfie", {
      privateAsset: true,
    });
    uploaded.push(selfieUpload.publicId);

    const surveyor = await SurveyorModel.create({
      fullname: data.fullname,
      email: data.email,
      phone: data.phone,
      password: data.password,
      domicile: data.domicile,
      coverageDistricts: data.coverageDistricts,
      experience: data.experience,
      documents: {
        ktpPublicId: ktpUpload.publicId,
        selfiePublicId: selfieUpload.publicId,
      },
    });

    return ok({ user: toPublicAccount("surveyor", surveyor) }, 201);
  } catch (error) {
    // Bersihkan dokumen yang sudah terunggah jika pendaftaran gagal.
    await Promise.all(uploaded.map((id) => deleteFromCloudinary(id, true)));

    if (isDuplicateKeyError(error, "email")) {
      return fail("Email sudah terdaftar. Silakan masuk atau gunakan email lain.", 409);
    }
    return handleApiError(error, "register-surveyor");
  }
}
