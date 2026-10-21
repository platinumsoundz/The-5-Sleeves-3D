# Chapter 3 — Technical plan

## Current files
- `index.html`: page shell and HUD.
- `src/main.js`: system composition, frame loop, fps readout, visibility pause and feedback wiring.
- `src/input.js`: normalized keyboard/gamepad/touch actions, analog stick/right-stick look, mouse click-vs-drag, input-type labels and hints.
- `src/controls.js`: pure deadzone/joystick/clamp math shared by the browser input layer and tests.
- `src/settings.js`: sanitized sensitivity/invert-Y/quality settings with injectable storage.
- `src/world.js`: Three.js scene, procedural placeholder fighters, arena, yaw/pitch orbit camera, aim zoom, drag look, feedback tints and pulses.
- `src/game.js`: orchestrator for tutorial, movement, strikes, rounds and match end.
- `src/fighter.js`: shared nonlethal HP, knockdown and recovery rules.
- `src/combat.js`: attack cooldown, swing arc and dodge window.
- `src/ai.js`: Sensei state machine (approach, wind-up, strike, recover).
- `src/match.js`: knockdown scoring and winner.
- `src/hud.js`: all DOM writes for the HUD.
- `src/events.js`: synchronous pub/sub used to decouple gameplay from presentation.
- `src/config.js`: editable gameplay tuning values.
- `src/styles.css`: responsive UI.
- `tests/game.test.mjs`: 43 headless checks across rules, defense, AI, scoring, rounds, pause, restart, settings, control math, PC bindings and shell wiring.
- `package.json`: ESM marker plus `npm test` (`node --test`); no dependencies, nothing to install.

## Design boundaries
Gameplay consumes named actions plus an analog `move()` vector, not raw device codes or touch coordinates. Deadzone/joystick math lives in `controls.js` so it is testable without a browser. World owns render objects and the camera; game rules should not construct scenery or touch the camera. Damage, knockdown and recovery live in `fighter.js`, timing in `combat.js`, Sensei decisions in `ai.js`, scoring in `match.js`; `game.js` wires them together and `hud.js` is the only module that touches the DOM. Keep XP/currency in future progression modules, and Cipher abilities behind a future ability interface. Do not create empty modules before a feature is needed. Keep `Game` runnable without a renderer by passing in world/input/ui objects; the headless tests rely on that.

## Workflow/performance
Develop on Samsung S23+ in Acode; test Samsung Internet, Chrome, and Brave. Serve over HTTP because JavaScript modules require it; Three.js loads from jsDelivr, so initial load requires internet. Procedural primitives only. Keep geometry, draw calls, shadows, and pixel ratio modest. 30 FPS is a goal, not yet measured. Run `npm test` first: it checks the rules without a browser, but cannot cover camera, layout, touch, gamepad or frame rate.

## Immediate test checklist
Run `npm test` (43 headless rules checks) before the device pass. Check MENU/Esc pause, resume, sensitivity, invert-Y and each quality level, and that settings survive a reload. Then open on phone; confirm module/CDN loading and WebGL; tutorial progression and skip; analog joystick speed and recentring; right-side drag look including vertical pitch; AIM + second-finger look; FIRE appearing under the left thumb while aiming and the right STAFF hiding; reticle and aim zoom; guard tap vs direction-dodge vs timed parry; three blocked hits break the guard; jump, sprint and crouch; Sensei passive before spar; wind-up warning; hits, knockback, knockdown, confirm-to-rise and Sensei recovery; score pips and round reset; first to 3 result; desktop LMB attack vs drag look, RMB aim, Shift sprint, Ctrl crouch, Q guard, F interact, Space jump, Enter confirm; gamepad left/right stick and labels; fps readout, resize, load-failure message; console errors. Browser test has not yet been performed.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
