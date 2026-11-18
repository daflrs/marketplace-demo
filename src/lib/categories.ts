// Facebook Marketplace's category list (from the mockup).
// Keep the slugs in sync with the check constraint in supabase-schema.sql.
export const CATEGORIES = [
  { slug: "vehicles", label: "Vehicles" },
  { slug: "property-rentals", label: "Property Rentals" },
  { slug: "apparel", label: "Apparel" },
  { slug: "classifieds", label: "Classifieds" },
  { slug: "electronics", label: "Electronics" },
  { slug: "entertainment", label: "Entertainment" },
  { slug: "family", label: "Family" },
  { slug: "free-stuff", label: "Free Stuff" },
  { slug: "garden-outdoor", label: "Garden & Outdoor" },
  { slug: "hobbies", label: "Hobbies" },
  { slug: "home-goods", label: "Home Goods" },
  { slug: "home-improvement", label: "Home Improvement" },
  { slug: "home-sales", label: "Home Sales" },
  { slug: "musical-instruments", label: "Musical Instruments" },
  { slug: "office-supplies", label: "Office Supplies" },
  { slug: "pet-supplies", label: "Pet Supplies" },
  { slug: "sporting-goods", label: "Sporting Goods" },
  { slug: "toys-games", label: "Toys & Games" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

const SLUGS = new Set<string>(CATEGORIES.map((c) => c.slug));

export function isCategorySlug(value: unknown): value is CategorySlug {
  return typeof value === "string" && SLUGS.has(value);
}

export function getCategoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? "Other";
}
