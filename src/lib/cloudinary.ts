import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type UploadResult = {
  url: string;
  publicId: string;
  type: "image" | "video";
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
};

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: "image" | "video" | "auto";
    filename?: string;
  } = {}
): Promise<UploadResult> {
  const { folder = "nayaghar/listings", resourceType = "auto", filename } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: filename,
        transformation: resourceType === "image"
          ? [{ width: 1200, height: 800, crop: "limit", quality: "auto:good", format: "webp" }]
          : undefined,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }

        const isVideo = result.resource_type === "video";

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          type: isVideo ? "video" : "image",
          thumbnail: isVideo
            ? result.secure_url.replace(/\.[^.]+$/, ".jpg")
            : undefined,
          duration: isVideo ? result.duration : undefined,
          width: result.width,
          height: result.height,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string, resourceType: "image" | "video" = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };
