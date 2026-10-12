/**
 * lib/cloudinary.ts
 * Cloudinary v2 SDK configuration and upload helper.
 *
 * Required env vars (add to .env.local):
 *   CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   CLOUDINARY_API_KEY=your_api_key
 *   CLOUDINARY_API_SECRET=your_api_secret
 */
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  cloudinaryId: string;
  url: string;
}

/**
 * Upload a Buffer (from a FormData File) to Cloudinary.
 * Returns the public_id and the secure HTTPS URL.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  folder: string = "saaf/reports"
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}-${fileName.replace(/\.[^.]+$/, "").replace(/\s+/g, "-")}`,
        resource_type: "image",
        overwrite: false,
        transformation: [
          { quality: "auto:good", fetch_format: "auto" },
          { width: 1600, crop: "limit" }, // cap at 1600px wide
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve({ cloudinaryId: result.public_id, url: result.secure_url });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary (e.g. when a report is deleted).
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
