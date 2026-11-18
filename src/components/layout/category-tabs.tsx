"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

const TABS = [{ href: "/", label: "All" }, ...CATEGORIES.map((c) => ({ href: `/category/${c.slug}`, label: c.label }))];

/** Mobile/tablet category tabs: a horizontally scrolling row of pills. */
export function CategoryTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Bring the active tab into view (e.g. after opening a category deep in the list).
  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <nav aria-label="Categories" className={cn("-mx-4 overflow-x-auto px-4 scrollbar-none", className)}>
      <div className="flex w-max gap-2 pb-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              ref={active ? activeRef : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition active:scale-95",
                active ? "bg-primary text-white shadow-sm" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
