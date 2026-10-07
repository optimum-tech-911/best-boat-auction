"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cx, Icon } from "./primitives";

interface CarouselProps {
  /** The section heading block, aligned with the controls. */
  header: ReactNode;
  /** A link after the arrows, for example "Tous les lots (12) →". */
  action?: ReactNode;
  items: readonly { key: string; content: ReactNode }[];
  label: string;
  previousLabel: string;
  nextLabel: string;
  /** One caption under the track (G0-6). */
  caption?: ReactNode;
}

/**
 * M14 carousel: native horizontal scroll with snapping, mouse drag on desktop, arrows that move
 * one card, a 2 px progress line and a 64 px fade on the right edge. It never moves by itself.
 */
export function Carousel({ header, action, items, label, previousLabel, nextLabel, caption }: CarouselProps) {
  const track = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean; pointer: number } | null>(null);
  const [position, setPosition] = useState({ progress: 0, start: true, end: false, ratio: 1 });

  const measure = useCallback(() => {
    const element = track.current;
    if (!element) return;
    const range = element.scrollWidth - element.clientWidth;
    setPosition({
      progress: range > 0 ? element.scrollLeft / range : 0,
      start: element.scrollLeft <= 2,
      end: element.scrollLeft >= range - 2,
      ratio: element.scrollWidth > 0 ? Math.min(1, element.clientWidth / element.scrollWidth) : 1,
    });
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [measure]);

  const move = (direction: 1 | -1) => {
    const element = track.current;
    const card = element?.firstElementChild as HTMLElement | null;
    if (!element || !card) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: reduced ? "instant" : "smooth" });
  };

  const arrow = "grid size-control-sm place-items-center rounded-sm border border-stone-300 text-navy-900 transition-colors duration-fast hover:border-navy-900 disabled:opacity-40 disabled:hover:border-stone-300";

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">{header}</div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className={arrow} aria-label={previousLabel} disabled={position.start} onClick={() => move(-1)}><Icon icon={ChevronLeft} size="m" /></button>
          <button type="button" className={arrow} aria-label={nextLabel} disabled={position.end} onClick={() => move(1)}><Icon icon={ChevronRight} size="m" /></button>
          {action && <div className="ml-auto pl-4 lg:ml-0">{action}</div>}
        </div>
      </div>

      <div className={cx("bba-carousel relative mt-6 lg:mt-10", !position.end && "bba-carousel--more")}>
        <ul
          ref={track}
          aria-label={label}
          onScroll={measure}
          className="bba-carousel__track scrollbar-none"
          onPointerDown={(event) => {
            if (event.pointerType !== "mouse" || event.button !== 0) return;
            drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, moved: false, pointer: event.pointerId };
          }}
          onPointerMove={(event) => {
            const current = drag.current;
            if (!current) return;
            const distance = event.clientX - current.x;
            if (!current.moved && Math.abs(distance) < 6) return;
            if (!current.moved) {
              current.moved = true;
              event.currentTarget.setPointerCapture(current.pointer);
              event.currentTarget.dataset.dragging = "true";
            }
            event.currentTarget.scrollLeft = current.left - distance;
          }}
          onPointerUp={(event) => {
            const current = drag.current;
            drag.current = null;
            delete event.currentTarget.dataset.dragging;
            if (current?.moved) {
              // A drag is not a click on the card under the pointer.
              event.currentTarget.addEventListener("click", (click) => { click.preventDefault(); click.stopPropagation(); }, { capture: true, once: true });
            }
          }}
          onPointerCancel={(event) => {
            drag.current = null;
            delete event.currentTarget.dataset.dragging;
          }}
          onDragStart={(event) => event.preventDefault()}
        >
          {items.map((item) => <li key={item.key} className="bba-carousel__item">{item.content}</li>)}
        </ul>
        <div className="mt-4 h-underline overflow-hidden bg-stone-200" aria-hidden="true">
          <div className="h-full bg-navy-900" style={{ width: `${position.ratio * 100}%`, transform: `translateX(${position.progress * ((1 - position.ratio) / position.ratio) * 100}%)` }} />
        </div>
      </div>
      {caption && <p className="mt-4 type-caption text-stone-600">{caption}</p>}
    </div>
  );
}
