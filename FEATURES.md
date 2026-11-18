# Features

## Browse and search (`/`, `/category/[slug]`)
- "Today's picks" grid: 1 to 5 columns depending on screen width, with a cascading pop-in and hover lift
- **Grid / list view** toggle (saved in the URL as `?view=list`)
- **Search** titles and descriptions (`?q=bike`), with a result count and a clear button
- **18 categories** from Facebook Marketplace: a sidebar with icons on desktop, scrollable tabs on mobile
- Category pages are prerendered for every category
- Loading skeletons, "no results" and "nothing here yet" states, and an error state with **Try again**

## Create a listing (`/create`, `/create/item`)
- Listing types from the mockup: Item, Vehicle and Home all open the form (Vehicle and Home preselect their category). "Create multiple listings" is marked Coming soon.
- **Photo:** click or drag and drop. Large photos are resized in the browser (max 1600px, WebP) before upload.
- Title, price (accepts `120`, `1,200.50`, `0` = Free), category, location and description (with a counter)
- **Your name** (shown publicly) and **email** (private, only used to deliver messages). Both are remembered for next time.
- **Live preview** of the listing page as you type
- Inline validation that focuses the first invalid field. The server repeats the same checks.
- Progress states: Optimizing photo… → Uploading photo… → Publishing… → redirect to the new listing

## Listing detail (`/item/[id]`)
- Large photo on a blurred backdrop (Facebook style), price, "Listed 5 minutes ago in …", category, details, seller name and avatar
- **Send seller a message:** your email (remembered) and the message (pre-filled "Hi! Is this still available?")
- Confirmation tells you whether the seller was emailed
- Friendly "not available" page for missing listings

## Your listings & messages (`/messages`, envelope icon)
- Enter your seller email to see your listings and the messages buyers sent
- Each message shows the buyer, the listing, the time, the email status (Emailed / Not emailed / Email failed) and a **Reply by email** link

## Email notifications (bonus)
- Sent with Resend when `RESEND_API_KEY` is set. **Reply-To** is the buyer, so the seller can just hit Reply.
- **Off switch:** no key means no emails, and messages are still saved (`email_status = 'skipped'`)
- `RESEND_DEMO_RECIPIENT` routes every email to one inbox for demos

## Accessibility and polish
- Semantic landmarks, labels on every field, `aria-invalid` with linked error messages, `aria-current` on navigation
- Keyboard-friendly controls with visible focus rings
- Animations respect `prefers-reduced-motion`
