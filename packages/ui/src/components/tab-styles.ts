import { cx } from "./primitives";

export type TabsTone = "default" | "inverse";

/** C-03: 44 px text tabs; the active one navy-900 with a 2 px teal-700 underline (ivory on dark). */
export const tabClasses = (active: boolean, tone: TabsTone) => cx(
  "relative inline-flex h-control-md shrink-0 items-center gap-2 type-title-m transition-colors duration-fast",
  "after:absolute after:inset-x-0 after:bottom-0 after:h-underline after:origin-left after:transition-transform after:duration-panel",
  tone === "inverse" ? "after:bg-ivory-100" : "after:bg-teal-700",
  active ? "after:scale-x-100" : "after:scale-x-0",
  active
    ? tone === "inverse" ? "text-ivory-100" : "text-navy-900"
    : tone === "inverse" ? "text-mist-300 hover:text-ivory-100" : "text-stone-600 hover:text-navy-900",
);
