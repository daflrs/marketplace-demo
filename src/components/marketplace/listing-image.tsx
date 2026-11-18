import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  eager?: boolean;
};

/** A listing photo (optimized by next/image), or the mockup-style hatched placeholder. */
export function ListingImage({ src, alt, sizes, className, eager }: Props) {
  if (!src) {
    return (
      <div className={cn("bg-hatch flex items-center justify-center", className)} role="img" aria-label="No photo">
        <ImageIcon className="size-8 text-primary/40" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-gray-100", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={eager ? "eager" : "lazy"}
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
    </div>
  );
}
