import { ObjectId } from "mongodb";
import { toObjectId } from "@/db/models/OrderModel";
import SurveyorWorkModel from "@/db/models/SurveyorWorkModel";
import { ApiError, handleApiError, ok, readJson } from "@/src/lib/api";
import { requireSession } from "@/src/lib/auth/session";
import { deleteFromCloudinary, uploadToCloudinary } from "@/src/lib/cloudinary";
import { MAX_PHOTO_SIZE, MAX_VIDEO_SIZE, PHOTO_TYPES, VIDEO_TYPES } from "@/src/lib/survey";

type Ctx = { params: Promise<{ id: string }> };

async function ownedEditableOrder(ctx: Ctx) {
  const session = await requireSession("surveyor");
  const { id } = await ctx.params;
  const orderId = toObjectId(id);
  if (!orderId) throw new ApiError(404, "Order tidak ditemukan.");
  const order = await SurveyorWorkModel.findMine(orderId, new ObjectId(session.sub));
  SurveyorWorkModel.assertEditable(order);
  return order;
}

/**
 * POST /api/surveyor/orders/:id/media — upload foto/video bukti survei ke Cloudinary
 * (multipart, field `file`). Foto JPG/PNG/WebP maks 5 MB, video MP4/WebM/MOV maks 50 MB.
 */
export async function POST(request: Request, ctx: Ctx) {
  try {
    const order = await ownedEditableOrder(ctx);
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new ApiError(400, "Format upload tidak valid.");
    }
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new ApiError(400, "Pilih file foto atau video.");

    const isPhoto = PHOTO_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!isPhoto && !isVideo) {
      throw new ApiError(400, "Format file harus JPG, PNG, WebP, MP4, WebM, atau MOV.");
    }
    if (isPhoto && file.size > MAX_PHOTO_SIZE) throw new ApiError(400, "Ukuran foto maksimal 5 MB.");
    if (isVideo && file.size > MAX_VIDEO_SIZE) throw new ApiError(400, "Ukuran video maksimal 50 MB.");

    const uploaded = await uploadToCloudinary(file, `ckin/reports/${order._id.toString()}`);
    return ok(
      {
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
        name: file.name.slice(0, 200),
        size: file.size,
        type: isVideo ? "video" : "image",
      },
      201,
    );
  } catch (error) {
    return handleApiError(error, "surveyor-upload-media");
  }
}

/** DELETE /api/surveyor/orders/:id/media — hapus file bukti `{ publicId, type }`. */
export async function DELETE(request: Request, ctx: Ctx) {
  try {
    const order = await ownedEditableOrder(ctx);
    const body = await readJson(request);
    const publicId = typeof body.publicId === "string" ? body.publicId : "";
    if (!SurveyorWorkModel.ownsMedia(order._id, publicId)) throw new ApiError(403, "File bukan milik order ini.");
    await deleteFromCloudinary(publicId, false, body.type === "video" ? "video" : "image");
    return ok({ publicId });
  } catch (error) {
    return handleApiError(error, "surveyor-delete-media");
  }
}
