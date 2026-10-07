# Cloudflare deployment

This project is a Next.js 16 pnpm monorepo. The Vite/React preset is incompatible: the Next.js build succeeds, then Pages fails because it expects a `dist` directory. The application uses dynamic pages, cookies, localized rewrites and `/api/demo`; uploading `.next` or exporting static HTML would not preserve those features.

Use a **Cloudflare Workers** project with the manually configured OpenNext adapter. The existing Next.js framework, page content, demo rules and original image files are retained. Do not run a framework migration or the Vite auto-configuration wizard.

## Dashboard settings

Create a Worker application, connect the same Git repository and select the branch containing these deployment files. Use a custom configuration if the wizard asks for a framework.

| Setting | Value |
| --- | --- |
| Worker name | `best-boat-auction` |
| Root directory | Repository root (leave blank, or `/` where required) |
| Build command | `pnpm build:cloudflare` |
| Deploy command | `pnpm deploy:cloudflare` |
| Node version, build variable | `NODE_VERSION=22` |
| pnpm version, build variable | `PNPM_VERSION=11.25.0` |
| Public site origin, build variable | `NEXT_PUBLIC_SITE_URL=https://<your-final-domain-or-worker-hostname>` |

There is no Pages `dist` output setting for this deployment. Wrangler reads `apps/web/wrangler.jsonc`, whose Worker entry point is `.open-next/worker.js` and asset folder is `.open-next/assets`. Both paths are relative to `apps/web`, where the delegated package scripts run.

The Worker name and `WORKER_SELF_REFERENCE` service name must match. If choosing another Worker name, change both fields in the configuration before building. Set the public site origin to the real HTTPS origin so social links and sharing images use the deployed hostname. Do not set `NODE_ENV=production` during dependency installation: the build requires development tools.

Publish the changed configuration files, package manifests and lockfile to the connected repository before starting its build. The old failed Pages project can stay in place while the Worker is verified. Connect any custom domain to the working Worker afterward.

## Local commands

```sh
pnpm install --frozen-lockfile
pnpm build:cloudflare
pnpm preview:cloudflare --port 8788 --ip 127.0.0.1
```

The preview runs the built app in Cloudflare's local Worker runtime. Ordinary `pnpm dev`, `pnpm build` and `pnpm start` continue to use Next.js.

Stop a running development server before installing or changing dependencies, then restart `pnpm dev`. pnpm can change the resolved Next.js package path when deployment tools are added, even with the same Next.js version; an already-running Turbopack process can retain stale module paths. If an existing browser tab still shows the development error after restarting, hard-refresh that tab (`Cmd+Shift+R` on macOS). This does not clear saved demonstration bids or favourites.

To publish manually from an authenticated terminal:

```sh
pnpm --filter @bba/web exec wrangler login
pnpm build:cloudflare
pnpm deploy:cloudflare
```

The deploy command publishes an already-built Worker; run the Cloudflare build first. Workers Builds runs these as its separate build and deploy steps.

## Asset delivery

All existing files under `apps/web/public` are included unchanged in `.open-next/assets`, including photos, logos, favicons and MapLibre's map worker. `_headers` adds immutable caching only for versioned Next.js assets.

The configured adapter returns original public image files through `/_next/image` when the `IMAGES` binding is absent. These are the existing web-ready images; this setup requires neither an image-service subscription nor moving the photos to another storage provider. Optional Cloudflare Images optimization can be enabled later by adding an `IMAGES` binding, after reviewing that service's costs. Ordinary Node.js/Next.js previews keep their existing image optimization.

The sharing-image route reads the same original logo through the `ASSETS` binding on Workers and from the filesystem under normal Next.js. Its image composition, text, colours and source logo are unchanged.

## Verification

Deployment QA and the file-preservation comparison are recorded in `docs/design/CLOUDFLARE_QA.md`. Generated build, preview and preservation artifacts are ignored by Git.

References: [Cloudflare OpenNext setup](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/), [Workers build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [OpenNext image handling](https://opennext.js.org/cloudflare/howtos/image).
