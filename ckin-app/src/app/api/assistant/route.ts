import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { z } from "zod";
import AssistantModel from "@/db/models/AssistantModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { answerCustomer, answerSurveyor } from "@/src/lib/assistant/answer";
import { finalizeAnswer } from "@/src/lib/assistant/generate";
import {
  ASSISTANT_DAILY_LIMIT,
  ASSISTANT_MAX_LENGTH as MAX_QUESTION_LENGTH,
  ASSISTANT_PER_MINUTE as PER_MINUTE,
} from "@/src/lib/assistant/limits";

const schema = z.object({
  question: z
    .string()
    .trim()
    .min(2, "Tulis pertanyaanmu terlebih dahulu.")
    .max(MAX_QUESTION_LENGTH, `Pertanyaan terlalu panjang. Maksimal ${MAX_QUESTION_LENGTH} karakter.`),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(40)
    .optional()
    .default([]),
});

// Batas per menit (per proses server) untuk mencegah spam.
const hits = new Map<string, number[]>();
function perMinute(userId: string) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < 60000);
  if (recent.length >= PER_MINUTE) {
    throw new ApiError(429, `Terlalu cepat. Maksimal ${PER_MINUTE} pertanyaan per menit — tunggu sebentar lalu coba lagi.`);
  }
  recent.push(now);
  hits.set(userId, recent);
}

async function lang() {
  return (await cookies()).get("ckin_lang")?.value === "en" ? ("en" as const) : ("id" as const);
}

/** GET /api/assistant — sisa kuota pertanyaan hari ini. */
export async function GET() {
  try {
    const session = await requireSession();
    return ok({
      remaining: await AssistantModel.remainingToday(new ObjectId(session.sub)),
      dailyLimit: ASSISTANT_DAILY_LIMIT,
      maxLength: MAX_QUESTION_LENGTH,
    });
  } catch (error) {
    return handleApiError(error, "assistant-quota");
  }
}

/**
 * POST /api/assistant { question }
 * Chatbot customer service berbasis RAG:
 * 1. Retrieval — ambil data pesanan/saldo/penghasilan MILIK pengguna yang login dari MongoDB.
 * 2. Pertanyaan diklasifikasikan ke topik CKIN; di luar topik → ditolak sopan.
 * 3. Jawaban faktual disusun dari data tersebut; opsional dirapikan Gemini dengan validasi anti-halusinasi.
 * Batasan: 300 karakter/pertanyaan, 6 pertanyaan/menit, 30 pertanyaan/hari.
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const userId = new ObjectId(session.sub);
    const { question, history } = schema.parse(await readJson(request));
    perMinute(session.sub);

    const quota = await AssistantModel.consumeDaily(userId);
    const language = await lang();
    if (!quota.allowed) {
      throw new ApiError(
        429,
        language === "en"
          ? `You've reached today's limit of ${ASSISTANT_DAILY_LIMIT} questions. Try again tomorrow, or email bantuan@ckin.id.`
          : `Batas ${ASSISTANT_DAILY_LIMIT} pertanyaan hari ini sudah tercapai. Coba lagi besok, atau email bantuan@ckin.id.`,
      );
    }

    const draft =
      session.role === "customer"
        ? answerCustomer(question, await AssistantModel.customerFacts(userId), language)
        : answerSurveyor(question, await AssistantModel.surveyorFacts(userId), language);
    const final = await finalizeAnswer({ question, draft, history: history.slice(-6), lang: language });

    return ok({
      answer: final.text,
      mode: final.mode,
      intent: draft.intent,
      links: draft.links,
      remaining: quota.remaining,
      dailyLimit: ASSISTANT_DAILY_LIMIT,
    });
  } catch (error) {
    return handleApiError(error, "assistant");
  }
}
