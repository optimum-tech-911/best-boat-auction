import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// The demo renders per request; it does not need an external ISR cache or database.
export default defineCloudflareConfig();
