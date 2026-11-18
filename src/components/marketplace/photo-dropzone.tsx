"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  previewUrl: string | null;
  processing: boolean;
  disabled: boolean;
  error?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

/** Click or drag-and-drop a photo, with a preview and a remove button. */
export function PhotoDropzone({ previewUrl, processing, disabled, error, onSelect, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !disabled) onSelect(file);
  }

  if (previewUrl) {
    return (
      <div className="animate-pop-in group relative overflow-hidden rounded-xl ring-1 ring-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
        <img src={previewUrl} alt="Selected photo" className="aspect-[4/3] w-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remove photo"
          className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition hover:scale-110 hover:text-red-600 active:scale-95 disabled:opacity-50"
        >
          <X className="size-5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        id="photo"
        disabled={disabled || processing}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-describedby="photo-hint"
        className={cn(
          "group flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-white px-4 text-center transition-all duration-200",
          dragging ? "scale-[1.01] border-primary bg-primary/5" : "border-gray-300 hover:border-primary/60 hover:bg-primary/5",
          error && "border-red-300",
          "disabled:cursor-wait"
        )}
      >
        {processing ? (
          <>
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">Optimizing photo…</span>
          </>
        ) : (
          <>
            <span className="flex size-12 items-center justify-center rounded-full bg-gray-100 transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-primary/10">
              <ImagePlus className="size-6 text-gray-600 group-hover:text-primary" aria-hidden="true" />
            </span>
            <span className="font-semibold text-gray-900">Add photo</span>
            <span id="photo-hint" className="text-xs text-gray-500">
              or drag and drop · JPG, PNG or WebP
            </span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}
