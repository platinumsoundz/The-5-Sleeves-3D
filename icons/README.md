# PWA icons

These are temporary generated placeholders. Replace them with approved artwork before release.

## Files the app expects

- `icons/icon-192.png` — 192×192 PNG, any-purpose Android/desktop icon.
- `icons/icon-512.png` — 512×512 PNG, high-resolution install icon.
- `icons/icon-maskable-512.png` — 512×512 PNG, maskable Android icon with the logo inside the central safe zone.
- `icons/apple-touch-icon.png` — 180×180 PNG, iPhone/iPad home-screen icon.
- `icons/favicon-32.png` — 32×32 PNG browser tab icon.

## Custom artwork handoff

Provide **one square PNG at 1024×1024 or larger**, preferably with no rounded corners (Android and iOS apply their own masks). Place the source at:

`icons/source/app-icon.png`

The five runtime files above can then be regenerated/cropped from that source. Keep the same filenames so `manifest.webmanifest`, `index.html`, and `sw.js` keep working.
