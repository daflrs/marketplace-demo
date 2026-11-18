# Setup

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste [`supabase-schema.sql`](supabase-schema.sql), and run it.
3. Check that **Table Editor** shows `listings` and `messages`, and that **Storage** shows a public `listing-images` bucket.
4. From **Project Settings**:
   - **Data API** → API URL
   - **API Keys → Legacy API Keys** → `anon` key and `service_role` key

## 2. Environment variables

Create `.env.local` in the project root (see `.env.example`):

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public reads of listings |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Server-only.** Never add `NEXT_PUBLIC_`, never commit |
| `RESEND_API_KEY` | No | Turns on email notifications |
| `RESEND_FROM_EMAIL` | No | Defaults to `Marketplace <onboarding@resend.dev>` |
| `RESEND_DEMO_RECIPIENT` | No | Sends all notifications to this inbox |

Restart `npm run dev` after changing `.env.local`.

### Resend (optional)

1. Sign up at [resend.com](https://resend.com) and create an API key.
2. Without a verified domain, Resend only delivers to **your own signup email**. Set `RESEND_DEMO_RECIPIENT` to that address so every notification reaches you.
3. To email real sellers, verify a domain in Resend and set `RESEND_FROM_EMAIL` to an address on it, then remove `RESEND_DEMO_RECIPIENT`.

**To turn email off**, remove `RESEND_API_KEY` (and redeploy on Vercel). Messages keep saving.

## 3. Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build check
```

## 4. Deploy to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add every variable from the table above under **Settings → Environment Variables**.
3. Deploy, and use the short production URL (not a preview URL).
