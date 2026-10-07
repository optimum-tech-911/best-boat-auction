"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent } from "react";
import { circleRing, PUBLIC_AREA_RADIUS_METERS, publicArea, type GeoPoint } from "@bba/domain";
import { formatNumber, interpolate, type Locale, type Messages } from "@bba/i18n";
import { Button, cx, Icon, Spinner } from "@bba/ui";
import { mapColors } from "@bba/ui/tokens";
import { placeAt, searchPlaces, type Place } from "@/lib/geocoding";
import { createBrandMap, loadMapLibre, useWebGl } from "./maplibre";
import { mapLocale } from "./map-ui";

/** Europe, before anything is chosen. */
const START = { center: [6, 47] as [number, number], zoom: 3.6 };
const CHOSEN_ZOOM = 14;
const SEARCH_DELAY_MS = 300;
const MIN_QUERY = 3;

interface LocationPickerProps {
  value: Place | null;
  onChange: (place: Place) => void;
  locale: Locale;
  copy: Messages["listing"]["location"];
  mapCopy: Messages["map"];
  /** A message under the map, such as "Placez le bateau sur la carte". */
  error?: string;
}

/**
 * Where the boat is, on a real map: search a port or an address, use the device's position, or
 * click the map and drag the pin. The public 2 km area is drawn as the buyers will see it.
 */
