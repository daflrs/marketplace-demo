// Shared validation: the forms use it for instant feedback,
// and the API routes run the exact same rules before touching the database.
import { isCategorySlug, type CategorySlug } from "./categories";
import { LIMITS } from "./constants";
import type { FieldErrors } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function normalizeEmail(value: unknown): string {
  return text(value).toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return value.length <= LIMITS.email && EMAIL_RE.test(value);
}

/** Accepts 120, "120", "1,200.50" or "$99". Returns null if it isn't a number. */
export function parsePrice(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
  const cleaned = text(value).replace(/[$₱,\s]/g, "");
  if (!cleaned || !/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100) / 100;
}

// ---------- Listings ----------

export type ListingInput = {
  title: string;
  description: string;
  price: number;
  category: CategorySlug;
  location: string;
  sellerName: string;
  sellerEmail: string;
  imageUrl: string | null;
};

export function validateListing(raw: Record<string, unknown>) {
  const errors: FieldErrors = {};

  const title = text(raw.title);
  if (!title) errors.title = "Add a title.";
  else if (title.length > LIMITS.title) errors.title = `Keep the title under ${LIMITS.title} characters.`;

  const description = text(raw.description);
  if (description.length > LIMITS.description) {
    errors.description = `Keep the description under ${LIMITS.description} characters.`;
  }

  const price = parsePrice(raw.price);
  if (price === null) errors.price = "Enter a price, like 120 or 99.50. Use 0 for free items.";
  else if (price < 0 || price > LIMITS.maxPrice) errors.price = "That price is out of range.";

  const category = raw.category;
  if (!isCategorySlug(category)) errors.category = "Choose a category.";

  const location = text(raw.location);
  if (!location) errors.location = "Add a location, like Angeles City.";
  else if (location.length > LIMITS.location) errors.location = "That location is too long.";

  const sellerName = text(raw.sellerName);
  if (!sellerName) errors.sellerName = "Add your name.";
  else if (sellerName.length > LIMITS.sellerName) errors.sellerName = "That name is too long.";

  const sellerEmail = normalizeEmail(raw.sellerEmail);
  if (!sellerEmail) errors.sellerEmail = "Add your email so buyers can reach you.";
  else if (!isValidEmail(sellerEmail)) errors.sellerEmail = "Enter a valid email, like you@example.com.";

  const imageUrl = typeof raw.imageUrl === "string" && raw.imageUrl ? raw.imageUrl : null;

  const data: ListingInput = {
    title,
    description,
    price: price ?? 0,
    category: (isCategorySlug(category) ? category : "classifieds") as CategorySlug,
    location,
    sellerName,
    sellerEmail,
    imageUrl,
  };

  return { data, errors };
}

// ---------- Messages ----------

export type MessageInput = { listingId: string; buyerEmail: string; message: string };

export function validateMessage(raw: Record<string, unknown>) {
  const errors: FieldErrors = {};

  const listingId = text(raw.listingId);
  if (!isUuid(listingId)) errors.listingId = "That listing doesn't exist.";

  const buyerEmail = normalizeEmail(raw.buyerEmail);
  if (!buyerEmail) errors.buyerEmail = "Add your email so the seller can reply.";
  else if (!isValidEmail(buyerEmail)) errors.buyerEmail = "Enter a valid email, like you@example.com.";

  const message = text(raw.message);
  if (!message) errors.message = "Write a message.";
  else if (message.length > LIMITS.message) {
    errors.message = `Keep your message under ${LIMITS.message} characters.`;
  }

  return { data: { listingId, buyerEmail, message } satisfies MessageInput, errors };
}

export const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;
