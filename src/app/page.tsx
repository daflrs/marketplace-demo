import { Suspense } from "react";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { ItemGrid } from "@/components/marketplace/item-grid";
import { BrowseSkeleton } from "@/components/marketplace/grid-skeleton";

export default function HomePage() {
  return (
    <MarketplaceShell>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Today&apos;s picks</h1>
      {/* ItemGrid reads the URL (?q=, ?view=), so it renders behind a Suspense skeleton. */}
      <Suspense fallback={<BrowseSkeleton />}>
        <ItemGrid />
      </Suspense>
    </MarketplaceShell>
  );
}
