import type { CategorySlug } from "./categories";

/** A listing as the public sees it. The seller's email is never included. */
export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: CategorySlug;
  location: string;
  seller_name: string;
  image_url: string | null;
  created_at: string;
};

export type EmailStatus = "pending" | "sent" | "skipped" | "failed";

export type InboxMessage = {
  id: string;
  message: string;
  buyer_email: string;
  email_status: EmailStatus;
  created_at: string;
  listing: Pick<Listing, "id" | "title" | "image_url" | "price"> | null;
};

export type FieldErrors = Record<string, string>;
