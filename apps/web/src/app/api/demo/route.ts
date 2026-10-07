import { NextResponse, type NextRequest } from "next/server";
import { demoLotCount, isDemoScenario, scenarioOffset } from "@bba/sdk";
import { DEMO_CLOCK_COOKIE, encodeCookie } from "@/lib/demo-session";

/**
 * Preview control: moves the demonstration clock to a scenario of the sale, or back to the
 * real time with `scenario=real`, then returns to the page it came from.
 */
export function GET(request: NextRequest) {
  const scenario = request.nextUrl.searchParams.get("scenario");
  const back = request.nextUrl.searchParams.get("redirect") ?? "/";
  const target = new URL(back.startsWith("/") && !back.startsWith("//") ? back : "/", request.nextUrl.origin);
  const response = NextResponse.redirect(target, 303);
  if (isDemoScenario(scenario)) {
    const offsetMs = scenarioOffset(scenario, Date.now(), demoLotCount);
    response.cookies.set(DEMO_CLOCK_COOKIE, encodeCookie({ scenario, offsetMs }), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 });
  } else {
    response.cookies.delete(DEMO_CLOCK_COOKIE);
  }
  return response;
}
