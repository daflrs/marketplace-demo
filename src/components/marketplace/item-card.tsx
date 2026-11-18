import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListingImage } from "./listing-image";
import { TimeAgo } from "./time-ago";
import { getCategoryLabel } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

type Props = { listing: Listing; view: ViewMode; index: number };

export function ItemCard({ listing, view, index }: Props) {
  // Cards cascade in, like posts on the wall.
  const style = { animationDelay: `${Math.min(index, 12) * 40}ms` };
  const price = formatPrice(listing.price);

  if (view === "list") {
    return (
      <Link
        href={`/item/${listing.id}`}
        style={style}
        className="animate-pop-in group flex gap-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200/70 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ListingImage
          src={listing.image_url}
          alt={listing.title}
          sizes="128px"
          className="size-28 shrink-0 rounded-lg sm:size-32"
        />
        <div className="min-w-0 flex-1 py-0.5">
          <p className="text-lg font-bold text-gray-900">{price}</p>
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
      <ListingImage
        src={listing.image_url}
        alt={listing.title}
        sizes="(min-width: 1280px) 220px, (min-width: 640px) 30vw, 50vw"
        className="aspect-square w-full rounded-lg"
      />
      <div className="px-0.5 pt-2">
        <p className={cn("font-bold text-gray-900", listing.price === 0 && "text-primary")}>{price}</p>
        <h3 className="line-clamp-2 text-[15px] leading-snug text-gray-900">{listing.title}</h3>
        <p className="mt-0.5 truncate text-sm text-gray-500">{listing.location}</p>
      </div>
    </Link>
  );
}
