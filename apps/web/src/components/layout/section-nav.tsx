"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@bba/ui";

/**
 * A sticky in-page navigation under the header, for the lot and "Comment ça marche" pages. The
 * active link follows the section in view and its teal underline slides to it (M18, 240 ms).
 */
export function SectionNav({ label, sections }: { label: string; sections: readonly { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const [underline, setUnderline] = useState({ left: 0, width: 0 });
  const links = useRef(new Map<string, HTMLAnchorElement>());
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const targets = sections.map((section) => document.getElementById(section.id)).filter((element): element is HTMLElement => element !== null);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-140px 0px -60% 0px" });
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const link = links.current.get(active);
    if (!link) return;
    setUnderline({ left: link.offsetLeft, width: link.offsetWidth });
    const scroller = list.current;
    if (scroller && (link.offsetLeft < scroller.scrollLeft || link.offsetLeft + link.offsetWidth > scroller.scrollLeft + scroller.clientWidth)) {
      scroller.scrollTo({ left: link.offsetLeft - 16, behavior: "smooth" });
    }
  }, [active]);

  return (
    <nav aria-label={label} className="sticky-below-header z-sticky border-b border-stone-300 bg-ivory-100">
      <ul ref={list} className="relative flex gap-6 overflow-x-auto scrollbar-none">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              ref={(element) => { if (element) links.current.set(section.id, element); }}
              href={`#${section.id}`}
              aria-current={active === section.id ? "location" : undefined}
              onClick={() => setActive(section.id)}
              className={cx("flex h-control-md items-center whitespace-nowrap type-label transition-colors duration-fast", active === section.id ? "text-navy-900" : "text-stone-600 hover:text-navy-900")}
            >
              {section.label}
            </a>
          </li>
        ))}
        <li aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-underline w-hairline origin-left bg-teal-700 transition-transform duration-panel ease-standard" style={{ transform: `translateX(${underline.left}px) scaleX(${underline.width})` }} />
      </ul>
    </nav>
  );
}
