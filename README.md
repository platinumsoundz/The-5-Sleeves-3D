# The 5 Sleeves — Training Ground

Serve over HTTP and open localhost:8000. Requires WebGL and Three.js CDN. This is a procedural village mechanics whitebox.

Keyboard/mouse: WASD/arrows move, J or left-click staff attack, Space jump, K guard (tap to block, add a direction to dodge, time it just before impact to parry), Shift sprint, Ctrl crouch, hold E or right-click to aim/lock, Enter confirm/get up; drag the scene to orbit. Standard gamepad: left stick move, LT aim/lock, RT staff attack, A jump/get up, B guard (with a direction dodges, timed parry), X interact/confirm, L3 sprint, R3 crouch. Touch prompts/buttons appear on touch devices; on-screen actions and drag-to-look are supported. Tutorial guides movement, staff attack, lock-on, and guard/dodge/parry and can be skipped. Sensei is passive until spar, then telegraphs with a HUD "!" before striking. Both fighters can be knocked down and recover; a downed player must confirm to get up. Knockdowns score and the first to 3 takes the spar; three blocked hits in a row break the guard. Restart practice appears after tutorial. XP/currency and Cipher powers are deferred. Browser testing has not been performed. Run `npm test` for the 35 headless rules checks. See docs, including AI provenance in `docs/memory/04-ai-collaboration.md` and the build log in `docs/ai-build-log.md`.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
