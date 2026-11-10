import { ObjectId } from "mongodb";
import CustomerModel from "@/db/models/CustomerModel";
import SurveyorModel from "@/db/models/SurveyorModel";
import { findAccountById, toPublicAccount } from "@/db/models/AccountModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import {
  updateCustomerProfileSchema,
  updateSurveyorProfileSchema,
} from "@/src/schemas/auth";

/** GET /api/profile — data profil lengkap untuk halaman pengaturan akun. */
export async function GET() {
  try {
    const session = await requireSession();
    const account = await findAccountById(session.role, session.sub);
    if (!account) throw new ApiError(404, "Akun tidak ditemukan.");

    return ok({ user: toPublicAccount(session.role, account) });
  } catch (error) {
    return handleApiError(error, "profile-get");
  }
}

/**
 * PATCH /api/profile — perbarui profil.
 * Customer: nama, WhatsApp, domisili (opsional).
 * Surveyor: nama, WhatsApp, domisili, area jangkauan, pengalaman, status terima order.
 * Email tidak bisa diubah di sini karena menjadi identitas login.
 */
export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const body = await readJson(request);
    const id = new ObjectId(session.sub);

    if (session.role === "customer") {
      const data = updateCustomerProfileSchema.parse(body);
      const updated = await CustomerModel.updateProfile(id, data);
      if (!updated) throw new ApiError(404, "Akun tidak ditemukan.");
      return ok({ user: toPublicAccount("customer", updated) });
    }

    const data = updateSurveyorProfileSchema.parse(body);
    const updated = await SurveyorModel.updateProfile(id, data);
    if (!updated) throw new ApiError(404, "Akun tidak ditemukan.");
    return ok({ user: toPublicAccount("surveyor", updated) });
  } catch (error) {
    return handleApiError(error, "profile-update");
  }
}
