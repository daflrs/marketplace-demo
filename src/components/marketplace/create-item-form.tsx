"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoDropzone } from "./photo-dropzone";
import { ListingPreview } from "./listing-preview";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { CATEGORIES, getCategoryLabel, isCategorySlug } from "@/lib/categories";
import { LIMITS, STORAGE_KEYS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { ApiError, errorMessage, requestJson } from "@/lib/http";
import { prepareImage } from "@/lib/image";
import { hasErrors, parsePrice, validateListing } from "@/lib/validation";
import type { FieldErrors, Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_TO_CATEGORY: Record<string, string> = { vehicle: "vehicles", home: "property-rentals" };

// Order of fields on the page, used to focus the first error.
const FIELD_ORDER = ["photo", "title", "price", "category", "location", "description", "sellerName", "sellerEmail"];

type Stage = "idle" | "uploading" | "publishing";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="animate-pop-in text-sm text-red-600">
      {message}
    </p>
  );
}

export function CreateItemForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetCategory = TYPE_TO_CATEGORY[searchParams.get("type") ?? ""] ?? "";

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(presetCategory);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [sellerName, setSellerName] = useLocalStorage(STORAGE_KEYS.sellerName);
  const [sellerEmail, setSellerEmail] = useLocalStorage(STORAGE_KEYS.sellerEmail);

  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [stage, setStage] = useState<Stage>("idle");
  const busy = stage !== "idle";

  // Free the photo preview's memory when it changes or the page closes.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearError(field: string) {
    if (!errors[field]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function selectPhoto(file: File) {
    setProcessingPhoto(true);
    clearError("photo");
    try {
      const prepared = await prepareImage(file);
      setPhoto(prepared);
      setPreviewUrl(URL.createObjectURL(prepared));
    } catch (err) {
      setErrors((e) => ({ ...e, photo: errorMessage(err) }));
    } finally {
      setProcessingPhoto(false);
    }
  }

  function removePhoto() {
    setPhoto(null);
    setPreviewUrl(null);
  }

  function focusFirstError(fieldErrors: FieldErrors) {
    const first = FIELD_ORDER.find((f) => fieldErrors[f]);
    if (first) document.getElementById(first)?.focus();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || processingPhoto) return;

    const fields = { title, price, category, location, description, sellerName, sellerEmail };
    const { errors: found } = validateListing(fields);
    if (hasErrors(found)) {
      setErrors(found);
      focusFirstError(found);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    try {
      let imageUrl: string | null = null;
      if (photo) {
        setStage("uploading");
        const body = new FormData();
        body.append("file", photo);
        const uploaded = await requestJson<{ url: string }>("/api/upload", { method: "POST", body });
        imageUrl = uploaded.url;
      }

      setStage("publishing");
      const { listing } = await requestJson<{ listing: Listing }>("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, imageUrl }),
      });

      if (listing.buy_now_enabled) {
        toast.success("Your listing is live with Buy now! 🎉");
      } else {
        toast.success("Your listing is live! 🎉", {
          description: "Connect Stripe so buyers can pay you online.",
          duration: 10_000,
          action: {
            label: "Get paid",
            onClick: () => router.push(`/sell/payouts?email=${encodeURIComponent(sellerEmail.trim())}`),
          },
        });
      }
      router.push(`/item/${listing.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setErrors(err.fieldErrors);
        focusFirstError(err.fieldErrors);
      }
      toast.error("Couldn't publish your listing", { description: errorMessage(err) });
      setStage("idle");
    }
  }

  const parsedPrice = parsePrice(price);
  const fieldClass = (field: string) => cn("h-11 bg-white text-base md:text-base", errors[field] && "border-red-400");
  const describedBy = (field: string) => (errors[field] ? `${field}-error` : undefined);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label="Create listing">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Item for sale</h1>
          <p className="text-sm text-gray-600">Fields marked * are required.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="photo">Photo</Label>
          <PhotoDropzone
            previewUrl={previewUrl}
            processing={processingPhoto}
            disabled={busy}
            error={errors.photo ?? errors.imageUrl}
            onSelect={selectPhoto}
            onRemove={removePhoto}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError("title");
            }}
            maxLength={LIMITS.title}
            placeholder="What are you selling?"
            disabled={busy}
            aria-invalid={!!errors.title}
            aria-describedby={describedBy("title")}
            className={fieldClass("title")}
          />
          <FieldError id="title" message={errors.title} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price *</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="price"
                inputMode="decimal"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  clearError("price");
                }}
                placeholder="0.00"
                disabled={busy}
                aria-invalid={!!errors.price}
                aria-describedby={describedBy("price")}
                className={cn(fieldClass("price"), "pl-7")}
              />
            </div>
            <FieldError id="price" message={errors.price} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                clearError("category");
              }}
              disabled={busy}
              aria-invalid={!!errors.category}
              aria-describedby={describedBy("category")}
              className={cn(
                "h-11 w-full rounded-lg border border-input bg-white px-3 text-base outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
                !category && "text-gray-500",
                errors.category && "border-red-400"
              )}
            >
              <option value="" disabled>
                Select a category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug} className="text-gray-900">
                  {c.label}
                </option>
              ))}
            </select>
            <FieldError id="category" message={errors.category} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              clearError("location");
            }}
            maxLength={LIMITS.location}
            placeholder="Angeles City, Pampanga"
            autoComplete="address-level2"
            disabled={busy}
            aria-invalid={!!errors.location}
            aria-describedby={describedBy("location")}
            className={fieldClass("location")}
          />
          <FieldError id="location" message={errors.location} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearError("description");
            }}
            maxLength={LIMITS.description}
            placeholder="Condition, size, pickup details…"
            rows={4}
            disabled={busy}
            aria-invalid={!!errors.description}
            aria-describedby={describedBy("description")}
            className={cn("min-h-28 bg-white text-base md:text-base", errors.description && "border-red-400")}
          />
          <div className="flex justify-between gap-2">
            <FieldError id="description" message={errors.description} />
            <span className="ml-auto text-xs tabular-nums text-gray-500">
              {description.length}/{LIMITS.description}
            </span>
          </div>
        </div>

        <fieldset className="space-y-4 rounded-xl bg-white p-4 ring-1 ring-gray-200/70" disabled={busy}>
          <legend className="sr-only">Seller details</legend>
          <div className="space-y-1.5">
            <Label htmlFor="sellerName">Your name *</Label>
            <Input
              id="sellerName"
              value={sellerName}
              onChange={(e) => {
                setSellerName(e.target.value);
                clearError("sellerName");
              }}
              maxLength={LIMITS.sellerName}
              placeholder="Juan dela Cruz"
              autoComplete="name"
              aria-invalid={!!errors.sellerName}
              aria-describedby={describedBy("sellerName")}
              className={fieldClass("sellerName")}
            />
            <FieldError id="sellerName" message={errors.sellerName} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sellerEmail">Email *</Label>
            <Input
              id="sellerEmail"
              type="email"
              value={sellerEmail}
              onChange={(e) => {
                setSellerEmail(e.target.value);
                clearError("sellerEmail");
              }}
              maxLength={LIMITS.email}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.sellerEmail}
              aria-describedby={errors.sellerEmail ? "sellerEmail-error" : "sellerEmail-hint"}
              className={fieldClass("sellerEmail")}
            />
            <FieldError id="sellerEmail" message={errors.sellerEmail} />
            <p id="sellerEmail-hint" className="flex items-center gap-1.5 text-xs text-gray-500">
              <Lock className="size-3.5" aria-hidden="true" />
              Private. Only used to send you buyers&apos; messages.
            </p>
          </div>
        </fieldset>

        <Button
          type="submit"
          size="lg"
          disabled={busy || processingPhoto}
          className="h-11 w-full text-base font-semibold transition active:scale-[0.98]"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {stage === "uploading" ? "Uploading photo…" : stage === "publishing" ? "Publishing…" : "Publish listing"}
        </Button>
      </form>

      <section aria-label="Preview" className="lg:sticky lg:top-20 lg:self-start">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Preview</h2>
        <ListingPreview
          imageUrl={previewUrl}
          title={title.trim()}
          price={parsedPrice !== null ? formatPrice(parsedPrice) : ""}
          location={location.trim()}
          categoryLabel={isCategorySlug(category) ? getCategoryLabel(category) : null}
          description={description.trim()}
          sellerName={sellerName.trim()}
        />
      </section>
    </div>
  );
}
