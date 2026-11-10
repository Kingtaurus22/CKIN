import { z } from "zod";
import AdminModel from "@/db/models/AdminModel";
import { toObjectId } from "@/db/models/OrderModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

const schema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reason: z.string().trim().max(300).optional().default(""),
  })
  .refine((v) => v.status === "APPROVED" || v.reason.length >= 5, {
    message: "Tuliskan alasan penolakan (min. 5 karakter).",
    path: ["reason"],
  });

/** PATCH /api/admin/surveyors/:id { status, reason } — setujui / tolak verifikasi surveyor. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession("admin");
    const { id } = await params;
    const surveyorId = toObjectId(id);
    if (!surveyorId) throw new ApiError(404, "Surveyor tidak ditemukan.");
    const { status, reason } = schema.parse(await readJson(request));
    await AdminModel.setVerification(surveyorId, status, reason || null);
    return ok({ id, status });
  } catch (error) {
    return handleApiError(error, "admin-verify-surveyor");
  }
}
