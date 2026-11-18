import { NextResponse, type NextRequest } from "next/server";
import { getListingContact } from "@/lib/listings";
import { notifySeller } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase";
import { hasErrors, isUuid, isValidEmail, normalizeEmail, validateMessage } from "@/lib/validation";
import { jsonError, NO_STORE, readJsonObject, serverError } from "@/lib/api-response";
import type { InboxMessage } from "@/lib/types";

/**
 * GET /api/messages?sellerEmail=you@example.com[&listingId=...]
 * Messages sent to a seller, newest first.
 * There are no accounts in this demo, so the seller's email acts as a lightweight check.
 * In production this would require login.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sellerEmail = normalizeEmail(params.get("sellerEmail"));
  const listingId = params.get("listingId");

  if (!isValidEmail(sellerEmail)) return jsonError(400, "Enter the email you used for your listings.");
  if (listingId && !isUuid(listingId)) return jsonError(400, "That isn't a valid listing ID.");

  try {
    let query = createAdminClient()
      .from("messages")
      .select("id, message, buyer_email, email_status, created_at, listing:listings(id, title, image_url, price)")
      .eq("seller_email", sellerEmail)
      .order("created_at", { ascending: false })
      .limit(100);

    if (listingId) query = query.eq("listing_id", listingId);

    const { data, error } = await query;
    if (error) throw error;

    const messages = ((data ?? []) as unknown as InboxMessage[]).map((m) => ({
      ...m,
      listing: m.listing ? { ...m.listing, price: Number(m.listing.price) } : null,
    }));
    return NextResponse.json({ messages }, { headers: NO_STORE });
  } catch (err) {
    return serverError(err, "GET /api/messages");
  }
}

/**
 * POST /api/messages: send a message to a listing's seller.
 * The message is always saved first; the email (Resend) is an optional extra.
 */
export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  if (!body) return jsonError(400, "Send the message as a JSON object.");

  // Honeypot: real people never fill the hidden "website" field. Pretend it worked.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ message: { id: null, emailStatus: "skipped" } }, { status: 201, headers: NO_STORE });
  }

  const { data, errors } = validateMessage(body);
  if (hasErrors(errors)) return jsonError(400, "Please fix the highlighted fields.", errors);

  try {
    const listing = await getListingContact(data.listingId);
    if (!listing) return jsonError(404, "This listing doesn't exist or was removed.");

    const supabase = createAdminClient();
    const { data: saved, error } = await supabase
      .from("messages")
      .insert({
        listing_id: listing.id,
        buyer_email: data.buyerEmail,
        seller_email: listing.seller_email,
        message: data.message,
      })
      .select("id")
      .single();
    if (error) throw error;

    const emailStatus = await notifySeller({
      sellerEmail: listing.seller_email,
      sellerName: listing.seller_name,
      listingTitle: listing.title,
      listingUrl: `${request.nextUrl.origin}/item/${listing.id}`,
      buyerEmail: data.buyerEmail,
      message: data.message,
    });

    // Record what happened with the email. A failure here shouldn't fail the request.
    const { error: statusError } = await supabase
      .from("messages")
      .update({ email_status: emailStatus })
      .eq("id", saved.id);
    if (statusError) console.error("[api] Couldn't update email_status:", statusError);

    return NextResponse.json({ message: { id: saved.id, emailStatus } }, { status: 201, headers: NO_STORE });
  } catch (err) {
    return serverError(err, "POST /api/messages");
  }
}
