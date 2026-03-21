import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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

    if (files.length > 5) {
      return NextResponse.json(
        { error: { code: "TOO_MANY", message: "Maximum 5 photos allowed" } },
        { status: 400 }
      );
    }

    const urls: { url: string; order: number; alt: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: { code: "INVALID_TYPE", message: `File "${file.name}" is not an image` } },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: { code: "TOO_LARGE", message: `File "${file.name}" exceeds 5MB limit` } },
          { status: 400 }
        );
      }

      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${randomUUID()}.${ext}`;
      const filepath = path.join(process.cwd(), "public", "uploads", filename);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      urls.push({
        url: `/uploads/${filename}`,
        order: i,
        alt: file.name.replace(/\.[^.]+$/, ""),
      });
    }

    return NextResponse.json({ data: urls, error: null });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: { code: "UPLOAD_ERROR", message: "Failed to upload files" } },
      { status: 500 }
    );
  }
}
