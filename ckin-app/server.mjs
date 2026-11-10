/**
 * Custom server CKIN: Next.js + Socket.IO dalam satu port.
 *
 *   npm run dev     → development (Next.js + chat real-time)
 *   npm run start   → production (jalankan `npm run build` dulu)
 *
 * Alur chat real-time:
 * 1. Client menyimpan pesan lewat REST API (POST /api/conversations/:orderId/messages).
 * 2. Client mengirim event "message:relay" { orderId, messageId } ke socket.
 * 3. Server memastikan user anggota percakapan, mengambil pesan ASLI dari MongoDB,
 *    lalu meneruskannya ke room `order:<orderId>`.
 * Dengan begitu isi pesan selalu berasal dari database, bukan dari client.
 *
 * Jika socket tidak tersambung (mis. memakai `npm run dev:next`), halaman chat
 * otomatis kembali ke mode polling.
 */
import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import next from "next";
import { Server } from "socket.io";
import { MongoClient, ObjectId } from "mongodb";

const dev = !process.argv.includes("--prod");
if (!process.env.NODE_ENV) process.env.NODE_ENV = dev ? "development" : "production";
const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOSTNAME || "localhost";
// Catatan: isi .env dimuat oleh Next.js saat app.prepare(); variabel env
// di bawah hanya dibaca setelahnya (saat ada koneksi socket).

const SESSION_COOKIE = "ckin_session";

function verifySession(token) {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expected = createHmac("sha256", secret).update(`${header}.${body}`).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.sub || !["customer", "surveyor"].includes(payload.role)) return null;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

let mongo = null;
function db() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI belum diatur");
  if (!mongo) mongo = new MongoClient(process.env.MONGODB_URI);
  return mongo.db(process.env.MONGODB_DB || "ckin");
}

function toObjectId(value) {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value) ? new ObjectId(value) : null;
}

/** Cek apakah user boleh mengakses percakapan order ini. */
async function canAccessOrder(user, orderId) {
  const _id = toObjectId(orderId);
  const userId = toObjectId(user.sub);
  if (!_id || !userId) return false;
  const filter = user.role === "customer" ? { _id, UserId: userId } : { _id, SurveyorId: userId };
  const order = await db().collection("orders").findOne(filter, { projection: { _id: 1, SurveyorId: 1 } });
  return Boolean(order && order.SurveyorId);
}

function serializeMessage(message) {
  return {
    id: message._id.toString(),
    orderId: message.orderId.toString(),
    senderId: message.senderId.toString(),
    senderRole: message.senderRole,
    text: message.text,
    attachment: message.attachment ? { url: message.attachment.url, name: message.attachment.name } : null,
    createdAt: new Date(message.createdAt).toISOString(),
    readAt: message.readAt ? new Date(message.readAt).toISOString() : null,
  };
}

const app = next({ dev, hostname, port, turbopack: dev });
const handle = app.getRequestHandler();

await app.prepare();

const httpServer = createServer((req, res) => handle(req, res));
const io = new Server(httpServer, { path: "/socket.io" });

// Autentikasi socket memakai cookie sesi yang sama dengan halaman web.
io.use((socket, nextFn) => {
  const user = verifySession(readCookie(socket.handshake.headers.cookie, SESSION_COOKIE));
  if (!user) return nextFn(new Error("UNAUTHORIZED"));
  socket.data.user = user;
  nextFn();
});

io.on("connection", (socket) => {
  const user = socket.data.user;
  socket.join(`user:${user.sub}`);

  socket.on("conversation:join", async ({ orderId } = {}, ack) => {
    try {
      if (!(await canAccessOrder(user, orderId))) {
        ack?.({ ok: false, message: "Tidak punya akses ke percakapan ini." });
        return;
      }
      socket.join(`order:${orderId}`);
      ack?.({ ok: true });
    } catch (error) {
      console.error("[socket] join error:", error);
      ack?.({ ok: false, message: "Gagal bergabung ke percakapan." });
    }
  });

  socket.on("conversation:leave", ({ orderId } = {}) => {
    if (typeof orderId === "string") socket.leave(`order:${orderId}`);
  });

  socket.on("message:relay", async ({ orderId, messageId } = {}) => {
    try {
      if (!socket.rooms.has(`order:${orderId}`)) return;
      const _id = toObjectId(messageId);
      if (!_id) return;
      const message = await db().collection("messages").findOne({ _id });
      // Hanya pengirim asli yang boleh me-relay pesannya sendiri.
      if (!message || message.orderId.toString() !== orderId || message.senderId.toString() !== user.sub) {
        return;
      }
      const payload = serializeMessage(message);
      socket.to(`order:${orderId}`).emit("message:new", payload);

      // Beri tahu lawan bicara (untuk badge "Pesan" di sidebar) walau tidak sedang membuka chat.
      const conversation = await db().collection("conversations").findOne({ _id: message.conversationId });
      if (conversation) {
        const peerId = user.role === "customer" ? conversation.surveyorId : conversation.customerId;
        io.to(`user:${peerId.toString()}`).emit("conversation:updated", { orderId });
      }
    } catch (error) {
      console.error("[socket] relay error:", error);
    }
  });

  socket.on("conversation:read", ({ orderId } = {}) => {
    if (socket.rooms.has(`order:${orderId}`)) {
      socket.to(`order:${orderId}`).emit("conversation:read", { orderId, readerRole: user.role });
    }
  });

  socket.on("typing", ({ orderId, typing } = {}) => {
    if (socket.rooms.has(`order:${orderId}`)) {
      socket.to(`order:${orderId}`).emit("typing", { orderId, role: user.role, typing: Boolean(typing) });
    }
  });
});

httpServer.listen(port, () => {
  console.log(`> CKIN siap di http://${hostname}:${port} (${dev ? "development" : "production"}) + Socket.IO`);
});
