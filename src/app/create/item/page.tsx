import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateItemForm } from "@/components/marketplace/create-item-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Item for sale" };

export default function CreateItemPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <Link
        href="/create"
        className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-primary transition hover:bg-primary/10"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Listing types
      </Link>
      {/* The form reads ?type= from the URL, so it renders behind a Suspense skeleton. */}
      <Suspense fallback={<FormSkeleton />}>
        <CreateItemForm />
      </Suspense>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-8" role="status" aria-label="Loading form">
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
      <Skeleton className="h-[460px] w-full rounded-xl" />
    </div>
  );
}
