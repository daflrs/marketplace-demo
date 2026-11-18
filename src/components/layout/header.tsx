import Link from "next/link";
import { Bell, Mail, Plus, User } from "lucide-react";

const iconButton =
  "flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-95";

/** Facebook-style top bar: logo, Sell button, and Messages / notifications / profile icons. */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
        <Link href="/" className="group flex items-center gap-2" aria-label="Marketplace home">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-xl font-bold text-white transition-transform group-hover:scale-105 group-active:scale-95">
            F
          </span>
          <span className="text-xl font-bold tracking-tight text-gray-900">Marketplace</span>
        </Link>

        <nav className="ml-auto flex items-center gap-2" aria-label="Main">
          <Link
            href="/create"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary transition hover:bg-primary/15 active:scale-95 sm:px-4"
          >
            <Plus className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Create new listing</span>
            <span className="sm:hidden">Sell</span>
          </Link>
          <Link href="/messages" className={iconButton} aria-label="Messages" title="Messages">
            <Mail className="size-5" aria-hidden="true" />
          </Link>
          <span
            className={`${iconButton} hidden cursor-default opacity-60 hover:bg-gray-100 sm:flex`}
            title="Notifications (coming soon)"
            aria-hidden="true"
          >
            <Bell className="size-5" />
          </span>
          <span
            className={`${iconButton} hidden cursor-default opacity-60 hover:bg-gray-100 sm:flex`}
            title="Profile (coming soon)"
            aria-hidden="true"
          >
            <User className="size-5" />
          </span>
        </nav>
      </div>
    </header>
  );
}
