import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/src/lib/auth/session";

/** POST /api/auth/logout — hapus cookie sesi. */
export async function POST() {
  const response = NextResponse.json({ success: true, data: null });
  clearSessionCookie(response);
  return response;
}
