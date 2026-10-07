import type { Messages } from "@bba/i18n";

/** MapLibre's own interface strings, in the page's language. */
export function mapLocale(copy: Messages["map"]): Record<string, string> {
  return {
    "Map.Title": copy.title,
    "Marker.Title": copy.marker,
    "NavigationControl.ZoomIn": copy.zoomIn,
    "NavigationControl.ZoomOut": copy.zoomOut,
    "AttributionControl.ToggleAttribution": copy.attribution,
    "CooperativeGesturesHandler.WindowsHelpText": copy.windowsHelp,
    "CooperativeGesturesHandler.MacHelpText": copy.macHelp,
    "CooperativeGesturesHandler.MobileHelpText": copy.mobileHelp,
  };
}

/** An OpenStreetMap link to the area, without a marker, so the exact berth is never implied. */
export function openStreetMapUrl(latitude: number, longitude: number, zoom = 13): string {
  return `https://www.openstreetmap.org/#map=${zoom}/${latitude.toFixed(4)}/${longitude.toFixed(4)}`;
}
