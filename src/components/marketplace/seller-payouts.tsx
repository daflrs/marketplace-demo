"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CircleAlert,
  ExternalLink,
  Info,
  Loader2,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeAgo } from "./time-ago";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { LIMITS, STORAGE_KEYS } from "@/lib/constants";
import { errorMessage, requestJson } from "@/lib/http";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import type { Sale, SellerAccountStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type AccountResponse = { status: SellerAccountStatus; sales: Sale[]; feePercent: number };

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
      )}
    >
      <span className={cn("size-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
      {label}: {ok ? "Active" : "Pending"}
    </span>
  );
}

/** "Get paid": connect Stripe, see account status, and see sales with the platform fee. */
export function SellerPayouts() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlEmail = normalizeEmail(searchParams.get("email"));

  const [savedEmail, setSavedEmail] = useLocalStorage(STORAGE_KEYS.sellerEmail);
  const [draft, setDraft] = useState<string | null>(null);
  const email = draft ?? (urlEmail || savedEmail);

  const [data, setData] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);

  async function load(target: string) {
    const normalized = normalizeEmail(target);
    if (!isValidEmail(normalized)) {
      setError("Enter the email you use on your listings.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await requestJson<AccountResponse>(`/api/stripe/account?email=${encodeURIComponent(normalized)}`);
      setData(result);
      setSavedEmail(normalized);
    } catch (err) {
      setData(null);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function connect(target: string) {
    const normalized = normalizeEmail(target);
    if (!isValidEmail(normalized)) {
      setError("Enter the email you use on your listings.");
      return;
    }
    setConnecting(true);
    try {
      const { url } = await requestJson<{ url: string }>("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      setSavedEmail(normalized);
      window.location.assign(url); // Stripe-hosted onboarding
    } catch (err) {
      toast.error("Couldn't open Stripe onboarding", { description: errorMessage(err) });
      setConnecting(false);
    }
  }

  // Coming back from Stripe: ?returned=1 → show the fresh status; ?refresh=1 → the link expired, make a new one.
  useEffect(() => {
    if (autoRan.current || !urlEmail) return;
    autoRan.current = true;
    if (searchParams.get("refresh")) {
      void connect(urlEmail);
      return;
    }
    if (searchParams.get("returned")) toast.success("Welcome back! Checking your Stripe account…");
    void load(urlEmail).then(() => router.replace(`${pathname}?email=${encodeURIComponent(urlEmail)}`, { scroll: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on arrival
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    void load(email);
  }

  const status = data?.status;
  const ready = Boolean(status?.chargesEnabled);
  const sales = data?.sales ?? [];
  const totals = sales.reduce(
    (t, s) => ({ gross: t.gross + s.amount_total, fees: t.fees + s.application_fee_amount }),
    { gross: 0, fees: 0 }
  );

  return (
    <div className="space-y-6">
      <form onSubmit={submit} noValidate className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70 sm:p-5">
        <Label htmlFor="payoutEmail" className="text-base font-semibold text-gray-900">
          Your seller email
        </Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="payoutEmail"
            type="email"
            value={email}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={LIMITS.email}
            aria-invalid={!!error}
            className="h-11 flex-1 bg-white text-base md:text-base"
          />
          <Button type="submit" variant="outline" disabled={loading} className="h-11 px-5 font-semibold">
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
            {loading ? "Checking…" : "Check status"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
          <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          Use the same email as your listings. Every listing with this email gets a Buy now button once Stripe is
          connected.
        </p>
      </form>

      {/* Account status */}
      {status && (
        <section aria-labelledby="stripe-status" className="animate-pop-in rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70">
          <div className="flex items-start gap-4">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                ready ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"
              )}
            >
              {ready ? <BadgeCheck className="size-7" aria-hidden="true" /> : <Wallet className="size-6" aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="stripe-status" className="text-lg font-bold text-gray-900">
                {ready ? "Ready to get paid" : status.connected ? "Finish setting up Stripe" : "Connect with Stripe"}
              </h2>
              <p className="mt-0.5 text-sm text-gray-600">
                {ready
                  ? `Buyers can pay for your items online. ${status.buyNowListings} of your listings ${status.buyNowListings === 1 ? "has" : "have"} Buy now.`
                  : status.connected
                    ? "Stripe needs a few more details before buyers can pay you."
                    : `Buyers pay with card through Stripe. You receive the price minus a ${data?.feePercent ?? 10}% platform fee.`}
              </p>

              {status.connected && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Pill ok={status.chargesEnabled} label="Payments" />
                  <Pill ok={status.payoutsEnabled} label="Payouts" />
                  <span className="font-mono text-xs text-gray-500">{status.stripeAccountId}</span>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {!ready && (
                  <Button
                    onClick={() => connect(status.email)}
                    disabled={connecting}
                    className="h-10 bg-[#635bff] px-5 font-semibold text-white hover:bg-[#5249e6]"
                  >
                    {connecting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {connecting ? "Opening Stripe…" : status.connected ? "Finish setup" : "Connect with Stripe"}
                  </Button>
                )}
                {status.connected && (
                  <a
                    href="https://dashboard.stripe.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold text-primary ring-1 ring-primary/30 transition hover:bg-primary/5"
                  >
                    Open Stripe Dashboard
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {!ready && (
            <div className="mt-4 flex gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                This is Stripe&apos;s test mode, so use{" "}
                <a
                  href="https://docs.stripe.com/connect/testing"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  Stripe&apos;s test data
                </a>{" "}
                during onboarding (for example, verification code <span className="font-mono">000000</span>, routing
                number <span className="font-mono">110000000</span>, account number{" "}
                <span className="font-mono">000123456789</span>).
              </p>
            </div>
          )}
        </section>
      )}

      {/* Sales: shows the seller got the price minus the platform fee */}
      {status?.connected && (
        <section aria-labelledby="your-sales">
          <h2 id="your-sales" className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
            <Receipt className="size-5 text-primary" aria-hidden="true" />
            Your sales <span className="font-normal text-gray-500">({sales.length})</span>
          </h2>

          {sales.length === 0 ? (
            <p className="rounded-xl bg-white p-4 text-sm text-gray-600 ring-1 ring-gray-200/70">
              No sales yet. When someone buys with Buy now, it&apos;ll show here with your earnings.
            </p>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Buyers paid", value: usd(totals.gross) },
                  { label: `Platform fee (${data?.feePercent ?? 10}%)`, value: `−${usd(totals.fees)}` },
                  { label: "You earned", value: usd(totals.gross - totals.fees), strong: true },
                ].map((t) => (
                  <div key={t.label} className="rounded-xl bg-white p-3 ring-1 ring-gray-200/70">
                    <p className="text-xs text-gray-500">{t.label}</p>
                    <p className={cn("mt-0.5 font-bold tabular-nums", t.strong ? "text-emerald-700" : "text-gray-900")}>
                      {t.value}
                    </p>
                  </div>
                ))}
              </div>
              <ul className="space-y-2">
                {sales.map((sale, i) => (
                  <li
                    key={sale.id}
                    style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                    className="animate-pop-in rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      {sale.listing_id ? (
                        <Link href={`/item/${sale.listing_id}`} className="font-semibold text-gray-900 hover:text-primary">
                          {sale.listing_title}
                        </Link>
                      ) : (
                        <span className="font-semibold text-gray-900">{sale.listing_title}</span>
                      )}
                      <span className="text-xs text-gray-500">
                        <TimeAgo iso={sale.created_at} />
                      </span>
                    </div>
                    <p className="mt-1 text-sm tabular-nums text-gray-600">
                      Paid {usd(sale.amount_total)} · platform fee {usd(sale.application_fee_amount)} ·{" "}
                      <span className="font-semibold text-emerald-700">
                        you earned {usd(sale.amount_total - sale.application_fee_amount)}
                      </span>
                    </p>
                    {sale.buyer_email && <p className="mt-0.5 text-xs text-gray-500">Buyer: {sale.buyer_email}</p>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                Stripe also deducts its own processing fee from your share. See exact payouts in your Stripe Dashboard.
              </p>
            </>
          )}
        </section>
      )}
    </div>
  );
}
