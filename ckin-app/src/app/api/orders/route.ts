import { ObjectId } from "mongodb";
import OrderModel from "@/db/models/OrderModel";
import SurveyorModel from "@/db/models/SurveyorModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { regionLabel } from "@/src/lib/format";
import { createOrderSchema } from "@/src/schemas/order";

/**
 * POST /api/orders — customer membuat pesanan survei (Anggota 2).
 * Pesanan dibuat dengan status PENDING_PAYMENT dan batas bayar 24 jam.
 * Daftar pesanan customer ada di GET /api/customer/orders.
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession("customer");
    const data = createOrderSchema.parse(await readJson(request));

    // Pastikan ada surveyor aktif yang menjangkau kecamatan tujuan.
    const available = await SurveyorModel.countActiveInDistrict(data.surveyLocation.districtId);
    if (available === 0) {
      throw new ApiError(
        409,
        `Belum ada surveyor yang menjangkau ${regionLabel(data.surveyLocation.district)}. Pilih kecamatan lain.`,
      );
    }

    const order = await OrderModel.create(new ObjectId(session.sub), data);

    return ok({ id: order._id.toString(), code: order.orderCode, total: order.pricing }, 201);
  } catch (error) {
    return handleApiError(error, "create-order");
  }
}
