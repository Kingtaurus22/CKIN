import { ObjectId } from "mongodb";
import { z } from "zod";
import { isDuplicateKeyError } from "@/db/models/AccountModel";
import OrderModel, { toObjectId } from "@/db/models/OrderModel";
import SurveyReportModel, { ReviewModel } from "@/db/models/SurveyReportModel";
import { ApiError, fail, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

const reviewSchema = z.object({
  rating: z.number().int().min(1, "Pilih rating 1–5").max(5, "Pilih rating 1–5"),
  comment: z
    .string()
    .trim()
    .min(10, "Ulasan minimal 10 karakter")
    .max(1000, "Ulasan maksimal 1000 karakter"),
});

/** POST /api/customer/orders/:id/review — ulasan untuk surveyor setelah laporan diterima. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession("customer");
    const { id } = await params;
    const data = reviewSchema.parse(await readJson(request));

    const orderId = toObjectId(id);
    if (!orderId) throw new ApiError(404, "Pesanan tidak ditemukan.");

    const customerId = new ObjectId(session.sub);
    const order = await OrderModel.findOwnedByCustomer(orderId, customerId);
    if (!order || !order.SurveyorId) throw new ApiError(404, "Pesanan tidak ditemukan.");

    if (!(await SurveyReportModel.existsForOrder(order._id))) {
      throw new ApiError(409, "Ulasan bisa dikirim setelah laporan survei diterima.");
    }

    await ReviewModel.create({
      orderId: order._id,
      customerId,
      surveyorId: order.SurveyorId,
      rating: data.rating,
      comment: data.comment,
    });
    await OrderModel.markCompletedAfterReview(order._id, customerId);

    return ok({ message: "Terima kasih, ulasanmu sudah terkirim." }, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return fail("Kamu sudah memberi ulasan untuk pesanan ini.", 409);
    }
    return handleApiError(error, "customer-order-review");
  }
}
