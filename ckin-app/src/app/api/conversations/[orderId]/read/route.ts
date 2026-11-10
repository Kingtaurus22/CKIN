import ChatModel from "@/db/models/ChatModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { loadConversationForSession } from "@/src/lib/chat-access";

/** PATCH /api/conversations/:orderId/read — tandai pesan masuk sudah dibaca. */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await requireSession();
    const { orderId } = await params;
    const { conversation } = await loadConversationForSession(orderId, session);
    const result = await ChatModel.markRead(conversation._id, session.role);
    return ok({ updated: result.modifiedCount });
  } catch (error) {
    return handleApiError(error, "conversation-read");
  }
}
