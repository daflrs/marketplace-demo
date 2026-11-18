// Limits shared by the forms (client) and the API routes (server).
// Keep them in sync with the check constraints in supabase-schema.sql.
export const LIMITS = {
  title: 100,
  description: 2000,
  location: 100,
  sellerName: 60,
  email: 254,
  message: 1000,
  maxPrice: 99_999_999,
} as const;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

/** Largest file the upload API accepts (Vercel caps request bodies at ~4.5MB). */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Largest original photo we'll try to shrink in the browser. */
export const MAX_ORIGINAL_IMAGE_BYTES = 25 * 1024 * 1024;
/** Photos are resized so their longest side is at most this many pixels. */
export const MAX_IMAGE_DIMENSION = 1600;

/** Change to { code: "PHP", locale: "en-PH" } for pesos. */
export const CURRENCY = { code: "USD", locale: "en-US" } as const;

export const STORAGE_KEYS = {
  sellerName: "marketplace:seller-name",
  sellerEmail: "marketplace:seller-email",
  buyerEmail: "marketplace:buyer-email",
} as const;
