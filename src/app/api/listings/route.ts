import { NextResponse, type NextRequest } from "next/server";
import { isCategorySlug } from "@/lib/categories";
import { getListings, toListing } from "@/lib/listings";
import { createAdminClient, listingImagePrefix, PUBLIC_LISTING_COLUMNS } from "@/lib/supabase";
import { hasErrors, isValidEmail, normalizeEmail, validateListing } from "@/lib/validation";
import { jsonError, NO_STORE, readJsonObject, serverError } from "@/lib/api-response";

/**
 * GET /api/listings?q=bike&category=electronics
 * Browse and search listings (newest first).
 * Also used by the Messages page: ?sellerEmail=you@example.com returns that seller's listings.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const category = params.get("category");
  const rawSellerEmail = params.get("sellerEmail");

  if (category && !isCategorySlug(category)) return jsonError(400, "Unknown category.");

  const sellerEmail = rawSellerEmail ? normalizeEmail(rawSellerEmail) : undefined;
  if (sellerEmail !== undefined && !isValidEmail(sellerEmail)) {
    return jsonError(400, "Enter a valid email address.");
  }

  try {
    const listings = await getListings({ q, category: category ?? undefined, sellerEmail });
    return NextResponse.json({ listings }, { headers: NO_STORE });
  } catch (err) {
    return serverError(err, "GET /api/listings");
  }
}

/** POST /api/listings: create a listing. Returns 201 with the public listing. */
export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  if (!body) return jsonError(400, "Send the listing as a JSON object.");

  const { data, errors } = validateListing(body);

  try {
    // Only accept photos that were uploaded to our own bucket via /api/upload.
    if (data.imageUrl && !data.imageUrl.startsWith(listingImagePrefix())) {
      errors.imageUrl = "Upload the photo again and retry.";
    }
    if (hasErrors(errors)) return jsonError(400, "Please fix the highlighted fields.", errors);

    const { data: row, error } = await createAdminClient()
      .from("listings")
      .insert({
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        location: data.location,
        seller_name: data.sellerName,
        seller_email: data.sellerEmail,
        image_url: data.imageUrl,
      })
      .select(PUBLIC_LISTING_COLUMNS)
      .single();

    if (error) throw error;
    return NextResponse.json(
      { listing: toListing(row as unknown as Parameters<typeof toListing>[0]) },
      { status: 201, headers: NO_STORE }
    );
  } catch (err) {
    return serverError(err, "POST /api/listings");
  }
}
