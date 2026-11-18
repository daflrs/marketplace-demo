# Development guide

How the project is put together, and the decisions behind it.

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── listings/route.ts        GET (browse/search), POST (create)
│   │   ├── listings/[id]/route.ts   GET (one listing)
│   │   ├── messages/route.ts        GET (seller inbox), POST (send + email)
│   │   └── upload/route.ts          POST (photo → Supabase Storage)
│   ├── page.tsx                     Home: Today's picks
│   ├── category/[slug]/page.tsx     Category pages (prerendered)
│   ├── create/page.tsx              Choose listing type
│   ├── create/item/page.tsx         Create form + live preview
│   ├── item/[id]/page.tsx           Listing detail (Server Component)
│   ├── messages/page.tsx            Your listings & messages
│   ├── error.tsx / not-found.tsx    Error boundary + 404
│   ├── layout.tsx                   Header, fonts, toasts
│   └── marketplace.css              Facebook blue theme + animations
├── components/
│   ├── ui/                          shadcn/ui (Base UI)
│   ├── layout/                      header, sidebar, category-tabs, marketplace-shell
│   └── marketplace/                 item-grid, item-card, create-item-form, message-seller-form, seller-inbox, …
├── hooks/                           use-now (shared clock), use-local-storage
└── lib/
    ├── supabase.ts                  public (anon) and admin (service role) clients
    ├── listings.ts                  server-side data access
    ├── validation.ts                shared client/server validation
    ├── email.ts                     Resend notifications (optional)
    ├── image.ts                     browser-side photo resizing
    ├── categories.ts, constants.ts, format.ts, http.ts, api-response.ts, types.ts
```

## Data flow

- **Browse:** `ItemGrid` (client) → `GET /api/listings` → `getListings()` with the **anon** client (public columns only).
- **Detail:** a Server Component calls `getListingById()` directly, streamed behind a `<Suspense>` skeleton.
- **Create:** form → `POST /api/upload` → `POST /api/listings` (service role insert) → redirect to `/item/[id]`.
- **Message:** form → `POST /api/messages` → save (service role) → `notifySeller()` → record `email_status`.

## Next.js 16 notes

- **Cache Components (`cacheComponents: true`):** anything that reads the URL or loads data at request time is wrapped in `<Suspense>` with a skeleton. That's required, and it also gives instant loading states.
- **`params` is a Promise:** pages and route handlers `await params`.
- **No `Date.now()` during render:** relative times (`TimeAgo`) use a shared browser clock (`useNow`) built on `useSyncExternalStore`, so prerendering never freezes a timestamp.
- **localStorage** is read with `useSyncExternalStore` (server snapshot `""`), which avoids hydration mismatches.

## Issues solved

| Problem | Fix |
| --- | --- |
| Guide's Tailwind v3 downgrade | Not needed: Tailwind v4 is stable and shadcn targets it |
| Guide's placeholder env values for builds | Lazy client creation, with clear runtime errors instead |
| Vercel's ~4.5MB request limit for uploads | Resize photos in the browser, and cap the API at 4MB |
| New Supabase projects don't auto-grant table access | Explicit grants in the schema (column-level for anon) |
| Seller email exposure | Column grants + server-only service role key |
| shadcn Base UI vs Radix API differences | Only portable components, a native `<select>` and a custom view toggle |

## Checklist

- **Security:** shared validation, parameterized queries via supabase-js, upload type/size/signature checks, server-only secrets, RLS and column grants
- **Performance:** `next/image` with Supabase remote patterns, photo resizing, trigram search indexes, CDN cache headers on `GET /api/listings/[id]`, prerendered category pages
- **UX:** responsive (mobile tabs and desktop sidebar), skeletons, error boundary, empty states, toasts, success confirmations, accessible forms
- **Development:** TypeScript throughout, ESLint (`npm run lint`), `npm run build`, these docs
