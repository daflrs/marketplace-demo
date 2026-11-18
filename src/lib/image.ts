// Browser-side photo preparation: validate, then shrink large photos before upload.
// Keeps uploads under Vercel's request limit and makes listings load fast.
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_DIMENSION,
  MAX_ORIGINAL_IMAGE_BYTES,
  MAX_UPLOAD_BYTES,
} from "./constants";

const isAccepted = (type: string) => (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareImage(file: File): Promise<File> {
  if (!isAccepted(file.type)) throw new Error("Use a JPG, PNG or WebP photo.");
  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) throw new Error("That photo is too large. Try one under 25MB.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    if (file.size <= MAX_UPLOAD_BYTES) return file; // can't resize here, but it's small enough
    throw new Error("We couldn't read that photo. Try a different one.");
  }

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    if (file.size <= MAX_UPLOAD_BYTES) return file;
    throw new Error("We couldn't process that photo. Try a smaller one.");
  }

  ctx.fillStyle = "#ffffff"; // so transparent PNGs don't turn black as JPEG
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // WebP is smallest; some browsers (older Safari) can't encode it, so fall back to JPEG.
  let blob = await toBlob(canvas, "image/webp", 0.85);
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.85);

  if (!blob) {
    if (file.size <= MAX_UPLOAD_BYTES) return file;
    throw new Error("We couldn't process that photo. Try a smaller one.");
  }

  // Keep the original if shrinking didn't help.
  if (blob.size >= file.size && file.size <= MAX_UPLOAD_BYTES) return file;
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("That photo is still too large after resizing.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.${ext}`, { type: blob.type });
}
