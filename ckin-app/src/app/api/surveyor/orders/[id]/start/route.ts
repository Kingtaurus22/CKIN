import { ObjectId } from "mongodb";
import { toObjectId } from "@/db/models/OrderModel";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { ApiError, handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** PATCH /api/surveyor/orders/:id/start — tandai survei dimulai (Terjadwal → Dalam proses). */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("surveyor");
    const { id } = await params;
    const orderId = toObjectId(id);
    if (!orderId) throw new ApiError(404, "Order tidak ditemukan.");
    const surveyorId = new ObjectId(session.sub);
    SurveyorWorkModel.assertEditable(await SurveyorWorkModel.findMine(orderId, surveyorId));
    await SurveyorWorkModel.start(orderId, surveyorId);
    return ok({ status: "IN_PROGRESS" });
  } catch (error) {
    return handleApiError(error, "surveyor-start-survey");
  }
}
