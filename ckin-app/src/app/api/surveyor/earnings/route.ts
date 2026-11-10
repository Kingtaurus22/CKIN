import { ObjectId } from "mongodb";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** GET /api/surveyor/earnings — pendapatan, saldo, dana tertahan, dan riwayat pencairan. */
export async function GET() {
  try {
    const session = await requireSession("surveyor");
    return ok(await SurveyorWorkModel.earnings(new ObjectId(session.sub)));
  } catch (error) {
    return handleApiError(error, "surveyor-earnings");
  }
}
