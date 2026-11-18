import { Skeleton } from "@/components/ui/skeleton";
import type { ViewMode } from "./item-card";

export const GRID_CLASSES =
  "grid grid-cols-1 gap-x-2 gap-y-4 min-[420px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

export function GridSkeleton({ view = "grid", count = 10 }: { view?: ViewMode; count?: number }) {
  if (view === "list") {
    return (
      <div className="space-y-3" aria-label="Loading listings" role="status">
        {Array.from({ length: Math.min(count, 5) }, (_, i) => (
          <div key={i} className="flex gap-4 rounded-xl bg-white p-3 ring-1 ring-gray-200/70">
            <Skeleton className="size-28 shrink-0 rounded-lg sm:size-32" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={GRID_CLASSES} aria-label="Loading listings" role="status">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-1.5">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="mt-2 h-4 w-16" />
          <Skeleton className="mt-1.5 h-4 w-4/5" />
          <Skeleton className="mt-1.5 h-3.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/** Fallback for the whole browse area (search bar + grid) while it loads. */
export function BrowseSkeleton() {
  return (
    <div>
      <div className="mb-5 flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-full" />
        <Skeleton className="h-11 w-24 rounded-full" />
      </div>
      <GridSkeleton />
    </div>
  );
}
