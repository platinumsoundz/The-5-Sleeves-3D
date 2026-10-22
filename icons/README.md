# PWA icons

The custom source artwork is supplied at `icons/source/app-icon.png`. The five runtime files in
this folder are generated from that source and are no longer placeholders.

## Files the app expects

- `icons/icon-192.png` — 192×192 PNG, any-purpose Android/desktop icon.
- `icons/icon-512.png` — 512×512 PNG, high-resolution install icon.
- `icons/icon-maskable-512.png` — 512×512 PNG, maskable Android icon with the illustration inside
  the central safe area and the source's dark margin extended around it.
- `icons/apple-touch-icon.png` — 180×180 PNG, iPhone/iPad home-screen icon.
- `icons/favicon-32.png` — 32×32 PNG browser tab icon.

## Updating the artwork

Keep the source square PNG at 1024×1024 or larger at:

`icons/source/app-icon.png`

Regenerate all five runtime files from that source rather than replacing only one of them. Keep the
same filenames so `manifest.webmanifest`, `index.html` and `sw.js` keep working. Bump the `CACHE`
version in `sw.js` whenever the artwork changes so installed clients pick up the new icon set. The
current source is 1254×1254 RGB and the runtime exports were generated on 2026-10-22.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (runtime icon exports from owner source)
