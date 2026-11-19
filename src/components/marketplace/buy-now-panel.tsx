"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, Clock, Loader2, Lock, MessageCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { errorMessage, requestJson } from "@/lib/http";
import type { Listing } from "@/lib/types";

type Props = Pick<Listing, "id" | "price" | "status" | "buy_now_enabled" | "seller_name">;

const sessionKey = (listingId: string) => `checkout:${listingId}`;

function readSession(listingId: string): string {
  try {
    return sessionStorage.getItem(sessionKey(listingId)) ?? "";
  } catch {
    return "";
  }
}

const noopSubscribe = () => () => {};

/** Buy Now button + Sold / Pending / not-set-up states for the listing page. */
export function BuyNowPanel({ id, price, status, buy_now_enabled, seller_name }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const cancelHandled = useRef(false);

  // Did this browser start the checkout that's holding the item?
  const mySession = useSyncExternalStore(noopSubscribe, () => readSession(id), () => "");

  // Back from Stripe via "cancel": release the hold so others can buy it straight away.
  useEffect(() => {
    if (searchParams.get("checkout") !== "cancelled" || cancelHandled.current) return;
    cancelHandled.current = true;

    const sessionId = readSession(id);
    const done = () => {
      toast.info("Checkout cancelled. The item is available again.");
      router.replace(pathname, { scroll: false });
      router.refresh();
    };
    if (!sessionId) return done();

    requestJson("/api/checkout/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id, sessionId }),
    })
      .catch((err: unknown) => console.warn("Couldn't release checkout hold:", err))
      .finally(() => {
        try {
          sessionStorage.removeItem(sessionKey(id));
        } catch {
          // ignore
        }
        done();
      });
  }, [searchParams, id, pathname, router]);

  async function buy() {
    setLoading(true);
    try {
      const { url, sessionId } = await requestJson<{ url: string; sessionId: string }>("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id, resumeSessionId: readSession(id) || undefined }),
      });
      try {
        sessionStorage.setItem(sessionKey(id), sessionId);
      } catch {
        // ignore: the purchase still works, we just can't resume it
      }
      window.location.assign(url); // off to Stripe Checkout
    } catch (err) {
      toast.error("Couldn't start checkout", { description: errorMessage(err) });
      setLoading(false);
      router.refresh(); // the item may have just been reserved or sold
    }
  }

  if (status === "sold") {
    return (
      <div className="animate-pop-in flex items-start gap-3 rounded-xl bg-gray-100 p-4" role="status">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-gray-600" aria-hidden="true" />
        <div>
          <p className="font-semibold text-gray-900">This item has been sold</p>
          <p className="text-sm text-gray-600">Browse similar listings in Marketplace.</p>
        </div>
      </div>
    );
  }

  if (status === "pending" && !mySession) {
    return (
      <div className="animate-pop-in flex items-start gap-3 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200" role="status">
        <Clock className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div>
          <p className="font-semibold text-amber-900">Someone is checking out</p>
          <p className="text-sm text-amber-800">
            If they don&apos;t finish within 30 minutes, it&apos;ll be available again.
          </p>
        </div>
      </div>
    );
  }

  if (!buy_now_enabled || price < 0.5) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-primary/5 p-4 ring-1 ring-primary/15">
        <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm text-gray-700">
          {price < 0.5
            ? "Free items can't be bought online. Message the seller to arrange pickup."
            : `${seller_name} hasn't set up online payments yet. Send them a message to arrange the sale.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={buy}
        disabled={loading}
        size="lg"
        className="h-12 w-full gap-2 text-base font-semibold shadow-sm transition active:scale-[0.98]"
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingBag className="size-5" aria-hidden="true" />
        )}
        {loading ? "Opening secure checkout…" : status === "pending" ? "Continue checkout" : `Buy now · ${formatPrice(price)}`}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
        <Lock className="size-3.5" aria-hidden="true" />
        Secure checkout by Stripe · test mode, no real money
      </p>
    </div>
  );
}
