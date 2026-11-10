import { z } from "zod";
import AdminModel from "@/db/models/AdminModel";
import { toObjectId } from "@/db/models/OrderModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

const schema = z
  .object({
    status: z.enum(["SUCCESS", "REJECTED"]),
    note: z.string().trim().max(300).optional().default(""),
  })
  .refine((v) => v.status === "SUCCESS" || v.note.length >= 5, {
    message: "Tuliskan alasan penolakan (min. 5 karakter).",
    path: ["note"],
  });

/**
 * PATCH /api/admin/withdrawals/:id { status, note }
 * SUCCESS = dana sudah ditransfer ke rekening surveyor.
 * REJECTED = dana kembali ke saldo surveyor (tidak dihitung sebagai penarikan).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession("admin");
    const { id } = await params;
    const wdId = toObjectId(id);
    if (!wdId) throw new ApiError(404, "Penarikan tidak ditemukan.");
    const { status, note } = schema.parse(await readJson(request));
    await AdminModel.processWithdrawal(wdId, status, note || null);
    return ok({ id, status });
  } catch (error) {
    return handleApiError(error, "admin-process-withdrawal");
  }
}
