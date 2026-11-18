"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "./item-card";

const OPTIONS = [
  { value: "grid", label: "Grid view", icon: LayoutGrid },
  { value: "list", label: "List view", icon: List },
] as const;

/** Segmented grid/list switch. */
export function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (view: ViewMode) => void }) {
  return (
    <div role="group" aria-label="Layout" className="inline-flex rounded-full bg-white p-1 ring-1 ring-gray-200">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={active}
            title={label}
            onClick={() => onChange(value)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition active:scale-90",
              active ? "bg-primary text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
