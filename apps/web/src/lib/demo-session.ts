import { countryCodes, defaultNotificationPreferences, notificationTopics, type CompanyDetails, type NotificationPreferences, type Viewer } from "@bba/contracts";
import { isDemoScenario, type DemoScenario } from "@bba/sdk";

/*
 * Demonstration session cookies. They let server-rendered pages agree with the browser on the
 * demonstration clock and on who is signed in. They are not authentication: Supabase Auth
 * replaces the viewer cookie with an httpOnly session when it is connected.
 */

export const DEMO_CLOCK_COOKIE = "bba-demo-clock";
export const DEMO_VIEWER_COOKIE = "bba-demo-viewer";
export const DEMO_STORAGE_KEY = "bba-demo-state:v1";

export interface DemoClockSetting {
  scenario: DemoScenario;
  offsetMs: number;
}

function parseJson(value: string | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

export function encodeCookie(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value));
}

export function parseDemoClock(value: string | undefined): DemoClockSetting | null {
  const data = parseJson(value);
  if (!data || typeof data !== "object") return null;
  const { scenario, offsetMs } = data as Record<string, unknown>;
  return isDemoScenario(scenario) && typeof offsetMs === "number" && Number.isFinite(offsetMs) ? { scenario, offsetMs } : null;
}

export function parseDemoViewer(value: string | undefined): Viewer | null {
  const data = parseJson(value);
  if (!data || typeof data !== "object") return null;
  const viewer = data as Partial<Record<keyof Viewer, unknown>>;
  const valid = typeof viewer.id === "string" && typeof viewer.displayName === "string" && typeof viewer.email === "string"
    && typeof viewer.contactVerified === "boolean" && typeof viewer.identityVerified === "boolean" && typeof viewer.termsAccepted === "boolean"
    && (countryCodes as readonly unknown[]).includes(viewer.country);
  if (!valid) return null;
  return { ...(viewer as Viewer), notifications: parseNotifications(viewer.notifications), company: parseCompany(viewer.company) };
}

function parseNotifications(value: unknown): NotificationPreferences {
  if (!value || typeof value !== "object") return defaultNotificationPreferences;
  const stored = value as Partial<Record<string, unknown>>;
  return Object.fromEntries(notificationTopics.map((topic) => [topic, typeof stored[topic] === "boolean" ? stored[topic] : defaultNotificationPreferences[topic]])) as NotificationPreferences;
}

function parseCompany(value: unknown): CompanyDetails | null {
  if (!value || typeof value !== "object") return null;
  const { name, vatNumber } = value as Partial<Record<keyof CompanyDetails, unknown>>;
  return typeof name === "string" && typeof vatNumber === "string" ? { name, vatNumber } : null;
}
