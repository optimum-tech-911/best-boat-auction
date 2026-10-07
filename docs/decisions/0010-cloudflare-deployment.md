# Preserve Next.js and deploy through Cloudflare Workers

2026-10-07. The user attempted deployment using Cloudflare Pages' Vite/React preset and asked for an immediate fix preserving all website information and images. The screenshot shows a successful Next.js build followed by `Output directory "dist" not found`.

Add the OpenNext Cloudflare adapter and Wrangler, pinned to versions compatible with the current Next.js 16.3.8. Keep the framework and ordinary development/build scripts. Separate scripts prepare, preview and deploy a Worker; the existing Pages preset is not reused. No static export, framework migration, business-rule change or source-image replacement is authorized by this deployment fix.

All existing public assets are copied to the Worker asset bundle unchanged. Leave the optional paid Images binding absent: the adapter serves existing public image files when it cannot transform them. The sharing-image route needs one runtime adaptation because Cloudflare has no original local `public/brand` filesystem; use its `ASSETS` binding there and retain the Node.js filesystem fallback. The rendered content and source logo remain unchanged.

The design-token scan excludes only the new generated `.open-next` and `.wrangler` directories, alongside its existing build-output exclusions. Its checks on authored source remain unchanged. pnpm permits the required esbuild/workerd platform-binary setup scripts. Generated Worker files and local runtime state are ignored by Git.

Build settings and commands are in `docs/CLOUDFLARE_DEPLOYMENT.md`. Website/domain publication still requires the user's Cloudflare account or its connected repository build. No production integrations or credentials are introduced.
