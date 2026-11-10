import { ObjectId } from "mongodb";
import OrderModel, { toObjectId } from "@/db/models/OrderModel";
import { ApiError, handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

const REASONS = {
  NOT_FOUND: { status: 404, message: "Pesanan tidak ditemukan." },
  ALREADY_ASSIGNED: {
    status: 409,
    message: "Pesanan sudah diambil surveyor dan tidak dapat dibatalkan.",
  },
  NOT_CANCELLABLE: {
    status: 409,
    message: "Pesanan ini sudah tidak dapat dibatalkan.",
  },
} as const;

/** PATCH /api/customer/orders/:id/cancel — batalkan pesanan yang belum diambil surveyor. */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession("customer");
    const { id } = await params;

    const orderId = toObjectId(id);
    if (!orderId) throw new ApiError(404, REASONS.NOT_FOUND.message);

    const result = await OrderModel.cancelByCustomer(orderId, new ObjectId(session.sub));

    if (!result.success) {
      const reason = REASONS[result.reason];
      throw new ApiError(reason.status, reason.message);
    }

    return ok({ id: result.order._id.toString(), status: result.order.status, refunded: result.refunded });
  } catch (error) {
    return handleApiError(error, "customer-order-cancel");
  }
}
