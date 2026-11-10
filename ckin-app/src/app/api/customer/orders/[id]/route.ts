import { ObjectId } from "mongodb";
import OrderModel, { toObjectId } from "@/db/models/OrderModel";
import SurveyReportModel from "@/db/models/SurveyReportModel";
import { ApiError, handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** GET /api/customer/orders/:id — detail pesanan + progres (timeline) survei. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession("customer");
    const { id } = await params;

    const orderId = toObjectId(id);
    if (!orderId) throw new ApiError(404, "Pesanan tidak ditemukan.");

    const customerId = new ObjectId(session.sub);
    await OrderModel.expireOverdue(customerId);

    // Hanya pemilik pesanan yang bisa melihat detailnya.
    const order = await OrderModel.findOwnedByCustomer(orderId, customerId);
    if (!order) throw new ApiError(404, "Pesanan tidak ditemukan.");

    const hasReport = await SurveyReportModel.existsForOrder(order._id);
    return ok({ order: await OrderModel.toDetail(order, hasReport) });
  } catch (error) {
    return handleApiError(error, "customer-order-detail");
  }
}
