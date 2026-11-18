"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Inbox, Loader2, Mail, Reply, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "./empty-state";
import { ListingImage } from "./listing-image";
import { TimeAgo } from "./time-ago";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { LIMITS, STORAGE_KEYS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { errorMessage, requestJson } from "@/lib/http";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import type { EmailStatus, InboxMessage, Listing } from "@/lib/types";

const STATUS_LABEL: Record<EmailStatus, { text: string; className: string }> = {
  sent: { text: "Emailed", className: "bg-emerald-50 text-emerald-700" },
  skipped: { text: "Not emailed", className: "bg-gray-100 text-gray-600" },
  failed: { text: "Email failed", className: "bg-amber-50 text-amber-700" },
  pending: { text: "Sending…", className: "bg-gray-100 text-gray-600" },
};

type Inbox = { email: string; listings: Listing[]; messages: InboxMessage[] };

/** "Your listings & messages": a seller enters the email they listed with. */
export function SellerInbox() {
  const [savedEmail, setSavedEmail] = useLocalStorage(STORAGE_KEYS.sellerEmail);
  const [email, setEmail] = useState<string | null>(null); // null = use the saved email
  const value = email ?? savedEmail;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inbox, setInbox] = useState<Inbox | null>(null);

  async function load(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizeEmail(value);
    if (!isValidEmail(normalized)) {
      setError("Enter the email you used when creating your listings.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const qs = `sellerEmail=${encodeURIComponent(normalized)}`;
      const [{ listings }, { messages }] = await Promise.all([
        requestJson<{ listings: Listing[] }>(`/api/listings?${qs}`),
        requestJson<{ messages: InboxMessage[] }>(`/api/messages?${qs}`),
      ]);
      setInbox({ email: normalized, listings, messages });
      setSavedEmail(normalized);
    } catch (err) {
      setInbox(null);
      toast.error("Couldn't load your messages", { description: errorMessage(err) });
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={load} noValidate className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70 sm:p-5">
        <Label htmlFor="inboxEmail" className="text-base font-semibold text-gray-900">
          Your seller email
        </Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            id="inboxEmail"
            type="email"
            value={value}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="you@example.com"
            autoComplete="email"
            maxLength={LIMITS.email}
            aria-invalid={!!error}
            aria-describedby="inboxEmail-hint"
            className="h-11 flex-1 bg-white text-base md:text-base"
          />
          <Button type="submit" disabled={loading} className="h-11 px-5 font-semibold">
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Inbox className="size-4" aria-hidden="true" />}
            {loading ? "Loading…" : "Show my messages"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p id="inboxEmail-hint" className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
          <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          This demo has no accounts, so your listing email is used to find your messages. A real app would ask
          you to log in.
        </p>
      </form>

      {inbox && (
        <>
          <section aria-labelledby="your-listings">
            <h2 id="your-listings" className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Tag className="size-5 text-primary" aria-hidden="true" />
              Your listings <span className="font-normal text-gray-500">({inbox.listings.length})</span>
            </h2>
            {inbox.listings.length === 0 ? (
              <p className="rounded-xl bg-white p-4 text-sm text-gray-600 ring-1 ring-gray-200/70">
                No listings use {inbox.email} yet.{" "}
                <Link href="/create" className="font-medium text-primary hover:underline">
                  Create one
                </Link>
              </p>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4 scrollbar-none">
                <div className="flex w-max gap-3 pb-1">
                  {inbox.listings.map((l, i) => (
                    <Link
                      key={l.id}
                      href={`/item/${l.id}`}
                      style={{ animationDelay: `${i * 40}ms` }}
                      className="animate-pop-in group w-40 rounded-xl bg-white p-2 shadow-sm ring-1 ring-gray-200/70 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <ListingImage src={l.image_url} alt={l.title} sizes="160px" className="aspect-square w-full rounded-lg" />
                      <p className="mt-1.5 text-sm font-bold text-gray-900">{formatPrice(l.price)}</p>
                      <p className="truncate text-sm text-gray-700">{l.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="your-messages">
            <h2 id="your-messages" className="mb-3 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Mail className="size-5 text-primary" aria-hidden="true" />
              Messages <span className="font-normal text-gray-500">({inbox.messages.length})</span>
            </h2>
            {inbox.messages.length === 0 ? (
              <EmptyState icon={Inbox} title="No messages yet">
                When buyers message you about a listing, they&apos;ll show up here.
              </EmptyState>
            ) : (
              <ul className="space-y-3">
                {inbox.messages.map((m, i) => {
                  const status = STATUS_LABEL[m.email_status] ?? STATUS_LABEL.pending;
                  const subject = encodeURIComponent(`Re: ${m.listing?.title ?? "your message"}`);
                  return (
                    <li
                      key={m.id}
                      style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                      className="animate-pop-in rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70"
                    >
                      <div className="flex gap-3">
                        {m.listing && (
                          <Link href={`/item/${m.listing.id}`} className="group shrink-0" aria-label={m.listing.title}>
                            <ListingImage src={m.listing.image_url} alt="" sizes="56px" className="size-14 rounded-lg" />
                          </Link>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-semibold text-gray-900">{m.buyer_email}</span>
                            <span className="text-xs text-gray-500">
                              <TimeAgo iso={m.created_at} />
                            </span>
                            <Badge variant="secondary" className={status.className}>
                              {status.text}
                            </Badge>
                          </div>
                          {m.listing && (
                            <Link href={`/item/${m.listing.id}`} className="text-sm text-primary hover:underline">
                              {m.listing.title}
                            </Link>
                          )}
                          <p className="mt-2 whitespace-pre-line break-words rounded-lg bg-gray-50 px-3 py-2 text-[15px] text-gray-800">
                            {m.message}
                          </p>
                          <a
                            href={`mailto:${m.buyer_email}?subject=${subject}`}
                            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            <Reply className="size-4" aria-hidden="true" />
                            Reply by email
                          </a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
