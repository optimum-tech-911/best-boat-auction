import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { Backend, Viewer } from "@bba/contracts";
import { createDemoBackend, type DemoScenario } from "@bba/sdk";
import { DEMO_CLOCK_COOKIE, DEMO_VIEWER_COOKIE, parseDemoClock, parseDemoViewer } from "./demo-session";

export interface RequestContext {
  backend: Backend;
  /** The demonstration time this request renders at. */
  now: number;
  /** Demonstration clock offset from the real time; zero outside preview scenarios. */
  clockOffsetMs: number;
  scenario: DemoScenario | null;
  viewer: Viewer | null;
}

/**
 * The backend for the current request, created once per request. This is the seam where the
 * Supabase adapter replaces the in-memory demonstration: pages only see the Backend contract.
 */
export const getRequestContext = cache(async (): Promise<RequestContext> => {
  const jar = await cookies();
  const clock = parseDemoClock(jar.get(DEMO_CLOCK_COOKIE)?.value);
  const viewer = parseDemoViewer(jar.get(DEMO_VIEWER_COOKIE)?.value);
  const clockOffsetMs = clock?.offsetMs ?? 0;
  const now = Date.now() + clockOffsetMs;
  return { backend: createDemoBackend({ now, viewer }), now, clockOffsetMs, scenario: clock?.scenario ?? null, viewer };
});
