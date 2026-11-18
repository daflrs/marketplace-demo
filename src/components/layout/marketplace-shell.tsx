import { Sidebar } from "./sidebar";
import { CategoryTabs } from "./category-tabs";

/** Page layout with the category sidebar (desktop) or category tabs (mobile). */
export function MarketplaceShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5">
      <Sidebar className="hidden lg:block" />
      <div className="min-w-0 flex-1">
        <CategoryTabs className="mb-4 lg:hidden" />
        {children}
      </div>
    </div>
  );
}
