import { NextResponse, type NextRequest } from "next/server";
import { getListingById } from "@/lib/listings";
import { isUuid } from "@/lib/validation";
import { jsonError, serverError } from "@/lib/api-response";

/** GET /api/listings/[id]: one listing (public fields only). */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // Next.js 15+: params is a Promise

  if (!isUuid(id)) return jsonError(400, "That isn't a valid listing ID.");

  try {
    const listing = await getListingById(id);
    if (!listing) return jsonError(404, "This listing doesn't exist or was removed.");

    // Listings can't be edited, so it's safe to let the CDN cache them briefly.
    return NextResponse.json(
      { listing },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (err) {
    return serverError(err, `GET /api/listings/${id}`);
  }
}
