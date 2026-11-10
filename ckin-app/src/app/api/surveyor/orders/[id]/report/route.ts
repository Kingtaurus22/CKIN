import { ObjectId } from "mongodb";
import { toObjectId } from "@/db/models/OrderModel";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { reportDraftSchema } from "@/src/schemas/survey";

/**
 * PUT /api/surveyor/orders/:id/report — simpan draf laporan & progres checklist.
 * Draf pertama otomatis mengubah status order menjadi "Dalam proses".
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("surveyor");
    const { id } = await params;
    const orderId = toObjectId(id);
    if (!orderId) throw new ApiError(404, "Order tidak ditemukan.");

    const { items } = reportDraftSchema.parse(await readJson(request));
    const savedAt = await SurveyorWorkModel.saveDraft(
      orderId,
      new ObjectId(session.sub),
      items.map((item) => ({ ...item, price: item.price ?? undefined })),
    );
    return ok({ savedAt: savedAt.toISOString(), status: "IN_PROGRESS" });
  } catch (error) {
    return handleApiError(error, "surveyor-save-report");
  }
}
