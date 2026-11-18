"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Error boundary for every page: shows a friendly message instead of a blank screen. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="animate-pop-in flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <TriangleAlert className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-gray-600">
        We couldn&apos;t load this page. It might be a connection problem. Please try again.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </Button>
        <Link
          href="/"
          className="inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          Go to Marketplace
        </Link>
      </div>
    </div>
  );
}
