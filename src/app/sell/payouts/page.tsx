import { Suspense } from "react";
import type { Metadata } from "next";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { SellerPayouts } from "@/components/marketplace/seller-payouts";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Get paid" };

export default function PayoutsPage() {
  return (
    <MarketplaceShell>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Get paid</h1>
      <p className="mb-5 text-gray-600">Connect Stripe so buyers can pay for your items online.</p>
      {/* Reads ?email= / ?returned= from Stripe's redirect, so it renders behind Suspense. */}
      <Suspense fallback={<Skeleton className="h-36 w-full rounded-xl" />}>
        <SellerPayouts />
      </Suspense>
    </MarketplaceShell>
  );
}
