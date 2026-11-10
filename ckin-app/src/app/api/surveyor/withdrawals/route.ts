import { ObjectId } from "mongodb";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { withdrawalSchema } from "@/src/schemas/survey";

/** POST /api/surveyor/withdrawals — ajukan penarikan saldo ke rekening. */
export async function POST(request: Request) {
  try {
    const session = await requireSession("surveyor");
    const { amount, ...bank } = withdrawalSchema.parse(await readJson(request));
    const code = await SurveyorWorkModel.requestWithdrawal(new ObjectId(session.sub), amount, bank);
    return ok({ code }, 201);
  } catch (error) {
    return handleApiError(error, "surveyor-withdrawal");
  }
}
