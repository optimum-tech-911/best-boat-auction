import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { MediaImage } from "@bba/contracts";
import type { Locale } from "@bba/i18n";
import { cx, Icon } from "@bba/ui";

interface LotPhotoProps {
  image: MediaImage | null;
  locale: Locale;
  sizes: string;
  /** "Photo à venir": shown until the lot's photography arrives (DESIGN_SYSTEM.md section 8). */
  placeholder: string;
  /** The largest image above the fold: loaded at once with a high fetch priority. */
  priority?: boolean;
  /** Decorative when the image sits inside a link already named by the lot title. */
  decorative?: boolean;
  fit?: "cover" | "contain";
  className?: string;
}

/** A lot or editorial photo filling its container around the focal point, or the missing-photo block. */
export function LotPhoto({ image, locale, sizes, placeholder, priority = false, decorative = false, fit = "cover", className }: LotPhotoProps) {
  if (!image) {
    return (
      <div className={cx("absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100 text-stone-600", className)}>
        <Icon icon={ImageIcon} size="l" />
        <span className="type-body-s">{placeholder}</span>
      </div>
    );
  }
  return (
    <Image
      src={image.src}
      alt={decorative ? "" : image.alt[locale]}
      fill
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      quality={75}
      className={cx(fit === "cover" ? "object-cover" : "object-contain", className)}
      style={{ objectPosition: image.focalPoint }}
    />
  );
}
