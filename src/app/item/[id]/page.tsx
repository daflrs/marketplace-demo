import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BuyNowPanel } from "@/components/marketplace/buy-now-panel";
import { MessageSellerForm } from "@/components/marketplace/message-seller-form";
import { TimeAgo } from "@/components/marketplace/time-ago";
import { getCategoryLabel } from "@/lib/categories";
import { formatPrice, initials } from "@/lib/format";
import { getListingById } from "@/lib/listings";

type Props = { params: Promise<{ id: string }> };

export default function ItemPage({ params }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-primary transition hover:bg-primary/10"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Marketplace
      </Link>
      {/* The listing loads at request time, so it streams in behind a skeleton. */}
      <Suspense fallback={<ItemDetailSkeleton />}>
        <ItemDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ItemDetail({ params }: Props) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  return (
    <article className="animate-pop-in grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Photo: blurred backdrop + the full photo on top, like Facebook */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-900 lg:aspect-auto lg:h-[calc(100dvh-8.5rem)] lg:min-h-[480px]">
        {listing.image_url ? (
          <>
            <Image
              src={listing.image_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="scale-110 object-cover opacity-60 blur-2xl"
              aria-hidden="true"
            />
            <Image
              src={listing.image_url}
              alt={listing.title}
              fill
              loading="eager"
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-contain"
            />
          </>
        ) : (
          <div className="bg-hatch flex size-full flex-col items-center justify-center gap-2 text-primary/50">
            <ImageIcon className="size-12" aria-hidden="true" />
            <span className="text-sm font-medium">No photo</span>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70 lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto">
        <div>
          <h1 className="break-words text-2xl font-bold text-gray-900">{listing.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-xl font-semibold text-gray-900">
            <span className={listing.status === "sold" ? "text-gray-500 line-through" : undefined}>
              {formatPrice(listing.price)}
            </span>
            {listing.status === "sold" && (
              <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                Sold
              </span>
            )}
            {listing.status === "pending" && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                Pending
              </span>
            )}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            <TimeAgo iso={listing.created_at} prefix="Listed " />
            <br />
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              in {listing.location}
            </span>
          </p>
          <Link
            href={`/category/${listing.category}`}
            className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/15"
          >
            {getCategoryLabel(listing.category)}
          </Link>
        </div>

        <BuyNowPanel
          id={listing.id}
          price={listing.price}
          status={listing.status}
          buy_now_enabled={listing.buy_now_enabled}
          seller_name={listing.seller_name}
        />

        <Separator />

        <section>
          <h2 className="font-semibold text-gray-900">Details</h2>
          <p className="mt-1 whitespace-pre-line break-words text-[15px] text-gray-700">
            {listing.description || "No description provided."}
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-semibold text-gray-900">Seller information</h2>
          <div className="mt-2 flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {initials(listing.seller_name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-gray-900">{listing.seller_name}</span>
          </div>
        </section>

        {listing.status !== "sold" && (
          <>
            <Separator />
            <MessageSellerForm listingId={listing.id} sellerName={listing.seller_name} />
          </>
        )}
      </div>
    </article>
  );
}

function ItemDetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]" role="status" aria-label="Loading listing">
      <Skeleton className="aspect-[4/3] w-full rounded-xl lg:aspect-auto lg:h-[calc(100dvh-8.5rem)] lg:min-h-[480px]" />
      <div className="space-y-4 rounded-xl bg-white p-5 ring-1 ring-gray-200/70">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-6 h-20 w-full" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
