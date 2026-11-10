import SurveyorModel from "@/db/models/SurveyorModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/**
 * GET /api/orders/available-surveyors
 * Provinsi → kota → kecamatan yang dijangkau surveyor aktif (+ jumlah surveyor).
 */
export async function GET() {
  try {
    await requireSession("customer");
    return ok({ provinces: await SurveyorModel.availableAreas() });
  } catch (error) {
    return handleApiError(error, "available-surveyors");
  }
}
