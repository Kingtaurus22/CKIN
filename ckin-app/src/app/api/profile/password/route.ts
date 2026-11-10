import { ObjectId } from "mongodb";
import CustomerModel from "@/db/models/CustomerModel";
import SurveyorModel from "@/db/models/SurveyorModel";
import { findAccountById, verifyPassword } from "@/db/models/AccountModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { changePasswordSchema } from "@/src/schemas/auth";

/** PATCH /api/profile/password — ganti kata sandi (wajib kata sandi lama). */
export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const data = changePasswordSchema.parse(await readJson(request));

    const account = await findAccountById(session.role, session.sub);
    if (!account) throw new ApiError(404, "Akun tidak ditemukan.");

    if (!(await verifyPassword(data.currentPassword, account.password))) {
      throw new ApiError(400, "Kata sandi saat ini salah.");
    }
    if (data.currentPassword === data.newPassword) {
      throw new ApiError(400, "Kata sandi baru harus berbeda dari yang lama.");
    }

    const id = new ObjectId(session.sub);
    if (session.role === "customer") {
      await CustomerModel.updatePassword(id, data.newPassword);
    } else {
      await SurveyorModel.updatePassword(id, data.newPassword);
    }

    return ok({ message: "Kata sandi berhasil diperbarui." });
  } catch (error) {
    return handleApiError(error, "profile-password");
  }
}
