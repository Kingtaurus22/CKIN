import AdminModel from "@/db/models/AdminModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;

/** GET /api/admin/surveyors?status=PENDING — daftar surveyor + tautan dokumen (bertanda tangan). */
export async function GET(request: Request) {
  try {
    await requireSession("admin");
    const raw = new URL(request.url).searchParams.get("status") ?? "PENDING";
    const status = (STATUSES as readonly string[]).includes(raw) ? (raw as (typeof STATUSES)[number]) : "PENDING";
    return ok({ surveyors: await AdminModel.listSurveyors(status) });
  } catch (error) {
    return handleApiError(error, "admin-surveyors");
  }
}
