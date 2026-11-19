"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2, PackageX, ShieldCheck } from "lucide-react";
import { ListingImage } from "./listing-image";
import { ApiError, errorMessage, requestJson } from "@/lib/http";
import type { OrderSummary } from "@/lib/types";

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const POLL_MS = 2000;
const MAX_POLLS = 30; // ~1 minute

type View =
  | { kind: "loading" }
  | { kind: "order"; order: OrderSummary; polls: number }
  | { kind: "error"; message: string; notFound: boolean };

/**
 * Success page body. The order is only "confirmed" once our Stripe webhook has recorded it
 * and marked the listing Sold, so we poll until that happens.
 */
export function OrderConfirmation() {
  const sessionId = useSearchParams().get("session_id") ?? "";
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;

    const check = () => {
      requestJson<{ order: OrderSummary }>(`/api/orders/${encodeURIComponent(sessionId)}`)
        .then(({ order }) => {
          if (cancelled) return;
          polls += 1;
          setView({ kind: "order", order, polls });
          if (order.state === "processing" && polls < MAX_POLLS) timer = setTimeout(check, POLL_MS);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setView({
            kind: "error",
            message: errorMessage(err),
            notFound: err instanceof ApiError && (err.status === 404 || err.status === 400),
          });
        });
    };
    check();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  if (!sessionId || (view.kind === "error" && view.notFound)) {
    return (
      <Panel icon={<PackageX className="size-9 text-gray-500" />} title="We couldn't find that order">
        <p>If you just paid, check the link from Stripe, or browse Marketplace.</p>
      </Panel>
    );
  }

  if (view.kind === "error") {
    return (
      <Panel icon={<PackageX className="size-9 text-amber-600" />} title="Couldn't load your order">
        <p>{view.message}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-2 font-medium text-primary hover:underline">
          Try again
        </button>
      </Panel>
    );
  }

  if (view.kind === "loading") {
    return (
      <Panel icon={<Loader2 className="size-9 animate-spin text-primary" />} title="Loading your order…">
        <p>Just a moment.</p>
      </Panel>
    );
  }

  const { order, polls } = view;

  if (order.state === "unpaid") {
    return (
      <Panel icon={<Clock className="size-9 text-amber-600" />} title="Payment not completed">
        <p>This checkout wasn&apos;t paid. You haven&apos;t been charged.</p>
      </Panel>
    );
  }

  const confirmed = order.state === "confirmed";
  const gaveUp = !confirmed && polls >= MAX_POLLS;

  return (
    <div className="animate-pop-in mx-auto max-w-lg overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/70">
      <div className="flex flex-col items-center px-6 pb-5 pt-8 text-center">
        <CheckCircle2 className="animate-check-pop size-14 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-3 text-2xl font-bold text-gray-900">Payment successful!</h1>
        <p className="mt-1 text-gray-600">
          Thanks for your purchase{order.listing ? ` from ${order.listing.seller_name}` : ""}.
        </p>
      </div>

      {order.listing && (
        <Link
          href={`/item/${order.listing.id}`}
          className="group mx-5 flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition hover:bg-gray-100"
        >
          <ListingImage src={order.listing.image_url} alt="" sizes="64px" className="size-16 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{order.listing.title}</p>
            <p className="text-sm text-gray-600">Paid {usd(order.amountTotal)}</p>
          </div>
        </Link>
      )}

      <dl className="mx-5 mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Total paid</dt>
          <dd className="font-semibold tabular-nums text-gray-900">{usd(order.amountTotal)}</dd>
        </div>
        {order.buyerEmail && (
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Receipt email</dt>
            <dd className="truncate text-gray-900">{order.buyerEmail}</dd>
          </div>
        )}
        {order.orderId && (
          <div className="flex justify-between">
            <dt className="text-gray-500">Order</dt>
            <dd className="font-mono text-gray-900">#{order.orderId.slice(0, 8).toUpperCase()}</dd>
          </div>
        )}
      </dl>

      <div
        role="status"
        className={
          confirmed
            ? "mx-5 mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            : "mx-5 mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
        }
      >
        {confirmed ? (
          <>
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            Order confirmed by Stripe and saved. The listing is now marked Sold.
          </>
        ) : gaveUp ? (
          <>
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            Your payment went through. Confirmation is taking longer than usual, so check back in a minute.
          </>
        ) : (
          <>
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
            Confirming your order with Stripe…
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 p-5 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98]"
        >
          Continue shopping
        </Link>
        {order.listing && (
          <Link
            href={`/item/${order.listing.id}`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg px-4 text-sm font-semibold text-primary ring-1 ring-primary/30 transition hover:bg-primary/5"
          >
            View listing
          </Link>
        )}
      </div>
    </div>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="animate-pop-in mx-auto flex max-w-md flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-gray-200/70">
      {icon}
      <h1 className="mt-3 text-xl font-bold text-gray-900">{title}</h1>
      <div className="mt-1 text-sm text-gray-600">{children}</div>
      <Link href="/" className="mt-5 text-sm font-semibold text-primary hover:underline">
        Browse Marketplace
      </Link>
    </div>
  );
}
