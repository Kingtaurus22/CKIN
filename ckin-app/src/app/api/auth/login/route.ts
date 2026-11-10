import { NextResponse } from "next/server";
import { findAccountByEmail, toPublicAccount, verifyPassword } from "@/db/models/AccountModel";
import { fail, handleApiError, readJson } from "@/src/lib/api";
import { homePathFor } from "@/src/lib/auth/jwt";
import { attachSessionCookie } from "@/src/lib/auth/session";
import { loginSchema } from "@/src/schemas/auth";

const INVALID_MESSAGE = "Email atau kata sandi salah.";

/**
 * POST /api/auth/login
 * Mencari akun di koleksi customers lalu surveyors, memverifikasi password,
 * dan menyimpan JWT di cookie httpOnly (tidak bisa dibaca JavaScript).
 */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const { email, password, remember } = loginSchema.parse(body);

    const match = await findAccountByEmail(email);
    if (!match || !(await verifyPassword(password, match.account.password))) {
      return fail(INVALID_MESSAGE, 401);
    }

    const user = toPublicAccount(match.role, match.account);
    const response = NextResponse.json({
      success: true,
      data: { user, redirectTo: homePathFor(match.role) },
    });

    await attachSessionCookie(
      response,
      {
        sub: user.id,
        role: match.role,
        name: user.fullname,
        email: user.email,
      },
      remember,
    );

    return response;
  } catch (error) {
    return handleApiError(error, "login");
  }
}
