"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { LIMITS, STORAGE_KEYS } from "@/lib/constants";
import { ApiError, errorMessage, requestJson } from "@/lib/http";
import { hasErrors, validateMessage } from "@/lib/validation";
import type { EmailStatus, FieldErrors } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEFAULT_MESSAGE = "Hi! Is this still available?";

type Props = { listingId: string; sellerName: string };

export function MessageSellerForm({ listingId, sellerName }: Props) {
  const [buyerEmail, setBuyerEmail] = useLocalStorage(STORAGE_KEYS.buyerEmail);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [website, setWebsite] = useState(""); // honeypot: hidden from people, bots fill it in
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<EmailStatus | null>(null);

  function clearError(field: string) {
    if (!errors[field]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;

    const { errors: found } = validateMessage({ listingId, buyerEmail, message });
    if (hasErrors(found)) {
      setErrors(found);
      return;
    }

    setSending(true);
    try {
      const { message: result } = await requestJson<{ message: { id: string | null; emailStatus: EmailStatus } }>(
        "/api/messages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listingId, buyerEmail, message, website }),
        }
      );
      setSent(result.emailStatus);
      setErrors({});
      toast.success("Message sent!");
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors);
      toast.error("Couldn't send your message", { description: errorMessage(err) });
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="animate-pop-in rounded-xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-200" role="status">
        <CheckCircle2 className="animate-check-pop mx-auto size-10 text-emerald-600" aria-hidden="true" />
        <p className="mt-2 font-semibold text-emerald-900">Message sent!</p>
        <p className="mt-1 text-sm text-emerald-800">
          {sent === "sent"
            ? `${sellerName} will get it by email and can reply to ${buyerEmail}.`
            : `${sellerName} can read it in their Marketplace messages.`}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 bg-white"
          onClick={() => {
            setSent(null);
            setMessage("");
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3" aria-label="Send seller a message">
      <h2 className="flex items-center gap-2 font-semibold text-gray-900">
        <MessageCircle className="size-5 text-primary" aria-hidden="true" />
        Send seller a message
      </h2>

      <div className="space-y-1.5">
        <Label htmlFor="buyerEmail" className="text-sm text-gray-700">
          Your email
        </Label>
        <Input
          id="buyerEmail"
          type="email"
          value={buyerEmail}
          onChange={(e) => {
            setBuyerEmail(e.target.value);
            clearError("buyerEmail");
          }}
          placeholder="you@example.com"
          autoComplete="email"
          maxLength={LIMITS.email}
          disabled={sending}
          aria-invalid={!!errors.buyerEmail}
          className={cn("h-10 bg-gray-50", errors.buyerEmail && "border-red-400")}
        />
        {errors.buyerEmail && <p className="text-sm text-red-600">{errors.buyerEmail}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" className="sr-only">
          Message
        </Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            clearError("message");
          }}
          maxLength={LIMITS.message}
          rows={3}
          disabled={sending}
          aria-invalid={!!errors.message}
          className={cn("min-h-24 resize-none bg-gray-50", errors.message && "border-red-400")}
        />
        {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
      </div>

      {/* Honeypot field: off-screen for people, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={sending} className="h-10 w-full font-semibold active:scale-[0.98]">
        {sending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {sending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
