import { ObjectId } from "mongodb";
import ChatModel from "@/db/models/ChatModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";

/** GET /api/conversations — daftar percakapan user (customer atau surveyor). */
export async function GET() {
  try {
    const session = await requireSession();
    const conversations = await ChatModel.listForUser(new ObjectId(session.sub), session.role);
    const totalUnread = conversations.reduce((sum, item) => sum + item.unread, 0);

    return ok({ conversations, totalUnread });
  } catch (error) {
    return handleApiError(error, "conversations-list");
  }
}
