import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGES = 5;
const MAX_VIDEOS = 2;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: { code: "NO_FILES", message: "No files uploaded" } },
        { status: 400 }
      );
    }

    const images: File[] = [];
    const videos: File[] = [];

    // Separate and validate files
    for (const file of files) {
      if (IMAGE_TYPES.includes(file.type)) {
        if (file.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: { code: "TOO_LARGE", message: `Image "${file.name}" exceeds 5MB limit` } },
            { status: 400 }
          );
        }
        images.push(file);
      } else if (VIDEO_TYPES.includes(file.type)) {
        if (file.size > MAX_VIDEO_SIZE) {
          return NextResponse.json(
            { error: { code: "TOO_LARGE", message: `Video "${file.name}" exceeds 50MB limit` } },
            { status: 400 }
          );
        }
        videos.push(file);
      } else {
        return NextResponse.json(
          { error: { code: "INVALID_TYPE", message: `"${file.name}" is not a supported image or video format` } },
          { status: 400 }
        );
      }
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: { code: "TOO_MANY", message: `Maximum ${MAX_IMAGES} images allowed` } },
        { status: 400 }
      );
    }

    if (videos.length > MAX_VIDEOS) {
      return NextResponse.json(
        { error: { code: "TOO_MANY", message: `Maximum ${MAX_VIDEOS} videos allowed` } },
        { status: 400 }
      );
    }

    // Upload all files to Cloudinary
    const uploadedImages: { url: string; order: number; alt: string }[] = [];
    const uploadedVideos: { url: string; thumbnail?: string; duration?: number }[] = [];

    // Upload images
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadToCloudinary(buffer, { resourceType: "image" });
      uploadedImages.push({
        url: result.url,
        order: i,
        alt: file.name.replace(/\.[^.]+$/, ""),
      });
    }

    // Upload videos
    for (const file of videos) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadToCloudinary(buffer, { resourceType: "video" });
      uploadedVideos.push({
        url: result.url,
        thumbnail: result.thumbnail,
        duration: result.duration,
      });
    }

    return NextResponse.json({
      data: { images: uploadedImages, videos: uploadedVideos },
      error: null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: { code: "UPLOAD_ERROR", message: "Failed to upload files. Check Cloudinary configuration." } },
      { status: 500 }
    );
  }
}
