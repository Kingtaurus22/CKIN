import { ObjectId } from "mongodb";
import { toObjectId } from "@/db/models/OrderModel";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { reportSubmitSchema } from "@/src/schemas/survey";

/** POST /api/surveyor/orders/:id/report/submit — kirim laporan final ke customer. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession("surveyor");
    const { id } = await params;
    const orderId = toObjectId(id);
    if (!orderId) throw new ApiError(404, "Order tidak ditemukan.");
    const surveyorId = new ObjectId(session.sub);

    const { items } = reportSubmitSchema.parse(await readJson(request));
    const order = await SurveyorWorkModel.findMine(orderId, surveyorId);
    if (items.length !== (order.kosCount || 1)) {
      throw new ApiError(400, `Laporan harus berisi ${order.kosCount} kos sesuai pesanan.`);
    }

    await SurveyorWorkModel.submit(
      orderId,
      surveyorId,
      items.map((item) => ({ ...item, price: item.price ?? undefined })),
    );
    return ok({ status: "REPORT_SUBMITTED" });
  } catch (error) {
    return handleApiError(error, "surveyor-submit-report");
  }
}
