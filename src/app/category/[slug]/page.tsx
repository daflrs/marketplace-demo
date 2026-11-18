import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MarketplaceShell } from "@/components/layout/marketplace-shell";
import { ItemGrid } from "@/components/marketplace/item-grid";
import { BrowseSkeleton } from "@/components/marketplace/grid-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, getCategoryLabel, isCategorySlug } from "@/lib/categories";

type Props = { params: Promise<{ slug: string }> };

/** Prerender a page for every category (/category/electronics, /category/vehicles, ...). */
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default function CategoryPage({ params }: Props) {
  return (
    <MarketplaceShell>
      <Suspense
        fallback={
          <>
            <Skeleton className="mb-4 h-8 w-48" />
            <BrowseSkeleton />
          </>
        }
      >
        <CategoryContent params={params} />
      </Suspense>
    </MarketplaceShell>
  );
}

async function CategoryContent({ params }: Props) {
  const { slug } = await params; // Next.js 15+: params is a Promise
  if (!isCategorySlug(slug)) notFound();

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">{getCategoryLabel(slug)}</h1>
      <Suspense fallback={<BrowseSkeleton />}>
        <ItemGrid category={slug} />
      </Suspense>
    </>
  );
}
