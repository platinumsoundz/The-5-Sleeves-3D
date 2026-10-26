# The 5 Sleeves 3D — hosting and integration contract

Status: integration plan; no gameplay or save format changes.

## Canonical hosting roles

- Primary static prototype candidate: Cloudflare Pages, project `the-5-sleeves-3d`, stable URL `https://the-5-sleeves-3d.pages.dev/`.
- Existing known-good fallback/reference: the current GitHack URL maintained by the project owner. Keep it until Cloudflare Pages passes automated browser smoke checks and a later owner device pass.
- Do not use the old `the-5-sleeves-3d-online` Worker as the static asset host unless a concrete Worker-only requirement is identified. A Worker build is not required just to serve this static browser app.
- Source of truth: Git repository. The Cloudflare Pages project tracks `main`; preview branches should be used to verify changes before merging.

## Runtime boundaries

- The browser game owns its Three.js render loop, input, local story, progression and local save slots.
- `src/multiplayer.js` is transport-agnostic state scaffolding, not a live network transport. Do not present multiplayer as online-ready until a real authenticated server adapter exists.
- The PWA service worker caches the app shell and pinned Three.js module. Verify cache paths and cache invalidation in CI; a successful Pages deployment alone does not certify offline behaviour.
- No private credentials belong in the browser bundle. Any future online endpoint must validate identity, payloads and permissions server-side.

## Sanctuary integration contract

Sanctuary may link to this game as an external web app. Launching the game must not imply that Sanctuary authentication, wallet, cloud saves, or entitlements are shared with it.

Future integration should use a versioned HTTPS API contract, for example `/api/v1/game-session`, with short-lived scoped launch tokens, strict origin allowlists, expiry and replay protection. Never pass Supabase service-role keys, Stripe secrets, or durable session tokens in query strings or local storage. Do not implement this placeholder endpoint until the Sanctuary identity/session design is approved and a server-side verifier exists.

## Compatibility requirements

1. Preserve the existing standalone URL and local-save behaviour.
2. Keep game assets and module paths relative to the deployed root; avoid host-specific absolute paths.
3. Use a documented environment/config switch for any future API origin. Default to offline/local mode when absent.
4. Treat 2D and 3D saves as different schemas. No automatic save conversion or shared progression without a versioned migration design.
5. Keep multiplayer, account sync and payments disabled until end-to-end tests exist.

## Automated release checklist

- [ ] `npm test` passes on the exact commit being deployed.
- [ ] `index.html`, `manifest.webmanifest`, `sw.js`, icons and all imported `src/*.js` modules return successfully.
- [ ] Browser smoke test confirms WebGL startup and no uncaught module errors.
- [ ] PWA scope, start URL, cache paths and version invalidation are correct on both stable and preview URLs.
- [ ] Local save recovery/migration tests pass.
- [ ] Hosting status is linked from Sanctuary with a clear prototype label.
- [ ] Human mobile performance and touch-layout sign-off remains a release gate; CI cannot substitute for it.

## Explicit non-goals

This document does not promise cross-game identity, shared saves, multiplayer, payments, or a merged game world. Those require implementation and security review, not just links between sites.
