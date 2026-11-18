import Link from "next/link";
import { PackageX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="animate-pop-in flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <PackageX className="size-8" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-gray-900">This page isn&apos;t available</h1>
      <p className="mt-2 text-gray-600">The listing may have been removed, or the link might be broken.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:brightness-110 active:scale-95"
      >
        Browse Marketplace
      </Link>
    </div>
  );
}
