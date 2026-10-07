import { cx } from "./primitives";

const artwork = {
  wordmark: { width: 2172, height: 724, viewBox: "76 147 2019 408" },
  monogram: { width: 1254, height: 1254, viewBox: "77 243 1056 793" },
  stacked: { width: 1254, height: 1254, viewBox: "204 93 847 1107" },
} as const;

interface BrandLogoProps {
  variant?: keyof typeof artwork;
  /** The white rendering used on dark surfaces. */
  inverse?: boolean;
  label?: string;
  className?: string;
}

/** The supplied Best Boat Auction artwork, framed to its visible area without changing its pixels or proportions. */
export function BrandLogo({ variant = "wordmark", inverse = false, label = "Best Boat Auction", className }: BrandLogoProps) {
  const { width, height, viewBox } = artwork[variant];
  return (
    <svg role="img" aria-label={label} viewBox={viewBox} className={cx("block h-auto", inverse && "brightness-0 invert", className)}>
      <image href={`/brand/${variant}.webp`} width={width} height={height} />
    </svg>
  );
}
