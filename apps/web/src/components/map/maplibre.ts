import type { Map as MapLibreMap, MapOptions, StyleSpecification } from "maplibre-gl";
import { useSyncExternalStore } from "react";
import type { Locale } from "@bba/i18n";
import { mapColors } from "@bba/ui/tokens";

/**
 * The basemap: OpenFreeMap's vector tiles (OpenStreetMap data, free, no key), restyled to the brand.
 * Another provider only changes STYLE_URL.
 */
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

type MapLibre = typeof import("maplibre-gl");

/** Below this map width the credits start folded. */
const COMPACT_CREDITS_BELOW = 640;

let library: Promise<MapLibre> | null = null;
const styles = new Map<Locale, Promise<StyleSpecification>>();

/** Loads MapLibre once, on demand, with its worker served from /vendor (scripts/copy-map-worker.mjs). */
export function loadMapLibre(): Promise<MapLibre> {
  library ??= import("maplibre-gl").then((maplibre) => {
    maplibre.setWorkerUrl(`/vendor/maplibre/maplibre-gl-worker-${maplibre.getVersion()}.mjs`);
    return maplibre;
  });
  return library;
}

/** WebGL is required; without it the static fallback stays. */
function supportsWebGl(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

let webGl: boolean | undefined;
const subscribeNever = () => () => {};

/** Whether this browser can draw the map, asked once; true on the server so the first render matches. */
export function useWebGl(): boolean {
  return useSyncExternalStore(subscribeNever, () => (webGl ??= supportsWebGl()), () => true);
}

type Layer = StyleSpecification["layers"][number];

function paint(layer: Layer, values: Record<string, unknown>): Layer {
  return { ...layer, paint: { ...("paint" in layer ? layer.paint : {}), ...values } } as Layer;
}

/** Place and sea names in the page's language when OpenStreetMap has them, otherwise the local name. */
function localName(locale: Locale): unknown {
  return ["coalesce", ["get", `name:${locale}`], ...(locale === "en" ? [["get", "name_en"]] : []), ["get", "name"]];
}

function brand(style: StyleSpecification, locale: Locale): StyleSpecification {
  const layers = style.layers.map((layer): Layer => {
    const { id, type } = layer;
    if (type === "background") return paint(layer, { "background-color": mapColors.land });
    if (id === "water") return paint(layer, { "fill-color": mapColors.water });
    if (id === "waterway") return paint(layer, { "line-color": mapColors.water });
    if (id === "park" || id.startsWith("landcover")) return paint(layer, { "fill-color": mapColors.green });
    if (id === "landuse_residential") return paint(layer, { "fill-color": mapColors.urban });
    if (id === "building") return paint(layer, { "fill-color": mapColors.building, "fill-outline-color": mapColors.building });
    if (id.startsWith("boundary")) return paint(layer, { "line-color": mapColors.boundary });
    if (type === "symbol" && (id.startsWith("label_") || id.startsWith("water_name"))) {
      const water = id.startsWith("water_name");
      return {
        ...paint(layer, { "text-color": water ? mapColors.waterLabel : mapColors.label, "text-halo-color": mapColors.halo }),
        layout: { ...layer.layout, "text-field": localName(locale) },
      } as Layer;
    }
    return layer;
  });
  return { ...style, layers };
}

function brandStyle(locale: Locale): Promise<StyleSpecification> {
  let style = styles.get(locale);
  if (!style) {
    style = fetch(STYLE_URL).then((response) => {
      if (!response.ok) throw new Error(`Map style unavailable (${response.status}).`);
      return response.json() as Promise<StyleSpecification>;
    }).then((spec) => brand(spec, locale));
    styles.set(locale, style);
  }
  return style;
}

/** A branded map in the container: no rotation or tilt, page scrolling preserved (two fingers or Ctrl to zoom). */
export async function createBrandMap(container: HTMLElement, locale: Locale, options: Omit<MapOptions, "container" | "style">): Promise<MapLibreMap> {
  const [maplibre, style] = await Promise.all([loadMapLibre(), brandStyle(locale)]);
  const map = new maplibre.Map({
    container,
    style,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    cooperativeGestures: true,
    attributionControl: { compact: true },
    ...options,
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
  // On narrow maps the credits start folded behind their (i) button, as OpenStreetMap allows on small screens.
  if (container.clientWidth < COMPACT_CREDITS_BELOW) {
    map.once("load", () => container.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"));
  }
  return map;
}
