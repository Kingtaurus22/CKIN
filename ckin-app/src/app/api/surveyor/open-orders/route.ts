import { ObjectId } from "mongodb";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { MAX_ACTIVE_ORDERS } from "@/src/lib/survey";

/**
 * GET /api/surveyor/open-orders — order yang sudah dibayar, belum diambil,
 * dan berada di kecamatan jangkauan surveyor.
 */
export async function GET() {
  try {
    const session = await requireSession("surveyor");
    const surveyorId = new ObjectId(session.sub);
    const [surveyor, orders, activeDates] = await Promise.all([
      SurveyorWorkModel.getSurveyor(surveyorId),
      SurveyorWorkModel.listOpen(surveyorId),
      SurveyorWorkModel.activeDates(surveyorId),
    ]);
    return ok({
      orders,
      activeCount: activeDates.length,
      // Tanggal yang sudah terisi: order lain di tanggal ini tidak bisa diambil.
      activeDates,
      maxActive: MAX_ACTIVE_ORDERS,
      verified: surveyor.verification?.status === "APPROVED",
      acceptingOrders: surveyor.acceptingOrders !== false,
      coverage: {
        city: surveyor.coverageArea?.city ?? "",
        districts: surveyor.coverageArea?.districts ?? [],
      },
    });
  } catch (error) {
    return handleApiError(error, "surveyor-open-orders");
  }
}
