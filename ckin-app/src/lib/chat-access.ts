import { ObjectId } from "mongodb";
import ChatModel from "@/db/models/ChatModel";
import OrderModel, { toObjectId } from "@/db/models/OrderModel";
import { ApiError } from "./api";
import type { UserSession } from "./auth/session";

/**
 * Validasi akses percakapan: hanya customer pemilik order dan surveyor
 * yang mengambil order tersebut yang boleh masuk.
 */
export async function loadConversationForSession(orderIdParam: string, session: UserSession) {
  const orderId = toObjectId(orderIdParam);
  if (!orderId) throw new ApiError(404, "Percakapan tidak ditemukan.");

  const userId = new ObjectId(session.sub);
  const order = await OrderModel.findForParticipant(orderId, userId, session.role);
  if (!order) throw new ApiError(404, "Percakapan tidak ditemukan.");

  if (!order.SurveyorId) {
    throw new ApiError(409, "Chat aktif setelah surveyor mengambil pesananmu.");
  }

  const conversation = await ChatModel.getOrCreateForOrder(order);
  if (!conversation) throw new ApiError(409, "Percakapan belum tersedia.");

  return { order, conversation, userId };
}
