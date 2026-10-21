# Chapter 3 — Technical plan

## Current files
- `index.html`: page shell and HUD.
- `src/main.js`: system composition and animation loop.
- `src/input.js`: normalized keyboard/gamepad/touch actions, input-type labels, and device-specific hints.
- `src/world.js`: Three.js scene, procedural placeholder fighters, arena and camera.
- `src/game.js`: orchestrator for tutorial, movement, strikes, rounds and match end.
- `src/fighter.js`: shared nonlethal HP, knockdown and recovery rules.
- `src/combat.js`: attack cooldown, swing arc and dodge window.
- `src/ai.js`: Sensei state machine (approach, wind-up, strike, recover).
- `src/match.js`: knockdown scoring and winner.
- `src/hud.js`: all DOM writes for the HUD.
- `src/events.js`: synchronous pub/sub used to decouple gameplay from presentation.
- `src/config.js`: editable gameplay tuning values.
- `src/styles.css`: responsive UI.
- `tests/game.test.mjs`: 25 headless checks across rules, AI, scoring, rounds, restart and shell wiring.
- `package.json`: ESM marker plus `npm test` (`node --test`); no dependencies, nothing to install.

## Design boundaries
Gameplay consumes named actions, not raw device codes. World owns render objects; game rules should not construct scenery. Damage, knockdown and recovery live in `fighter.js`, timing in `combat.js`, Sensei decisions in `ai.js`, scoring in `match.js`; `game.js` wires them together and `hud.js` is the only module that touches the DOM. Keep XP/currency in future progression modules, and Cipher abilities behind a future ability interface. Do not create empty modules before a feature is needed. Keep `Game` runnable without a renderer by passing in world/input/ui objects; the headless tests rely on that.

## Workflow/performance
Develop on Samsung S23+ in Acode; test Samsung Internet, Chrome, and Brave. Serve over HTTP because JavaScript modules require it; Three.js loads from jsDelivr, so initial load requires internet. Procedural primitives only. Keep geometry, draw calls, shadows, and pixel ratio modest. 30 FPS is a goal, not yet measured. Run `npm test` first: it checks the rules without a browser, but cannot cover camera, layout, touch, gamepad or frame rate.

## Immediate test checklist
Run `npm test` (25 headless rules checks) before the device pass. Then open on phone; confirm module/CDN loading and WebGL; tutorial progression and skip; movement, staff attack, aim hold, dodge, jump, sprint and crouch; Sensei remains passive before spar; Sensei telegraphs before striking; hits, knockdown, confirm-to-rise and Sensei recovery; score readout and round reset after a knockdown; first to 3 ends the spar with a result; touch controls on touch devices; keyboard/mouse prompts on desktop; clicking swings but dragging orbits; Xbox/PlayStation/generic gamepad labels and mappings; rotate/resize screen; check frame rate and console errors. Browser test has not yet been performed.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
