export { createDemoBackend, type DemoBackend, type DemoBackendOptions, type DemoSnapshot } from "./demo/backend";
export { demoScenarios, isDemoScenario, scenarioOffset, type DemoScenario } from "./demo/clock";
export { categoryImages, editorialImages, type EditorialImageName } from "./demo/data/media";
export type { ViewerCommand } from "./demo/house";

import { octoberBoats } from "./demo/data/october";

/** The number of lots in each demonstration sale, for the demonstration clock. */
export const demoLotCount = octoberBoats.length;