export function LocationPicker({ value, onChange, locale, copy, mapCopy, error }: LocationPickerProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const lookup = useRef<AbortController | null>(null);
  const inputId = useId();
  const listId = useId();
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const webGl = useWebGl();
  const failed = loadFailed || !webGl;
  const [text, setText] = useState("");
  const [found, setFound] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState<"idle" | "busy" | "denied">("idle");
  const [resolving, setResolving] = useState(false);

  /** Shows a point on the map: the pin, the public area and, when asked, the camera. */
  const show = (point: GeoPoint, fly: boolean) => {
    const current = map.current;
    const pin = marker.current;
    if (!current || !pin) return;
    pin.setLngLat([point.longitude, point.latitude]).addTo(current);
    current.getSource<GeoJSONSource>("public-area")?.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [circleRing(publicArea(point), PUBLIC_AREA_RADIUS_METERS)] },
    });
    if (fly) current.flyTo({ center: [point.longitude, point.latitude], zoom: CHOSEN_ZOOM, essential: true, duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900 });
  };

  /** A point chosen on the map or from the device: name it from OpenStreetMap, then report it. */
  const choose = async (point: GeoPoint, fly: boolean, known?: Place) => {
    show(point, fly);
    if (known) {
      onChange(known);
      return;
    }
    lookup.current?.abort();
    const controller = new AbortController();
    lookup.current = controller;
    setResolving(true);
    const unnamed: Place = { point, label: `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`, city: "", countryCode: "", countryName: "" };
    try {
      onChange((await placeAt(point, locale, controller.signal)) ?? unnamed);
    } catch (reason) {
      if ((reason as Error).name !== "AbortError") onChange(unnamed);
    } finally {
      if (lookup.current === controller) setResolving(false);
    }
  };

  const onMapPoint = useEffectEvent((point: GeoPoint) => void choose(point, false));
  const initialPlace = useEffectEvent(() => value);
  const onReady = useEffectEvent(() => {
    setReady(true);
    if (value) show(value.point, false);
  });

  // The map and its pin, once; later choices move them.
  useEffect(() => {
    const element = container.current;
    if (!element || !webGl) return;
    let disposed = false;
    const start = initialPlace();
    void Promise.all([
      loadMapLibre(),
      createBrandMap(element, locale, {
        ...(start ? { center: [start.point.longitude, start.point.latitude], zoom: CHOSEN_ZOOM } : START),
        cooperativeGestures: false,
        locale: mapLocale(mapCopy),
      }),
    ]).then(([maplibre, created]) => {
      if (disposed) {
        created.remove();
        return;
      }
      map.current = created;
      created.getCanvas().style.cursor = "crosshair";
      const pin = document.createElement("div");
      pin.className = "grid size-control-sm place-items-center rounded-full border-2 border-white bg-navy-900 shadow-pop";
      pin.setAttribute("aria-hidden", "true");
      pin.innerHTML = '<span class="size-dot rounded-full bg-ivory-100"></span>';
      marker.current = new maplibre.Marker({ element: pin, draggable: true });
      marker.current.on("dragend", () => {
        const position = marker.current?.getLngLat();
        if (position) onMapPoint({ latitude: position.lat, longitude: position.lng });
      });
      created.on("load", () => {
        created.addSource("public-area", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        created.addLayer({ id: "public-area-fill", type: "fill", source: "public-area", paint: { "fill-color": mapColors.areaFill } });
        created.addLayer({ id: "public-area-line", type: "line", source: "public-area", paint: { "line-color": mapColors.area, "line-width": 1.5, "line-dasharray": [2, 2] } });
        onReady();
      });
      created.on("click", (event) => onMapPoint({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }));
    }).catch(() => setLoadFailed(true));
    return () => {
      disposed = true;
      lookup.current?.abort();
      marker.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, [locale, mapCopy, webGl]);

  // Search as the seller types.
  useEffect(() => {
    const query = text.trim();
    if (query.length < MIN_QUERY) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchPlaces(query, locale, controller.signal)
        .then((places) => { setFound(places); setActive(places.length ? 0 : -1); })
        .catch(() => undefined)
        .finally(() => setSearching(false));
    }, SEARCH_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [text, locale]);

  // Results of an older, longer query are not offered once the text is too short to search.
  const results = text.trim().length >= MIN_QUERY ? found : [];

  const pick = (place: Place) => {
    setOpen(false);
    setText(place.label);
    void choose(place.point, true, place);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || !results.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => (index + 1) % results.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => (index - 1 + results.length) % results.length); }
    else if (event.key === "Enter" && active >= 0) { event.preventDefault(); const place = results[active]; if (place) pick(place); }
    else if (event.key === "Escape") setOpen(false);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) {
      setLocating("denied");
      return;
    }
    setLocating("busy");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating("idle");
        void choose({ latitude: position.coords.latitude, longitude: position.coords.longitude }, true);
      },
      () => setLocating("denied"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const optionId = (index: number) => `${listId}-${index}`;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="type-label text-navy-900">{copy.search}</label>
          <div className="relative mt-2">
            <Icon icon={Search} size="s" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-600" />
            <input
              id={inputId}
              type="search"
              role="combobox"
              aria-expanded={open && results.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
              autoComplete="off"
              value={text}
              placeholder={copy.searchPlaceholder}
              onChange={(event) => { setText(event.target.value); setOpen(true); }}
              onKeyDown={onKeyDown}
              onBlur={() => window.setTimeout(() => setOpen(false), 150)}
              className="h-input w-full rounded-sm border border-stone-300 bg-white pl-10 pr-10 type-body-m text-navy-900 placeholder:text-stone-600 focus:border-teal-700 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            {searching && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600"><Spinner /></span>}
          </div>
          {open && text.trim().length >= MIN_QUERY && (
            <ul id={listId} role="listbox" aria-label={copy.search} className="absolute inset-x-0 top-full z-overlay mt-2 overflow-hidden rounded-md border border-stone-300 bg-white shadow-pop">
              {results.length === 0 && !searching && <li className="px-4 py-3 type-body-s text-stone-600">{copy.noResults}</li>}
              {results.map((place, index) => (
                <li
                  key={`${place.label}-${index}`}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => { event.preventDefault(); pick(place); }}
                  onMouseEnter={() => setActive(index)}
                  className={cx("flex cursor-pointer items-start gap-3 px-4 py-3", index === active && "bg-stone-100")}
                >
                  <Icon icon={MapPin} size="s" className="mt-1 shrink-0 text-stone-600" />
                  <span className="min-w-0">
                    <span className="block truncate type-body-m text-navy-900">{place.label}</span>
                    <span className="block type-caption text-stone-600">{place.countryName}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button variant="secondary" icon={LocateFixed} loading={locating === "busy"} onClick={locate} className="shrink-0">{copy.useMine}</Button>
      </div>
      {locating === "denied" && <p className="type-body-s text-stone-600">{copy.denied}</p>}

      <div className={cx("relative aspect-4/3 overflow-hidden rounded-md border bg-stone-100 sm:aspect-16/9", error ? "border-danger-700" : "border-stone-300")}>
        {/* MapLibre makes its container position: relative, so it is sized rather than positioned. */}
        <div ref={container} role="application" aria-label={copy.mapLabel} className="h-full w-full" />
        {!ready && (
          <p className="absolute inset-0 grid place-items-center p-6 text-center type-body-s text-stone-600">{failed ? mapCopy.unavailable : mapCopy.loading}</p>
        )}
        {ready && !value && (
          <p className="pointer-events-none absolute inset-x-4 bottom-4 rounded-sm bg-white px-4 py-3 text-center type-body-s text-navy-900 shadow-pop sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">{copy.hint}</p>
        )}
      </div>
      {error && <p className="type-body-s text-danger-700">{error}</p>}

      {value && (
        <div className="flex gap-3 rounded-md border border-stone-300 bg-white p-4" aria-live="polite">
          <Icon icon={MapPin} size="m" className="mt-1 shrink-0 text-teal-700" />
          <div className="min-w-0">
            <p className="type-eyebrow text-stone-600">{copy.chosen}</p>
            <p className="mt-1 type-title-m text-navy-900">{resolving ? `${copy.naming}` : [value.label, value.countryName].filter(Boolean).join(", ")}</p>
            <p className="type-body-s numerals text-stone-600">
              {formatNumber(value.point.latitude, locale, 5)}, {formatNumber(value.point.longitude, locale, 5)}
            </p>
            <p className="mt-2 type-body-s text-stone-600">{interpolate(copy.privacy, { radius: formatNumber(PUBLIC_AREA_RADIUS_METERS / 1000, locale) })}</p>
          </div>
        </div>
      )}
    </div>
  );
}
