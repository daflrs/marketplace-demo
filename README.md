# Marketplace

A mini Facebook Marketplace: create listings with a photo, browse and search by category, and message sellers. Messages are saved in Supabase and can email the seller through Resend.

**Live demo:** _add your Vercel production URL here_

## Stack

- **Next.js 16** (App Router, `src/` directory, Cache Components) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (Base UI flavor) + **lucide-react** icons
- **Supabase**: Postgres with Row Level Security, plus Storage for photos
- **Resend** for optional email notifications

## Features

- **Create a listing:** photo (drag and drop, auto-resized in the browser), title, price, category, location, description, your name and email. A live preview updates as you type.
- **Browse and search:** "Today's picks" grid with grid/list views, search, and 18 Facebook categories (a sidebar on desktop, scrollable tabs on mobile).
- **Listing detail:** large photo, details, seller info and "Send seller a message".
- **Messages:** saved to Supabase, emailed to the seller with Reply-To set to the buyer, and readable on **Your listings & messages** (the envelope icon).
- Loading skeletons, error boundaries, empty states, toasts, and gentle pop-in animations that respect reduced-motion settings.
- **Payments (Stripe Connect):** sellers connect Stripe, buyers use Buy now, and the platform keeps a 10% fee. See [PAYMENTS.md](PAYMENTS.md).

See [FEATURES.md](FEATURES.md) for details and [SETUP.md](SETUP.md) to run it.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your Supabase keys
npm run dev
```

Run [`supabase-schema.sql`](supabase-schema.sql) in your Supabase SQL Editor first.

## API

| Method | Route | Purpose | Success |
| --- | --- | --- | --- |
| GET | `/api/listings?q=&category=` | Browse and search | 200 |
| POST | `/api/listings` | Create a listing | 201 |
| GET | `/api/listings/[id]` | One listing | 200 / 404 |
| GET | `/api/messages?sellerEmail=` | A seller's messages | 200 |
| POST | `/api/messages` | Message a seller (and email them) | 201 |
| POST | `/api/upload` | Upload a photo to Storage | 201 |

Errors return `{ "error": "...", "fieldErrors"?: { ... } }` with 400, 404, 413, 415 or 500.

## Security

- **Seller emails are never public.** The anon key can only read public listing columns, enforced by column-level grants in Postgres. Emails are only read server-side with the service role key.
- **Messages can't be read or written with the public key.** Everything goes through validated API routes.
- **The same validation runs in the form and the API** (`src/lib/validation.ts`), and again in database check constraints.
- **Uploads are checked server-side:** type, size, and the file's actual bytes (magic number), plus the bucket's own size and type limits. Listings can only reference images in our bucket.
- **Spam protection:** a honeypot field and length limits on messages.

## Decisions

- **Next.js 16 instead of 15:** `create-next-app@latest` installs 16, and the brief's App Router patterns (async `params`, route handlers) are the same.
- **Tailwind v4 stays:** v4 is stable and is what shadcn/ui targets. The guide's v3 downgrade addressed an old macOS-only alpha issue.
- **No placeholder env values:** Supabase clients are created lazily, so builds never need fake keys. Missing variables return a clear error at request time.
- **No accounts:** the seller's email acts as a lightweight check on the messages page. In production this would be login (for example Supabase Auth).
- **Email is optional:** without `RESEND_API_KEY`, messages still save with `email_status = 'skipped'`.
- **Native `<select>` for categories:** it opens the phone's native picker on mobile and is fully accessible.
