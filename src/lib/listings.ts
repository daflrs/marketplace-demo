// Server-side data access for listings, shared by the API routes and Server Components.
import { isCategorySlug } from "./categories";
import { createAdminClient, createPublicClient, PUBLIC_LISTING_COLUMNS } from "./supabase";
import type { Listing } from "./types";
import { isUuid } from "./validation";

type ListingRow = Omit<Listing, "price" | "description"> & {
  price: number | string;
  description: string | null;
};

export function toListing(row: ListingRow): Listing {
  return {
    ...row,
    description: row.description ?? "",
    price: Number(row.price),
    category: isCategorySlug(row.category) ? row.category : "classifieds",
  };
}

/** Strip characters that have special meaning in PostgREST filters or LIKE patterns. */
function cleanSearch(q: string | undefined): string {
  return (q ?? "")
    .slice(0, 80)
    .replace(/[%_\\,()*"'.:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type ListingQuery = {
  q?: string;
  category?: string;
  /** Only used by the seller's Messages page. Requires the admin client. */
  sellerEmail?: string;
  limit?: number;
};

export async function getListings({ q, category, sellerEmail, limit = 60 }: ListingQuery = {}): Promise<Listing[]> {
  const client = sellerEmail ? createAdminClient() : createPublicClient();

  let query = client
    .from("listings")
    .select(PUBLIC_LISTING_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);
  if (sellerEmail) query = query.eq("seller_email", sellerEmail);

  const term = cleanSearch(q);
  if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as ListingRow[]).map(toListing);
}

export async function getListingById(id: string): Promise<Listing | null> {
  if (!isUuid(id)) return null;

  const { data, error } = await createPublicClient()
    .from("listings")
    .select(PUBLIC_LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toListing(data as unknown as ListingRow) : null;
}

/** Seller contact details. Server-only: never send seller_email to the browser. */
export async function getListingContact(id: string) {
  const { data, error } = await createAdminClient()
    .from("listings")
    .select("id, title, seller_name, seller_email")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as { id: string; title: string; seller_name: string; seller_email: string } | null;
}
