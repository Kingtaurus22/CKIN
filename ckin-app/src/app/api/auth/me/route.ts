import { NextResponse } from "next/server";
import { findAccountById, toPublicAccount } from "@/db/models/AccountModel";
import { fail, handleApiError, ok } from "@/src/lib/api";
import { AuthError, clearSessionCookie, getSession } from "@/src/lib/auth/session";

/** GET /api/auth/me — profil akun yang sedang login. */
export async function GET() {
  try {
    // Termasuk super admin (requireSession() tanpa argumen menolak admin).
    const session = await getSession();
    if (!session) throw new AuthError(401, "Sesi berakhir. Silakan masuk kembali.");
    const account = await findAccountById(session.role, session.sub);

    if (!account) {
      // Akun sudah dihapus: bersihkan cookie supaya tidak terjebak loop.
      const response = NextResponse.json(
        { success: false, message: "Akun tidak ditemukan." },
        { status: 401 },
      );
      clearSessionCookie(response);
      return response;
    }

    return ok({ user: toPublicAccount(session.role, account) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("JWT_SECRET")) {
      return fail("Konfigurasi server belum lengkap (JWT_SECRET).", 500);
    }
    return handleApiError(error, "me");
  }
}
