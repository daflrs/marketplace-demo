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
  /** "pending" = someone is in Stripe Checkout (30-minute hold). Expired holds read as "available". */
  status: ListingStatus;
  /** The seller finished Stripe onboarding, so the listing can be bought online. */
  buy_now_enabled: boolean;
  sold_at: string | null;
};

export type ListingStatus = "available" | "pending" | "sold";

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

export type SellerAccountStatus = {
  email: string;
  connected: boolean;
  stripeAccountId: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  buyNowListings: number;
};

export type Sale = {
  id: string;
  listing_id: string | null;
  listing_title: string;
  buyer_email: string | null;
  amount_total: number; // cents
  application_fee_amount: number; // cents
  currency: string;
  created_at: string;
};

export type OrderSummary = {
  state: "confirmed" | "processing" | "unpaid";
  orderId: string | null;
  amountTotal: number; // cents
  platformFee: number; // cents
  currency: string;
  buyerEmail: string | null;
  listing: { id: string; title: string; image_url: string | null; seller_name: string } | null;
};
