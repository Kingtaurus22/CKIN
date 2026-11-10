import { ObjectId } from "mongodb";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** GET /api/surveyor/orders — semua order yang pernah diambil surveyor. */
export async function GET() {
  try {
    const session = await requireSession("surveyor");
    return ok({ orders: await SurveyorWorkModel.listMine(new ObjectId(session.sub)) });
  } catch (error) {
    return handleApiError(error, "surveyor-orders");
  }
}
