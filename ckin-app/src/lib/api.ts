import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./auth/session";
import { unstable_rethrow } from "next/navigation";

/** Error yang aman ditampilkan ke pengguna, lengkap dengan status HTTP. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

function isPrerenderBailout(error: unknown) {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return digest === "HANGING_PROMISE_REJECTION" || digest === "NEXT_PRERENDER_INTERRUPTED";
}

/** Ubah error apa pun menjadi response JSON yang konsisten. */
export function handleApiError(error: unknown, context: string) {
  // Error internal Next.js (prerender, redirect, notFound) diteruskan ke Next.js.
  unstable_rethrow(error);
  // Saat build, route GET yang membaca cookies() berhenti di-prerender. Itu normal, tidak perlu di-log.
  if (isPrerenderBailout(error)) return fail("Prerender dilewati.", 500);

  if (error instanceof AuthError || error instanceof ApiError) {
    return fail(error.message, error.status);
  }

  if (error instanceof ZodError) {
    return fail(error.issues[0]?.message ?? "Data tidak valid.", 400);
  }

  console.error(`[${context}]`, error);
  return fail("Terjadi kesalahan pada server. Silakan coba lagi.", 500);
}

/** Baca body JSON dengan aman. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    throw new ApiError(400, "Format data tidak valid.");
  }
}
