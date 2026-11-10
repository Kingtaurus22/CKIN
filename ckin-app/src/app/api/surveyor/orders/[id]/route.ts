import { ObjectId } from "mongodb";
import { toObjectId } from "@/db/models/OrderModel";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { ApiError, handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** GET /api/surveyor/orders/:id — detail order + draf/laporan survei. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("surveyor");
    const { id } = await params;
    const orderId = toObjectId(id);
    if (!orderId) throw new ApiError(404, "Order tidak ditemukan.");
    return ok(await SurveyorWorkModel.detail(orderId, new ObjectId(session.sub)));
  } catch (error) {
    return handleApiError(error, "surveyor-order-detail");
  }
}
