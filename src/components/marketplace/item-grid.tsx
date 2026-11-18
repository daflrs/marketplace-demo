"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PackageSearch, RefreshCw, SearchX, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemCard, type ViewMode } from "./item-card";
import { GRID_CLASSES, GridSkeleton } from "./grid-skeleton";
import { EmptyState } from "./empty-state";
import { SearchBar } from "./search-bar";
import { ViewToggle } from "./view-toggle";
import { getCategoryLabel, type CategorySlug } from "@/lib/categories";
import { errorMessage, requestJson } from "@/lib/http";
import type { Listing } from "@/lib/types";

type Result = { key: string; listings: Listing[]; error: null } | { key: string; listings: null; error: string };

/**
 * Browse + search listings via GET /api/listings.
 * The search term (?q=) and layout (?view=list) live in the URL, so results are shareable.
 */
export function ItemGrid({ category }: { category?: CategorySlug }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const view: ViewMode = searchParams.get("view") === "list" ? "list" : "grid";

  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const requestKey = `${category ?? "all"}|${q}|${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);

    requestJson<{ listings: Listing[] }>(`/api/listings?${params.toString()}`, { signal: controller.signal })
      .then((data) => setResult({ key: requestKey, listings: data.listings, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ key: requestKey, listings: null, error: errorMessage(err) });
      });

    return () => controller.abort();
  }, [requestKey, q, category]);

  function updateUrl(changes: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // Only show a result if it belongs to the current search/category (avoids stale flashes).
  const current = result && result.key === requestKey ? result : null;
  const where = category ? getCategoryLabel(category) : "Marketplace";

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          key={q}
          initialQuery={q}
          placeholder={`Search ${where}`}
          onSearch={(term) => updateUrl({ q: term || null })}
        />
        <ViewToggle view={view} onChange={(v) => updateUrl({ view: v === "list" ? "list" : null })} />
      </div>

      {q && current?.listings && (
        <p className="mb-3 text-sm text-gray-600" aria-live="polite">
          {current.listings.length} {current.listings.length === 1 ? "result" : "results"} for{" "}
          <span className="font-semibold text-gray-900">&ldquo;{q}&rdquo;</span>
          <button
            type="button"
            onClick={() => updateUrl({ q: null })}
            className="ml-2 font-medium text-primary hover:underline"
          >
            Clear
          </button>
        </p>
      )}

      {current === null ? (
        <GridSkeleton view={view} />
      ) : current.error !== null ? (
        <EmptyState
          icon={PackageSearch}
          title="Couldn't load listings"
          action={
            <Button variant="outline" onClick={() => setAttempt((n) => n + 1)}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          }
        >
          {current.error}
        </EmptyState>
      ) : current.listings.length === 0 ? (
        q ? (
          <EmptyState icon={SearchX} title={`No results for “${q}”`}>
            Try a different word, or check another category.
          </EmptyState>
        ) : (
          <EmptyState
            icon={Store}
            title={category ? `Nothing in ${where} yet` : "No listings yet"}
            action={
              <Link
                href="/create"
                className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
              >
                Create the first listing
              </Link>
            }
          >
            Be the first to sell something here!
          </EmptyState>
        )
      ) : view === "list" ? (
        <div className="space-y-3">
          {current.listings.map((listing, i) => (
            <ItemCard key={listing.id} listing={listing} view="list" index={i} />
          ))}
        </div>
      ) : (
        <div className={GRID_CLASSES}>
          {current.listings.map((listing, i) => (
            <ItemCard key={listing.id} listing={listing} view="grid" index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
