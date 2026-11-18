import { ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  imageUrl: string | null;
  title: string;
  price: string;
  location: string;
  categoryLabel: string | null;
  description: string;
  sellerName: string;
};

const placeholder = "text-gray-400";

/** Live preview of the listing detail page while the form is being filled in. */
export function ListingPreview({ imageUrl, title, price, location, categoryLabel, description, sellerName }: Props) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70">
      <div className="grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="relative aspect-[4/3] bg-gray-900 md:aspect-auto md:min-h-[420px]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={imageUrl} alt="" className="absolute inset-0 size-full object-contain" />
          ) : (
            <div className="bg-hatch absolute inset-0 flex flex-col items-center justify-center gap-2 text-primary/60">
              <ImageIcon className="size-10" aria-hidden="true" />
              <span className="text-sm font-medium">Your photo will appear here</span>
            </div>
          )}
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h2 className={cn("break-words text-2xl font-bold", title ? "text-gray-900" : placeholder)}>
              {title || "Title"}
            </h2>
            <p className={cn("mt-1 text-lg font-semibold", price ? "text-gray-900" : placeholder)}>{price || "Price"}</p>
            <p className="mt-2 text-sm text-gray-500">
              Listed just now
              <br />
              in {location || "your location"}
            </p>
            {categoryLabel && (
              <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {categoryLabel}
              </span>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-gray-900">Details</h3>
            <p className={cn("mt-1 whitespace-pre-line break-words text-sm", description ? "text-gray-700" : placeholder)}>
              {description || "Description will appear here."}
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-gray-900">Seller information</h3>
            <div className="mt-2 flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {initials(sellerName || "You")}
                </AvatarFallback>
              </Avatar>
              <span className={sellerName ? "text-gray-900" : placeholder}>{sellerName || "Your name"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
