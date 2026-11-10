import ChatModel from "@/db/models/ChatModel";
import { getDb } from "@/db/config/mongodb";
import { orderCode, orderLocation } from "@/db/models/OrderModel";
import { handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { loadConversationForSession } from "@/src/lib/chat-access";
import { STATUS_LABEL, STATUS_TONE, toCanonicalStatus } from "@/src/lib/order-status";
import type { ConversationThread } from "@/src/types/customer";

/**
 * GET /api/conversations/:orderId — riwayat chat satu pesanan.
 * Pesan dari lawan bicara otomatis ditandai sudah dibaca.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await requireSession();
    const { orderId } = await params;
    const { order, conversation } = await loadConversationForSession(orderId, session);

    await ChatModel.markRead(conversation._id, session.role);
    const messages = await ChatModel.listMessages(conversation._id);

    const peerIsSurveyor = session.role === "customer";
    const peerId = peerIsSurveyor ? conversation.surveyorId : conversation.customerId;
    const peer = await getDb()
      .collection(peerIsSurveyor ? "surveyors" : "customers")
      .findOne({ _id: peerId }, { projection: { fullname: 1 } });

    const status = toCanonicalStatus(order.status);
    const thread: ConversationThread = {
      conversation: {
        orderId: order._id.toString(),
        orderCode: orderCode(order),
        peer: {
          id: peerId.toString(),
          name: (peer?.fullname as string | undefined) ?? (peerIsSurveyor ? "Surveyor" : "Customer"),
          role: peerIsSurveyor ? "surveyor" : "customer",
        },
        location: orderLocation(order),
        status,
        statusLabel: STATUS_LABEL[status],
        statusTone: STATUS_TONE[status],
        lastMessage: null,
        unread: 0,
        updatedAt: new Date(conversation.updatedAt).toISOString(),
        surveyDate: order.surveyDate ? new Date(order.surveyDate).toISOString() : null,
        surveyTimeSlot: order.surveyTimeSlot ?? null,
        kosCount: order.kosCount ?? 0,
        payment: ChatModel.payment(order),
      },
      messages,
    };

    return ok(thread);
  } catch (error) {
    return handleApiError(error, "conversation-thread");
  }
}
