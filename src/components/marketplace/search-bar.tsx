"use client";

import { useState, type FormEvent } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { initialQuery: string; placeholder: string; onSearch: (q: string) => void };

/** Search box. Remount it with key={query} to sync it with the URL. */
export function SearchBar({ initialQuery, placeholder, onSearch }: Props) {
  const [value, setValue] = useState(initialQuery);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSearch(value.trim());
  }

  return (
    <form role="search" onSubmit={submit} className="flex flex-1 gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
        <Input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Search listings"
          maxLength={80}
          className="h-11 rounded-full border-transparent bg-white pl-10 pr-10 text-base shadow-sm ring-1 ring-gray-200 md:text-base [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              onSearch("");
            }}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Button type="submit" className="h-11 rounded-full px-5 font-semibold">
        Search
      </Button>
    </form>
  );
}
