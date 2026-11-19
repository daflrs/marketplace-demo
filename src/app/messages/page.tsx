import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Wallet } from "lucide-react";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { SellerInbox } from "@/components/marketplace/seller-inbox";

export const metadata: Metadata = { title: "Your listings & messages" };

export default function MessagesPage() {
  return (
    <MarketplaceShell>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Your listings &amp; messages</h1>
      <p className="mb-5 text-gray-600">See what buyers have sent you about your listings.</p>
      <Link
        href="/sell/payouts"
        className="animate-pop-in group mb-6 flex items-center gap-4 rounded-xl bg-gradient-to-r from-primary to-[#4f8ff7] p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Wallet className="size-6" aria-hidden="true" />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Get paid with Stripe</span>
          <span className="block text-sm text-white/85">
            Connect Stripe so buyers can pay for your items with Buy now.
          </span>
        </span>
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
      <SellerInbox />
    </MarketplaceShell>
  );
}
