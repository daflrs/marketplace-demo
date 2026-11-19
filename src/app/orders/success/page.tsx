import { Suspense } from "react";
import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/marketplace/order-confirmation";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Order confirmed" };

/** Stripe Checkout redirects here with ?session_id={CHECKOUT_SESSION_ID}. */
export default function OrderSuccessPage() {
  return (
    <div className="px-4 py-10">
      <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-lg rounded-2xl" />}>
        <OrderConfirmation />
      </Suspense>
    </div>
  );
}
