import { v2 as cloudinary } from "cloudinary";

let configured = false;

function getCloudinary() {
  if (!configured) {
    if (!process.env.CLOUDINARY_URL) {
      throw new Error("CLOUDINARY_URL belum diatur di file .env");
    }
    // SDK membaca CLOUDINARY_URL dari environment secara otomatis.
    cloudinary.config({ secure: true });
    configured = true;
  }
  return cloudinary;
}

type UploadResult = {
  publicId: string;
  secureUrl: string;
};

/**
 * Upload file ke Cloudinary.
 * `privateAsset: true` dipakai untuk dokumen sensitif (KTP, selfie) supaya
 * file TIDAK bisa diakses publik lewat URL biasa (type "authenticated").
 */
export async function uploadToCloudinary(
  file: File,
  folder: string,
  options: { privateAsset?: boolean } = {},
): Promise<UploadResult> {
  const client = getCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        type: options.privateAsset ? "authenticated" : "upload",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload gagal."));
          return;
        }
        resolve({ publicId: result.public_id, secureUrl: result.secure_url });
      },
    );

    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(
  publicId: string,
  privateAsset = false,
  resourceType: "image" | "video" = "image",
) {
  try {
    await getCloudinary().uploader.destroy(publicId, {
      type: privateAsset ? "authenticated" : "upload",
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Gagal menghapus file Cloudinary:", error);
  }
}

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** Validasi ukuran dan tipe file upload. Mengembalikan pesan error atau null. */
export function validateUpload(
  file: FormDataEntryValue | null,
  label: string,
  allowedTypes: string[],
): string | null {
  if (!(file instanceof File) || file.size === 0) {
    return `${label} wajib diunggah.`;
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return `${label} maksimal 5 MB.`;
  }
  if (!allowedTypes.includes(file.type)) {
    return `${label} harus berformat ${allowedTypes
      .map((type) => type.split("/")[1].toUpperCase())
      .join(", ")
      .replace("JPEG", "JPG")}.`;
  }
  return null;
}

/**
 * URL bertanda tangan untuk aset privat (KTP/selfie) — hanya dibuat di server
 * untuk super admin. Mengembalikan null bila Cloudinary belum dikonfigurasi.
 */
export function signedPrivateUrl(publicId: string | undefined | null) {
  if (!publicId) return null;
  try {
    return getCloudinary().url(publicId, { type: "authenticated", sign_url: true, secure: true });
  } catch {
    return null;
  }
}
