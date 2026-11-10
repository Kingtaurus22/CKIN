import { ObjectId } from "mongodb";
import { toObjectId } from "@/db/models/OrderModel";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { ApiError, handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** POST /api/surveyor/open-orders/:id/assign — ambil order (satu order hanya untuk satu surveyor). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("surveyor");
    const { id } = await params;
    const orderId = toObjectId(id);
    if (!orderId) throw new ApiError(404, "Order tidak ditemukan.");

    const order = await SurveyorWorkModel.assign(orderId, new ObjectId(session.sub));
    return ok({ id: order._id.toString(), status: order.status });
  } catch (error) {
    return handleApiError(error, "surveyor-assign-order");
  }
}
