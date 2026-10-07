"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MediaImage } from "@bba/contracts";
import { interpolate, plural, type Locale, type Messages } from "@bba/i18n";
import { Button, cx, Icon } from "@bba/ui";
import { LotPhoto } from "./lot-photo";

interface LotGalleryProps {
  images: readonly MediaImage[];
  title: string;
  locale: Locale;
  messages: Messages["lotPage"]["gallery"];
  placeholder: string;
}

/**
 * C-23 gallery: the main 4:3 image, a row of 88 px thumbnails with a navy outline on the active one,
 * and "Voir les 3 photos". The lightbox fills the screen on navy-950, fits each image whole, and
 * answers to the arrow keys, Escape and swipes.
 */
export function LotGallery({ images, title, locale, messages, placeholder }: LotGalleryProps) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const count = images.length;
  const current = images[index] ?? null;

  if (!count) {
    return <div className="relative aspect-4/3 overflow-hidden rounded-md"><LotPhoto image={null} locale={locale} sizes="800px" placeholder={placeholder} /></div>;
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} aria-label={interpolate(messages.open, { index: index + 1 })} className="relative block aspect-4/3 w-full overflow-hidden rounded-md bg-stone-100">
        <LotPhoto image={current} locale={locale} sizes="(max-width: 1023px) 100vw, 800px" placeholder={placeholder} priority />
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {count > 1 && (
          <div role="group" aria-label={messages.thumbnails} className="flex flex-wrap gap-2">
            {images.map((image, position) => (
              <button
                key={image.src}
                type="button"
                aria-pressed={position === index}
                aria-label={`${position + 1} / ${count} · ${image.alt[locale]}`}
                onClick={() => setIndex(position)}
                className={cx("relative aspect-4/3 w-gallery-thumb overflow-hidden rounded-sm outline-offset-2", position === index ? "outline outline-2 outline-navy-900" : "opacity-80 hover:opacity-100")}
              >
                {/* Eager: the first thumbnail shares the main image's source, which the browser already loads. */}
                <Image src={image.src} alt="" fill sizes="88px" loading="eager" className="object-cover" style={{ objectPosition: image.focalPoint }} />
              </button>
            ))}
          </div>
        )}
        <Button variant="secondary" size="sm" icon={Images} onClick={() => setOpen(true)} className="ml-auto">
          {plural(locale, messages.viewAll, count)}
        </Button>
      </div>
      {open && <Lightbox images={images} index={index} onIndex={setIndex} onClose={() => setOpen(false)} title={title} locale={locale} messages={messages} />}
    </div>
  );
}

function Lightbox({ images, index, onIndex, onClose, title, locale, messages }: {
  images: readonly MediaImage[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  title: string;
  locale: Locale;
  messages: LotGalleryProps["messages"];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<number | null>(null);
  const count = images.length;
  const image = images[index];
  const go = (offset: number) => onIndex((index + offset + count) % count);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = overflow;
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  const arrow = "grid size-lightbox-arrow place-items-center rounded-sm bg-ivory-100/16 text-ivory-100 hover:bg-ivory-100/40";
  return (
    <dialog
      ref={dialog}
      aria-label={title}
      className="bba-dialog on-dark fixed inset-0 z-dialog m-0 flex h-full w-full flex-col bg-navy-950 p-0 text-ivory-100"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(1);
        if (event.key === "ArrowLeft") go(-1);
      }}
    >
      <div className="flex h-header-mobile shrink-0 items-center justify-between px-5 lg:h-header">
        <p className="type-num-s" aria-live="polite">{interpolate(messages.counter, { index: index + 1, count })}</p>
        <button type="button" onClick={onClose} aria-label={messages.close} className="grid size-close place-items-center rounded-sm hover:bg-ivory-100/16">
          <Icon icon={X} size="l" />
        </button>
      </div>
      <div
        className="relative min-h-0 flex-1"
        onPointerDown={(event) => { if (event.pointerType !== "mouse") touch.current = event.clientX; }}
        onPointerUp={(event) => {
          if (touch.current === null) return;
          const distance = event.clientX - touch.current;
          touch.current = null;
          if (Math.abs(distance) > 48) go(distance < 0 ? 1 : -1);
        }}
      >
        {image && <Image key={image.src} src={image.src} alt={image.alt[locale]} fill sizes="100vw" quality={85} className="object-contain" />}
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={messages.previous} className={cx(arrow, "absolute left-4 top-1/2 -translate-y-1/2")}><Icon icon={ChevronLeft} size="l" /></button>
            <button type="button" onClick={() => go(1)} aria-label={messages.next} className={cx(arrow, "absolute right-4 top-1/2 -translate-y-1/2")}><Icon icon={ChevronRight} size="l" /></button>
          </>
        )}
      </div>
      <p className="shrink-0 px-5 py-4 text-center type-body-s text-mist-300">{image?.alt[locale]}</p>
    </dialog>
  );
}
