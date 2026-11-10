import { ObjectId } from "mongodb";
import { getDb } from "../config/mongodb";
import type {
  ConversationDocument,
  CustomerDocument,
  MessageDocument,
  OrderDocument,
  SurveyorDocument,
} from "./types";
import { orderCode, orderLocation } from "./OrderModel";
import {
  STATUS_LABEL,
  STATUS_TONE,
  paymentLabel,
  toCanonicalStatus,
} from "@/src/lib/order-status";
import type { ChatMessage, ConversationSummary } from "@/src/types/customer";

type Role = "customer" | "surveyor";

/**
 * Koleksi `conversations` (satu percakapan per order) dan `messages`.
 * Hanya customer pemilik order dan surveyor yang mengambil order
 * yang boleh membaca/menulis percakapan.
 */

let indexesReady: Promise<unknown> | null = null;
function ensureIndexes() {
  if (!indexesReady) {
    const db = getDb();
    indexesReady = Promise.all([
      db.collection("conversations").createIndex({ orderId: 1 }, { unique: true }),
      db.collection("conversations").createIndex({ customerId: 1, updatedAt: -1 }),
      db.collection("conversations").createIndex({ surveyorId: 1, updatedAt: -1 }),
      db.collection("messages").createIndex({ conversationId: 1, createdAt: 1 }),
    ]).catch((error) => {
      // Tidak fatal: chat tetap jalan tanpa index, hanya dicatat di terminal.
      console.warn("[ckin] Index chat belum bisa dibuat:", error?.message ?? error);
    });
  }
  return indexesReady;
}

export function toChatMessage(message: MessageDocument): ChatMessage {
  return {
    id: message._id.toString(),
    orderId: message.orderId.toString(),
    senderId: message.senderId.toString(),
    senderRole: message.senderRole,
    text: message.text,
    attachment: message.attachment
      ? { url: message.attachment.url, name: message.attachment.name }
      : null,
    createdAt: new Date(message.createdAt).toISOString(),
    readAt: message.readAt ? new Date(message.readAt).toISOString() : null,
  };
}

class ChatModel {
  static conversations() {
    return getDb().collection<ConversationDocument>("conversations");
  }

  static messages() {
    return getDb().collection<MessageDocument>("messages");
  }

  /** Ambil (atau buat) percakapan untuk order yang sudah punya surveyor. */
  static async getOrCreateForOrder(order: OrderDocument) {
    await ensureIndexes();
    if (!order.SurveyorId) return null;

    const now = new Date();
    return this.conversations().findOneAndUpdate(
      { orderId: order._id },
      {
        $setOnInsert: {
          orderId: order._id,
          customerId: order.UserId,
          lastMessage: null,
          createdAt: now,
          updatedAt: now,
        },
        // Selalu sinkron dengan surveyor yang sedang ditugaskan.
        $set: { surveyorId: order.SurveyorId },
      },
      { upsert: true, returnDocument: "after" },
    );
  }

  static async listMessages(conversationId: ObjectId, limit = 200) {
    const items = await this.messages()
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return items.reverse().map(toChatMessage);
  }

  static async addMessage(input: {
    conversation: ConversationDocument;
    senderId: ObjectId;
    senderRole: Role;
    text: string;
    attachment: MessageDocument["attachment"];
  }) {
    const now = new Date();
    const message: MessageDocument = {
      _id: new ObjectId(),
      conversationId: input.conversation._id,
      orderId: input.conversation.orderId,
      senderId: input.senderId,
      senderRole: input.senderRole,
      text: input.text,
      attachment: input.attachment,
      createdAt: now,
      readAt: null,
    };

    await this.messages().insertOne(message);
    await this.conversations().updateOne(
      { _id: input.conversation._id },
      {
        $set: {
          lastMessage: {
            text: input.text || (input.attachment ? "📷 Foto" : ""),
            senderRole: input.senderRole,
            createdAt: now,
          },
          updatedAt: now,
        },
      },
    );

    return toChatMessage(message);
  }

  /** Tandai pesan dari lawan bicara sebagai sudah dibaca. */
  static markRead(conversationId: ObjectId, readerRole: Role) {
    return this.messages().updateMany(
      { conversationId, senderRole: { $ne: readerRole }, readAt: null },
      { $set: { readAt: new Date() } },
    );
  }

  /** Daftar percakapan milik user + jumlah pesan belum dibaca. */
  static async listForUser(userId: ObjectId, role: Role): Promise<ConversationSummary[]> {
    await ensureIndexes();
    const db = getDb();

    // Pastikan percakapan ada untuk semua order user yang sudah punya surveyor.
    const orders = await db
      .collection<OrderDocument>("orders")
      .find(role === "customer" ? { UserId: userId, SurveyorId: { $ne: null } } : { SurveyorId: userId })
      .project<OrderDocument>({ requirements: 0, targets: 0, statusHistory: 0 })
      .toArray();

    await Promise.all(
      orders.map(async (order) => {
        const exists = await this.conversations().countDocuments({ orderId: order._id }, { limit: 1 });
        if (!exists) await this.getOrCreateForOrder(order);
      }),
    );

    const conversations = await this.conversations()
      .find(role === "customer" ? { customerId: userId } : { surveyorId: userId })
      .sort({ updatedAt: -1 })
      .toArray();
    if (conversations.length === 0) return [];

    const orderMap = new Map(orders.map((order) => [order._id.toString(), order]));
    const peerIds = conversations.map((c) => (role === "customer" ? c.surveyorId : c.customerId));
    const peerCollection = role === "customer" ? "surveyors" : "customers";
    const peers = await db
      .collection<CustomerDocument | SurveyorDocument>(peerCollection)
      .find({ _id: { $in: peerIds } }, { projection: { fullname: 1 } })
      .toArray();
    const peerMap = new Map(peers.map((peer) => [peer._id.toString(), peer.fullname]));

    const unreadRows = await this.messages()
      .aggregate<{ _id: ObjectId; count: number }>([
        {
          $match: {
            conversationId: { $in: conversations.map((c) => c._id) },
            senderRole: { $ne: role },
            readAt: null,
          },
        },
        { $group: { _id: "$conversationId", count: { $sum: 1 } } },
      ])
      .toArray();
    const unreadMap = new Map(unreadRows.map((row) => [row._id.toString(), row.count]));

    return conversations
      .filter((conversation) => orderMap.has(conversation.orderId.toString()))
      .map((conversation) => {
        const order = orderMap.get(conversation.orderId.toString())!;
        const status = toCanonicalStatus(order.status);
        const peerId = role === "customer" ? conversation.surveyorId : conversation.customerId;

        return {
          orderId: order._id.toString(),
          orderCode: orderCode(order),
          peer: {
            id: peerId.toString(),
            name: peerMap.get(peerId.toString()) ?? (role === "customer" ? "Surveyor" : "Customer"),
            role: role === "customer" ? "surveyor" : "customer",
          },
          location: orderLocation(order),
          status,
          statusLabel: STATUS_LABEL[status],
          statusTone: STATUS_TONE[status],
          lastMessage: conversation.lastMessage
            ? {
                text: conversation.lastMessage.text,
                senderRole: conversation.lastMessage.senderRole,
                createdAt: new Date(conversation.lastMessage.createdAt).toISOString(),
              }
            : null,
          unread: unreadMap.get(conversation._id.toString()) ?? 0,
          updatedAt: new Date(conversation.updatedAt).toISOString(),
        };
      });
  }

  static payment(order: OrderDocument) {
    return paymentLabel(order.payment?.paymentStatus, order.paidAt, toCanonicalStatus(order.status));
  }
}

export default ChatModel;
