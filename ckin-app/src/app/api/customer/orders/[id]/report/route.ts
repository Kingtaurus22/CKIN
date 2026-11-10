import { ObjectId } from "mongodb";
import OrderModel, { orderCode, toObjectId } from "@/db/models/OrderModel";
import SurveyReportModel, { ReviewModel } from "@/db/models/SurveyReportModel";
import SurveyorModel from "@/db/models/SurveyorModel";
import { ApiError, handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { paymentLabel, toCanonicalStatus } from "@/src/lib/order-status";
import type { SurveyReportView } from "@/src/types/customer";

/** GET /api/customer/orders/:id/report — laporan survei untuk pesanan milik customer. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession("customer");
    const { id } = await params;

    const orderId = toObjectId(id);
    if (!orderId) throw new ApiError(404, "Pesanan tidak ditemukan.");

    const order = await OrderModel.findOwnedByCustomer(orderId, new ObjectId(session.sub));
    if (!order) throw new ApiError(404, "Pesanan tidak ditemukan.");

    const report = await SurveyReportModel.findByOrderId(order._id);
    if (!report) {
      return ok({ report: null, orderCode: orderCode(order) });
    }

    const [surveyor, review] = await Promise.all([
      order.SurveyorId ? SurveyorModel.findById(order.SurveyorId) : null,
      ReviewModel.findByOrderId(order._id),
    ]);

    const status = toCanonicalStatus(order.status);
    const view: SurveyReportView = {
      orderId: order._id.toString(),
      orderCode: orderCode(order),
      surveyDate: order.surveyDate ? new Date(order.surveyDate).toISOString() : null,
      submittedAt: new Date(report.submittedAt ?? report.updatedAt ?? Date.now()).toISOString(),
      surveyor: surveyor
        ? {
            id: surveyor._id.toString(),
            name: surveyor.fullname,
            district: surveyor.domicile?.district ?? "",
            city: surveyor.domicile?.city ?? "",
          }
        : null,
      summary: report.summary ?? null,
      status,
      payment: paymentLabel(order.payment?.paymentStatus, order.paidAt, status),
      items: (report.items ?? []).map((item) => ({
        kostName: item.kostName,
        address: item.address ?? "",
        size: item.size ?? null,
        genderPreference: item.genderPreference ?? null,
        price: typeof item.price === "number" ? item.price : null,
        availability: item.availability ?? null,
        facilities: item.facilities ?? [],
        // Laporan baru menyimpan media lengkap; laporan lama hanya array URL.
        photos: item.media?.length
          ? item.media.filter((m) => m.type === "image").map((m) => m.url)
          : (item.photos ?? []),
        videos: item.media?.length
          ? item.media.filter((m) => m.type === "video").map((m) => m.url)
          : (item.videos ?? []),
        pros: item.pros ?? [],
        cons: item.cons ?? [],
        notes: item.notes ?? null,
        score: typeof item.score === "number" ? item.score : null,
        distanceNote: item.distanceNote ?? null,
        condition: item.condition ?? null,
        checkedItems: item.checkedItems ?? [],
      })),
      review: review
        ? {
            rating: review.rating,
            comment: review.comment,
            createdAt: new Date(review.createdAt).toISOString(),
          }
        : null,
    };

    return ok({ report: view, orderCode: view.orderCode });
  } catch (error) {
    return handleApiError(error, "customer-order-report");
  }
}
