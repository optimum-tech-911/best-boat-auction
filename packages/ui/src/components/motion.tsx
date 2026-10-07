"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode, type RefObject } from "react";

interface InViewOptions {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

/** The one shared IntersectionObserver hook of DESIGN_V1_1.md section 3. */
export function useInView<T extends Element>(ref: RefObject<T | null>, { rootMargin = "0px 0px -64px 0px", threshold = 0.06, once = true }: InViewOptions = {}): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) setInView(false);
      }
    }, { rootMargin, threshold });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold, once]);
  return inView;
}

/** rise: section reveal (2) · image: masked reveal (M10) · heading: heading rise (M11) · divider: divider draw (M12) · diagram: diagram draw (M16). */
export type RevealKind = "rise" | "image" | "heading" | "divider" | "diagram";

const durations: Record<RevealKind, number> = { rise: 450, image: 900, heading: 720, divider: 800, diagram: 1_400 };

interface RevealProps {
  as?: ElementType;
  kind?: RevealKind;
  /** Stagger in milliseconds; capped at 240 ms (four cards at 60 ms). */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
}

/**
 * Plays an entrance once, when the element first enters the viewport. Content renders
 * visible on the server and without JavaScript; elements already on screen, focused or
 * viewed with reduced motion never wait.
 */
export function Reveal({ as: Tag = "div", kind = "rise", delay = 0, className, style, children, id }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = element.getBoundingClientRect();
    if (bounds.top < window.innerHeight && bounds.bottom > 0) return;
    element.dataset.motion = "waiting";
    let timer: number | undefined;
    const show = () => {
      element.dataset.motion = "visible";
      observer.disconnect();
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      requestAnimationFrame(() => {
        element.dataset.motion = "entering";
        timer = window.setTimeout(() => { element.dataset.motion = "visible"; }, durations[kind] + Math.min(delay, 240) + 50);
      });
    }, { rootMargin: "0px 0px -64px 0px", threshold: 0.06 });
    observer.observe(element);
    element.addEventListener("focusin", show, { once: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("focusin", show);
      if (timer !== undefined) window.clearTimeout(timer);
      delete element.dataset.motion;
    };
  }, [kind, delay]);
  return (
    <Tag ref={ref} id={id} data-reveal={kind} className={className} style={{ ...style, "--reveal-delay": `${Math.min(delay, 240)}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
