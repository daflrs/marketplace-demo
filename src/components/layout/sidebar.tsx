"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Tag, Tags, Wallet } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_ICONS } from "@/components/marketplace/category-icon";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-2 py-1.5 text-[15px] transition-colors",
        active ? "bg-primary/10 font-semibold text-primary" : "text-gray-800 hover:bg-gray-100"
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-105",
          active ? "bg-primary text-white" : "bg-gray-200 text-gray-700"
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      {label}
    </Link>
  );
}

/** Desktop sidebar: listing shortcuts + category navigation (matches the mockup). */
export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={cn("w-72 shrink-0", className)} aria-label="Marketplace navigation">
      <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200/70">
        <h2 className="px-2 pt-1 text-lg font-bold text-gray-900">Create new listing</h2>
        <div className="mt-2 space-y-0.5">
          <NavItem href="/create" label="Choose listing type" icon={Tag} active={pathname.startsWith("/create")} />
          <NavItem href="/messages" label="Your listings & messages" icon={Tags} active={pathname === "/messages"} />
          <NavItem href="/sell/payouts" label="Get paid" icon={Wallet} active={pathname === "/sell/payouts"} />
        </div>

        <Separator className="my-3" />

        <h2 className="px-2 text-lg font-bold text-gray-900">Categories</h2>
        <nav className="mt-2 space-y-0.5" aria-label="Categories">
          <NavItem href="/" label="Today's picks" icon={LayoutGrid} active={pathname === "/"} />
          {CATEGORIES.map((c) => (
            <NavItem
              key={c.slug}
              href={`/category/${c.slug}`}
              label={c.label}
              icon={CATEGORY_ICONS[c.slug]}
              active={pathname === `/category/${c.slug}`}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}
