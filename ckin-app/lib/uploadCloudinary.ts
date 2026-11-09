import cloudinary from "./cloudinary";

type UploadResult = {
  publicId: string;
  secureUrl: string;
};

export async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<UploadResult> {

  // Konversi file menjadi Buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        type: "upload",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Upload gagal."));
          return;
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
        });
      }
    );

    stream.end(buffer);
  });
}