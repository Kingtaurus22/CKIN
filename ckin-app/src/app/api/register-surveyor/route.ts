
import { NextResponse } from "next/server";
import UserModel from "../../../../db/models/UserModel";
import { uploadToCloudinary } from "../../../../lib/uploadCloudinary";
import SurveyorModel from "../../../../db/models/SurveyorModel";
import { registerSurveyorSchema } from "../../../schemas/registerSchema";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_KTP_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const ALLOWED_SELFIE_TYPES = [
  "image/jpeg",
  "image/png",
];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const fullname = getString(formData, "name");
    const email = getString(formData, "email").toLowerCase();
    const phone = getString(formData, "whatsapp");
    const password = getString(formData, "password");

    const provinceId = getString(formData, "provinceId");
    const province = getString(formData, "province");

    const cityId = getString(formData, "cityId");
    const city = getString(formData, "city");

    const districtId = getString(formData, "districtId");
    const district = getString(formData, "district");

    const surveyDistrictsRaw = getString(
      formData,
      "surveyDistricts"
    );

    // Parse area survei dari FormData
    let surveyDistricts: string[];

    try {
      const parsedDistricts: unknown = JSON.parse(
        surveyDistrictsRaw
      );

      if (!Array.isArray(parsedDistricts)) {
        return NextResponse.json(
          { message: "Data area survei tidak valid." },
          { status: 400 }
        );
      }

      surveyDistricts = parsedDistricts;
    } catch {
      return NextResponse.json(
        { message: "Data area survei tidak valid." },
        { status: 400 }
      );
    }

    // Validasi data menggunakan Zod
    const validation = registerSurveyorSchema.safeParse({
      name: fullname,
      email,
      phone,
      password,
      provinceId,
      province,
      cityId,
      city,
      districtId,
      district,
      surveyDistricts,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          message: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    // Gunakan data yang sudah divalidasi Zod
    const {
      name,
      email: validatedEmail,
      phone: validatedPhone,
      password: validatedPassword,
      province: validatedProvince,
      city: validatedCity,
      district: validatedDistrict,
      surveyDistricts: validatedSurveyDistricts,
    } = validation.data;

    // Validasi dokumen
    const ktp = formData.get("ktp");
    const selfie = formData.get("selfie");

    if (!(ktp instanceof File) || !(selfie instanceof File)) {
      return NextResponse.json(
        { message: "KTP dan foto selfie wajib diunggah." },
        { status: 400 }
      );
    }

    // Validasi KTP
    if (
      ktp.size === 0 ||
      ktp.size > MAX_FILE_SIZE ||
      !ALLOWED_KTP_TYPES.includes(ktp.type)
    ) {
      return NextResponse.json(
        {
          message:
            "KTP harus berupa JPG, PNG, atau PDF dengan ukuran maksimal 5 MB.",
        },
        { status: 400 }
      );
    }

    // Validasi selfie
    if (
      selfie.size === 0 ||
      selfie.size > MAX_FILE_SIZE ||
      !ALLOWED_SELFIE_TYPES.includes(selfie.type)
    ) {
      return NextResponse.json(
        {
          message:
            "Foto selfie harus berupa JPG atau PNG dengan ukuran maksimal 5 MB.",
        },
        { status: 400 }
      );
    }

    // Cek email
    const existingUser = await UserModel.findByEmail(
      validatedEmail
    );

    if (existingUser) {
      return NextResponse.json(
        { message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    // Upload dokumen ke Cloudinary
    const ktpUpload = await uploadToCloudinary(
      ktp,
      "ckin/surveyors/ktp"
    );

    const selfieUpload = await uploadToCloudinary(
      selfie,
      "ckin/surveyors/selfie"
    );

    // Buat user
    const user = await UserModel.createUser({
      fullname: name,
      email: validatedEmail,
      password: validatedPassword,
      phone: validatedPhone,
      role: "surveyor",
    });

    try {
      // Buat data surveyor
      const surveyor = await SurveyorModel.createSurveyor({
        UserId: user._id,

        domicileProvince: validatedProvince,
        domicileCity: validatedCity,
        domicileDistrict: validatedDistrict,

        coverageAreas: {
          province: validatedProvince,
          city: validatedCity,
          districts: validatedSurveyDistricts,
        },

        Income: null,

        documents: {
          ktpPublicId: ktpUpload.publicId,
          selfiePublicId: selfieUpload.publicId,
        },
      });

      return NextResponse.json(
        {
          message: "Registrasi surveyor berhasil.",
          user: {
            id: user._id.toString(),
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          surveyor: {
            id: surveyor._id.toString(),
            UserId: surveyor.UserId,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      // Hapus user jika pembuatan surveyor gagal
      await UserModel.collection().deleteOne({
        _id: user._id,
      });

      throw error;
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      const cloudinaryError = error as Error & {
        http_code?: number;
        error?: unknown;
      };

      console.error("Register surveyor error:", {
        message: cloudinaryError.message,
        http_code: cloudinaryError.http_code,
        name: cloudinaryError.name,
        response: cloudinaryError.error,
      });
    } else {
      console.error("Register surveyor error:", error);
    }

    if (
      error instanceof Error &&
      error.message === "EMAIL_ALREADY_EXISTS"
    ) {
      return NextResponse.json(
        { message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Registrasi gagal. Silakan coba kembali." },
      { status: 500 }
    );
  }
}
