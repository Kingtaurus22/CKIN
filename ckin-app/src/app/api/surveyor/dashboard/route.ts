import { ObjectId } from "mongodb";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** GET /api/surveyor/dashboard — ringkasan dashboard surveyor. */
export async function GET() {
  try {
    const session = await requireSession("surveyor");
    return ok(await SurveyorWorkModel.dashboard(new ObjectId(session.sub)));
  } catch (error) {
    return handleApiError(error, "surveyor-dashboard");
  }
}
