import ChatModel from "@/db/models/ChatModel";
import { ApiError, handleApiError, ok } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { loadConversationForSession } from "@/src/lib/chat-access";
import { uploadToCloudinary, validateUpload } from "@/src/lib/cloudinary";

const MAX_TEXT = 2000;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/conversations/:orderId/messages — kirim pesan.
 * Body JSON `{ text }` atau multipart `text` + `image` (foto maks. 5 MB).
 * Setelah tersimpan, client memberi tahu server Socket.IO agar pesan
 * diteruskan real-time ke lawan bicara.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await requireSession();
    const { orderId } = await params;
    const { conversation, userId } = await loadConversationForSession(orderId, session);

    let text = "";
    let image: File | null = null;

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const rawText = form.get("text");
      text = typeof rawText === "string" ? rawText : "";
      const rawImage = form.get("image");
      if (rawImage instanceof File && rawImage.size > 0) {
        const error = validateUpload(rawImage, "Foto", IMAGE_TYPES);
        if (error) throw new ApiError(400, error);
        image = rawImage;
      }
    } else {
      const body = await request.json().catch(() => ({}));
      text = typeof body?.text === "string" ? body.text : "";
    }

    text = text.trim();
    if (!text && !image) throw new ApiError(400, "Pesan tidak boleh kosong.");
    if (text.length > MAX_TEXT) throw new ApiError(400, `Pesan maksimal ${MAX_TEXT} karakter.`);

    let attachment = null;
    if (image) {
      const upload = await uploadToCloudinary(image, `ckin/chat/${orderId}`);
      attachment = { url: upload.secureUrl, publicId: upload.publicId, name: image.name };
    }

    const message = await ChatModel.addMessage({
      conversation,
      senderId: userId,
      senderRole: session.role,
      text,
      attachment,
    });

    return ok({ message }, 201);
  } catch (error) {
    return handleApiError(error, "conversation-send");
  }
}
