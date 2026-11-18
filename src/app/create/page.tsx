import type { Metadata } from "next";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { ListingTypeCards } from "@/components/marketplace/listing-type-cards";

export const metadata: Metadata = { title: "Create new listing" };

export default function CreatePage() {
  return (
    <MarketplaceShell>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Choose listing type</h1>
      <p className="mb-5 text-gray-600">What would you like to sell?</p>
      <ListingTypeCards />
    </MarketplaceShell>
  );
}
