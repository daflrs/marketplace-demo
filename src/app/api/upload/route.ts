import { NextResponse, type NextRequest } from "next/server";
import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES, type AcceptedImageType } from "@/lib/constants";
import { createAdminClient, LISTING_IMAGES_BUCKET } from "@/lib/supabase";
import { jsonError, NO_STORE, serverError } from "@/lib/api-response";

const EXTENSIONS: Record<AcceptedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Checks the file's first bytes, so a renamed non-image can't sneak through. */
function matchesSignature(bytes: Uint8Array, type: AcceptedImageType): boolean {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (type === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  if (type === "image/png") return starts(0x89, 0x50, 0x4e, 0x47);
  // WebP: "RIFF" .... "WEBP"
  return starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

const isAccepted = (type: string): type is AcceptedImageType =>
  (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);

/** POST /api/upload (multipart/form-data with a "file" field). Returns 201 { url }. */
export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Send the photo as form data with a \"file\" field.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) return jsonError(400, "No photo was attached.");
  if (!isAccepted(file.type)) return jsonError(415, "Use a JPG, PNG or WebP photo.");
  if (file.size === 0) return jsonError(400, "That photo is empty.");
  if (file.size > MAX_UPLOAD_BYTES) return jsonError(413, "That photo is too large. The limit is 4MB.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(bytes, file.type)) return jsonError(415, "That file doesn't look like a real image.");

  try {
    const supabase = createAdminClient();
    const path = `listings/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;

    const { error } = await supabase.storage.from(LISTING_IMAGES_BUCKET).upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl }, { status: 201, headers: NO_STORE });
  } catch (err) {
    return serverError(err, "POST /api/upload");
  }
}
