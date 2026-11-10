import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_LONG,
  SESSION_TTL_SHORT,
  signSession,
  verifySession,
  type AppRole,
  type SessionPayload,
  type UserRole,
} from "./jwt";

/** Sesi customer/surveyor (role sudah dipersempit). */
export type UserSession = SessionPayload & { role: UserRole };
export type AdminSession = SessionPayload & { role: "admin" };

/** Ambil sesi login dari cookie httpOnly. Mengembalikan null jika tidak valid. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(SESSION_COOKIE)?.value);
}

export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Wajib login (dan opsional wajib role tertentu).
 * Tanpa argumen hanya menerima customer/surveyor — akun admin harus diminta
 * eksplisit lewat requireSession("admin").
 * Lempar AuthError yang nanti diubah menjadi response 401/403 oleh handleApiError.
 */
export async function requireSession(role: "admin"): Promise<AdminSession>;
export async function requireSession(role?: UserRole): Promise<UserSession>;
export async function requireSession(role?: AppRole): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    throw new AuthError(401, "Sesi berakhir. Silakan masuk kembali.");
  }

  if (role ? session.role !== role : session.role === "admin") {
    throw new AuthError(403, "Kamu tidak memiliki akses ke data ini.");
  }

  return session;
}

/** Pasang cookie sesi pada response login. */
export async function attachSessionCookie(
  response: NextResponse,
  data: Omit<SessionPayload, "iat" | "exp">,
  remember: boolean,
) {
  const ttl = remember ? SESSION_TTL_LONG : SESSION_TTL_SHORT;
  const token = await signSession(data, ttl);

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Tanpa "Ingat saya" cookie hilang saat browser ditutup.
    ...(remember ? { maxAge: ttl } : {}),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
