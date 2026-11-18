// Supabase clients. These are only used on the server (API routes and Server Components).
//
// - createPublicClient(): the anon key. Can only read public listing columns (no emails).
// - createAdminClient(): the service role key. Used for writes, messages and seller lookups.
//   SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix, so Next.js never sends it to the browser.
//
// Clients are created lazily, so a missing env var gives a clear error at request time
// instead of crashing the build (no placeholder values needed).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export const LISTING_IMAGES_BUCKET = "listing-images";

/** Every listing column except seller_email. */
export const PUBLIC_LISTING_COLUMNS =
  "id, title, description, price, category, location, seller_name, image_url, created_at";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new ConfigError(`The server is missing the ${name} environment variable.`);
  return value;
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

let publicClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function getSupabaseUrl(): string {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL).replace(/\/+$/, "");
}

export function createPublicClient(): SupabaseClient {
  publicClient ??= createClient(
    getSupabaseUrl(),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    clientOptions
  );
  return publicClient;
}

export function createAdminClient(): SupabaseClient {
  adminClient ??= createClient(
    getSupabaseUrl(),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    clientOptions
  );
  return adminClient;
}

/** Public URL prefix of our photo bucket. Listings may only point at images stored here. */
export function listingImagePrefix(): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${LISTING_IMAGES_BUCKET}/`;
}
