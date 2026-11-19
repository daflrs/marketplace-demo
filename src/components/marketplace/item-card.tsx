import Link from "next/link";
import { MapPin, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListingImage } from "./listing-image";
import { TimeAgo } from "./time-ago";
import { getCategoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

type Props = { listing: Listing; view: ViewMode; index: number };

/** Sold / Pending ribbon over the photo, or a "Buy now" chip for purchasable items. */
function StatusBadge({ listing }: { listing: Listing }) {
  if (listing.status === "sold") {
    return (
      <span className="absolute left-2 top-2 z-10 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
        Sold
      </span>
    );
  }
  if (listing.status === "pending") {
    return (
      <span className="absolute left-2 top-2 z-10 rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
        Pending
      </span>
    );
  }
  if (listing.buy_now_enabled && listing.price >= 0.5) {
    return (
      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/20">
        <ShoppingBag className="size-3" aria-hidden="true" />
        Buy now
      </span>
    );
  }
  return null;
}

export function ItemCard({ listing, view, index }: Props) {
  // Cards cascade in, like posts on the wall.
  const style = { animationDelay: `${Math.min(index, 12) * 40}ms` };
  const price = formatPrice(listing.price);
  const sold = listing.status === "sold";

  if (view === "list") {
    return (
      <Link
        href={`/item/${listing.id}`}
        style={style}
        className="animate-pop-in group flex gap-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200/70 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
      >
        <div className="relative shrink-0">
          <StatusBadge listing={listing} />
          <ListingImage
            src={listing.image_url}
            alt={listing.title}
            sizes="128px"
            className={cn("size-28 rounded-lg sm:size-32", sold && "opacity-60 grayscale")}
          />
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <p className={cn("text-lg font-bold text-gray-900", sold && "text-gray-500 line-through")}>{price}</p>
          <h3 className="line-clamp-1 font-medium text-gray-900">{listing.title}</h3>
          {listing.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{listing.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              {listing.location}
            </span>
            <TimeAgo iso={listing.created_at} prefix="Listed " />
            <Badge variant="secondary">{getCategoryLabel(listing.category)}</Badge>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/item/${listing.id}`}
      style={style}
      className="animate-pop-in group block rounded-xl p-1.5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="relative">
        <StatusBadge listing={listing} />
        <ListingImage
          src={listing.image_url}
          alt={listing.title}
          sizes="(min-width: 1280px) 220px, (min-width: 640px) 30vw, 50vw"
          className={cn("aspect-square w-full rounded-lg", sold && "opacity-60 grayscale")}
        />
      </div>
      <div className="px-0.5 pt-2">
        <p
          className={cn(
            "font-bold text-gray-900",
            listing.price === 0 && "text-primary",
            sold && "text-gray-500 line-through"
          )}
        >
          {price}
        </p>
        <h3 className="line-clamp-2 text-[15px] leading-snug text-gray-900">{listing.title}</h3>
        <p className="mt-0.5 truncate text-sm text-gray-500">{listing.location}</p>
      </div>
    </Link>
  );
}
