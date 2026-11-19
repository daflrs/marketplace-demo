import { NextResponse, type NextRequest } from "next/server";
import { getOrderSummary } from "@/lib/payments";
import { jsonError, NO_STORE, serverError } from "@/lib/api-response";

/**
 * GET /api/orders/[sessionId]
 * The success page polls this until the webhook has recorded the order ("confirmed").
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) return jsonError(400, "That isn't a valid checkout ID.");

  try {
    const order = await getOrderSummary(sessionId);
    if (!order) return jsonError(404, "We couldn't find that order.");
    return NextResponse.json({ order }, { headers: NO_STORE });
  } catch (err) {
    return serverError(err, `GET /api/orders/${sessionId}`);
  }
}
