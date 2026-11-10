import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, homePathFor, verifySession } from "@/src/lib/auth/jwt";

/**
 * Route guard (Next.js 16: `proxy.ts`, pengganti `middleware.ts`).
 *
 * - /customer/**  hanya untuk role customer
 * - /surveyor/**  hanya untuk role surveyor
 * - /admin/**     hanya untuk super admin
 * - /login, /register, /register-surveyor dialihkan ke dashboard jika sudah login
 *
 * Catatan: ini hanya untuk navigasi halaman. Setiap API tetap memeriksa
 * sesi sendiri lewat requireSession().
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token).catch(() => null);

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/register-surveyor";

  if (isAuthPage) {
    if (session) {
      return NextResponse.redirect(new URL(homePathFor(session.role), request.url));
    }
    return NextResponse.next();
  }

  const requiredRole = pathname.startsWith("/customer")
    ? "customer"
    : pathname.startsWith("/surveyor")
      ? "surveyor"
      : pathname.startsWith("/admin")
        ? "admin"
        : null;

  if (!requiredRole) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    // Cookie kedaluwarsa/rusak dibersihkan.
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (session.role !== requiredRole) {
    return NextResponse.redirect(new URL(homePathFor(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/customer/:path*",
    "/surveyor/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/register-surveyor",
  ],
};
