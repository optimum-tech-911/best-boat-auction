"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { circleRing, PUBLIC_AREA_RADIUS_METERS, type GeoPoint } from "@bba/domain";
import { formatNumber, interpolate, type Locale, type Messages } from "@bba/i18n";
import { cx, Icon } from "@bba/ui";
import { mapColors } from "@bba/ui/tokens";
import { createBrandMap, useWebGl } from "./maplibre";
import { mapLocale, openStreetMapUrl } from "./map-ui";

interface AreaMapProps {
  /** The public, rounded centre of the area, never the berth itself. */
  center: GeoPoint;
  /** "Lelystad, Pays-Bas": the map's accessible name. */
  place: string;
  locale: Locale;
  copy: Messages["map"];
}

type Status = "idle" | "ready" | "failed";

/**
 * The lot's approximate location on a real map: a circle of about 2 km around a rounded point, so
 * the berth stays private. The map loads when it nears the viewport; the coordinates and a link to
 * OpenStreetMap remain available without it.
 */
export function AreaMap({ center, place, locale, copy }: AreaMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const webGl = useWebGl();
  const shown: Status = webGl ? status : "failed";
  const { latitude, longitude } = center;

  useEffect(() => {
    const element = container.current;
    if (!element || !webGl) return;
    let disposed = false;
    let map: Awaited<ReturnType<typeof createBrandMap>> | null = null;
    const start = async () => {
      try {
        const ring = circleRing({ latitude, longitude }, PUBLIC_AREA_RADIUS_METERS);
        const lngs = ring.map(([lng]) => lng);
        const lats = ring.map(([, lat]) => lat);
        map = await createBrandMap(element, locale, {
          bounds: [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          fitBoundsOptions: { padding: 32 },
          locale: mapLocale(copy),
        });
        if (disposed) {
          map.remove();
          return;
        }
        map.on("load", () => {
          if (!map) return;
          map.addSource("area", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } } });
          map.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": mapColors.areaFill } });
          map.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": mapColors.area, "line-width": 1.5, "line-dasharray": [2, 2] } });
          setStatus("ready");
        });
        map.on("error", (event) => {
          if (!map?.loaded()) {
            console.warn("Map error", event.error);
            setStatus((current) => (current === "ready" ? current : "failed"));
          }
        });
      } catch {
        if (!disposed) setStatus("failed");
      }
    };
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void start();
    }, { rootMargin: "400px 0px" });
    observer.observe(element);
    return () => {
      disposed = true;
      observer.disconnect();
      map?.remove();
    };
  }, [latitude, longitude, locale, copy, webGl]);

  const coordinates = `${formatNumber(Math.abs(latitude), locale, 2)}° ${latitude >= 0 ? "N" : "S"} · ${formatNumber(Math.abs(longitude), locale, 2)}° ${longitude >= 0 ? "E" : locale === "fr" ? "O" : "W"}`;
  return (
    <figure>
      <div className="relative aspect-4/3 overflow-hidden rounded-md border border-stone-300 bg-stone-100 sm:aspect-21/9">
        {/* MapLibre makes its container position: relative, so it is sized rather than positioned. */}
        <div ref={container} role="region" aria-label={`${copy.title} : ${place}`} className="h-full w-full" />
        {shown !== "ready" && (
          <p className={cx("absolute inset-0 grid place-items-center p-6 text-center type-body-s text-stone-600", shown === "idle" && "motion-skeleton")}>
            {shown === "failed" ? copy.unavailable : copy.loading}
          </p>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 type-body-s text-stone-600">
        <span><span className="numerals">{coordinates}</span> · {interpolate(copy.area, { radius: formatNumber(PUBLIC_AREA_RADIUS_METERS / 1000, locale) })}</span>
        <a href={openStreetMapUrl(latitude, longitude)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-teal-700 underline-offset-3 hover:underline">
          {copy.open}<Icon icon={ExternalLink} size="s" />
        </a>
      </figcaption>
    </figure>
  );
}
