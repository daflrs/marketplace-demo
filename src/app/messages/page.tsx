import type { Metadata } from "next";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { SellerInbox } from "@/components/marketplace/seller-inbox";

export const metadata: Metadata = { title: "Your listings & messages" };

export default function MessagesPage() {
  return (
    <MarketplaceShell>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Your listings &amp; messages</h1>
      <p className="mb-5 text-gray-600">See what buyers have sent you about your listings.</p>
      <SellerInbox />
    </MarketplaceShell>
  );
}
