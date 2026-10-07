"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { interpolate, plural, type Locale, type Messages } from "@bba/i18n";
import { cx, Icon } from "@bba/ui";
import type { DraftPhoto } from "./listing-draft";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface ListingPhotosProps {
  locale: Locale;
  copy: Messages["listing"]["presentation"];
  photos: readonly DraftPhoto[];
  /** Photos the seller must supply; 0 when the pack includes the photo shoot. */
  required: number;
  packName: string;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onCover: (id: string) => void;
  error?: string;
}

/** The seller's photos: add by picking or dropping, the first one is the cover. Previews stay in the browser. */
export function ListingPhotos({ locale, copy, photos, required, packName, onAdd, onRemove, onCover, error }: ListingPhotosProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const add = (files: FileList | null) => {
    const images = Array.from(files ?? []).filter((file) => ACCEPTED.includes(file.type));
    if (images.length) onAdd(images);
  };
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    add(event.dataTransfer.files);
  };

  return (
    <section aria-labelledby="listing-photos-title">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="listing-photos-title" className="type-title-m text-navy-900">{copy.photos}</h3>
        <span className="type-num-s text-navy-900" aria-live="polite">{plural(locale, copy.count, photos.length)}</span>
      </div>
      <p className="mt-1 type-body-s text-stone-600">
        {required ? interpolate(copy.photosHint, { count: required }) : interpolate(copy.photosIncluded, { pack: packName })}
      </p>
      <ul
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        className={cx("mt-4 grid grid-cols-2 gap-3 rounded-md sm:grid-cols-3", dragging && "outline-dashed outline-2 outline-offset-4 outline-teal-700")}
      >
        {photos.map((photo, index) => (
          <li key={photo.id} className="relative aspect-4/3 overflow-hidden rounded-sm bg-stone-100">
            <Image src={photo.url} alt="" fill unoptimized sizes="240px" className="object-cover" />
            {index === 0 ? (
              <span className="absolute bottom-2 left-2 rounded-xs bg-navy-900 px-2 py-1 type-caption text-ivory-100">{copy.cover}</span>
            ) : (
              <button
                type="button"
                onClick={() => onCover(photo.id)}
                className="absolute bottom-2 left-2 rounded-xs bg-white px-2 py-1 type-caption text-navy-900 shadow-pop transition-colors duration-fast hover:bg-stone-100"
              >
                {copy.makeCover}
              </button>
            )}
            <button
              type="button"
              aria-label={interpolate(copy.remove, { name: photo.file.name })}
              onClick={() => onRemove(photo.id)}
              className="absolute right-2 top-2 grid size-close place-items-center rounded-full bg-white text-navy-900 shadow-pop transition-colors duration-fast hover:bg-stone-100"
            >
              <Icon icon={X} size="s" />
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => input.current?.click()}
            aria-describedby={error ? "listing-photos-error" : undefined}
            className={cx(
              "flex aspect-4/3 w-full flex-col items-center justify-center gap-1 rounded-sm border border-dashed bg-white p-3 text-center transition-colors duration-fast hover:border-navy-900",
              error ? "border-danger-700" : "border-stone-300",
            )}
          >
            <Icon icon={ImagePlus} size="m" className="text-teal-700" />
            <span className="type-label text-navy-900">{copy.add}</span>
            <span className="type-caption text-stone-600">{copy.formats}</span>
          </button>
        </li>
      </ul>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPTED.join(",")}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => { add(event.target.files); event.target.value = ""; }}
      />
      {error && <p id="listing-photos-error" className="mt-hint type-body-s text-danger-700">{error}</p>}
      <p className="mt-4 type-caption text-stone-600">{copy.local}</p>
    </section>
  );
}
