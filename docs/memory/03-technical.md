# Chapter 3 — Technical plan

## Current files
- `index.html`: page shell and HUD.
- `src/main.js`: system composition, frame loop, fps readout, visibility pause and feedback wiring.
- `src/input.js`: normalized keyboard/gamepad/touch actions, analog stick/right-stick look, mouse click-vs-drag, input-type labels and hints.
- `src/controls.js`: pure deadzone/joystick/clamp math shared by the browser input layer and tests.
- `src/settings.js`: sanitized sensitivity/invert-Y/quality/touch-layout settings with injectable storage.
- `src/bindings.js`: remappable keyboard/controller binding tables, sanitize/swap/persist helpers.
- `src/save.js`: versioned local save slot with sanitize/load/write/delete and injectable storage.
- `src/devcodes.js`: developer/cheat code registry; effects are pure save transforms.
- `src/radar.js`: pure world-to-radar projection (forward-up, rim clamping).
- `src/resources.js`: clamped regenerating resource used for stamina (the sleeve meter is display-only and appears only with the test sleeve).
- `src/log.js`: bounded HUD event feed (newest entries kept).
- `src/world.js`: Three.js scene composition, training/wilderness camera zones, lighting, yaw/pitch orbit camera, fixed over-the-shoulder aim camera, drag look, feedback tints/pulses, raider presentation and character shadows.
- `src/scenery.js`: procedural settlement set dressing (fence/gate, workshop, house, awning, water, solar, fan, laundry, props, trees, distant structures) plus the wilderness track, scrub, boundary posts and first-tower silhouette; canvas ground/sky textures and ambient animation.
- `src/characters.js`: low-poly Ajaye/Sensei/raider models with articulated hips/knees and shoulders/elbows, clothing/hair, staff/katana and left-arm test-sleeve meshes, simple faces and whole-body tint support. Static pieces are batched per limb section; the staff/katana are mounted at the right hand through a compensating grip group.
- `src/game.js`: orchestrator for tutorial, movement, weapons, strikes, gate/zone transitions, raider encounters, rounds and match end.
- `src/fighter.js`: shared nonlethal HP, knockdown and recovery rules.
- `src/combat.js`: per-weapon attack cooldown, attack progress/swing arc and dodge window.
- `src/weapons.js`: loadout order, dynamic staff stats, katana/unarmed stats and the test-sleeve entry.
- `src/ai.js`: Sensei/raider state machine (approach, wind-up, strike, recover).
- `src/match.js`: knockdown scoring and winner.
- `src/hud.js`: all DOM writes for the HUD.
- `src/events.js`: synchronous pub/sub used to decouple gameplay from presentation.
- `src/config.js`: editable gameplay tuning values.
- `src/styles.css`: responsive UI.
- `tests/game.test.mjs`: Game/rules checks across defense, AI, scoring, rounds, weapons, unarmed combo, gate/wilderness transitions, raider knockdowns, menu screens, save/resume, stamina, settings, control math, bindings and shell wiring.
- `tests/systems.test.mjs`: pure checks for saves, dev codes, bindings, event feed, radar and resources.
- Current total: 58 headless checks.
- `package.json`: ESM marker plus `npm test` (`node --test`); no dependencies, nothing to install.

## Design boundaries
Gameplay consumes named actions plus an analog `move()` vector, not raw device codes or touch coordinates. Deadzone/joystick math lives in `controls.js` so it is testable without a browser. World owns render objects and the camera; game rules should not construct scenery or touch the camera. Damage, knockdown and recovery live in `fighter.js`, timing in `combat.js`, Sensei decisions in `ai.js`, scoring in `match.js`, save/dev-code policy in `save.js`/`devcodes.js`; `game.js` wires them together. Gameplay HUD writes live in `hud.js`; menu-chrome mounting, binding-row construction and live touch CSS variables live in `main.js` because they are browser-only shell concerns. Keep XP/currency in future progression modules, and Cipher abilities behind a future ability interface. Do not create empty modules before a feature is needed. Keep `Game` runnable without a renderer by passing in world/input/ui objects; the headless tests rely on that.

The shell uses one `screen` field in `Game`: `title`, `menu`, `map` or `playing`. Only `playing` runs the simulation; title/menu/map keep rendering but freeze gameplay. Start/Enter begins a new training session from the title; Resume restores a save; Settings on the title opens the Controls page and Back returns to the title. In play, Start/Esc opens the menu, Select/Tab/M opens the map, and Select from the menu returns to the menu when the map closes. Saved binding/settings data lives in separate keys from the save slot so controls survive New Game.

## Workflow/performance
Develop on Samsung S23+ in Acode; test Samsung Internet, Chrome, and Brave. Serve over HTTP because JavaScript modules require it; Three.js loads from jsDelivr, so initial load requires internet. Procedural primitives only. Keep geometry, draw calls, shadows, and pixel ratio modest. The owner reports successful browser/device tests with no frame drops after the 2026-10-22 visual pass. The HUD FPS readout also reports draw calls and triangles. The weapons/wilderness slice adds four raider roots, more scenery and new weapon meshes; it has not been browser- or device-rendered here. Run `npm test` first: it checks the rules without a browser, but cannot cover camera, layout, touch, gamepad, scenery composition, raider readability or frame rate.

## Immediate test checklist
Run `npm test` (58 headless checks) before the device pass. Start with the title screen: Start, greyed Resume with no save, title Settings and its Back return, disabled Multiplayer. Check menu tabs and scrolling on a phone; STATUS/GEAR/SKILLS placeholders; MAP tab and full map; Start/Esc menu and Select/Tab map; close paths. Save in SYSTEM, reload, confirm Resume is enabled and restores tutorial completion plus dev grants; delete the save and confirm Resume disables again. Apply each dev code and check the event feed/STATUS values. Remap a keyboard action and a controller button, confirm the displaced key/button still works, and reload to confirm persistence. Adjust touch size/opacity and left-hand mode, then reload. Check health/stamina bars, the hidden sleeve bar (visible and marked test only while the test sleeve is equipped), weapon chip, target name, radar rotation/clamping, raider dots and the event feed. Inspect the new settlement for prop clipping, fog/sky seams, character proportions, staff grip/swing, face/hair readability, shadow placement and draw-call frame rate. Then the spar: tutorial progression and skip; analog joystick speed and recentring; right-side drag look including vertical pitch; AIM + second-finger look; FIRE under the left thumb while aiming and the right STAFF hiding; reticle and aim zoom; guard tap vs direction-dodge vs timed parry; three blocked hits break the guard; jump, sprint (stamina drain) and crouch; Sensei passive before spar; wind-up warning; hits, knockback, knockdown, confirm-to-rise and Sensei recovery; score pips and round reset; first to 3 result; desktop LMB attack vs drag look, RMB aim, Shift sprint, Ctrl crouch, Q guard, F interact, `[`/`]` weapon cycle, Space jump, Enter confirm; gamepad D-pad left/right weapon cycle, left/right stick and labels; fps readout, resize, load-failure message; console errors. Then the new slice: D-pad `staff → katana → unarmed → cipher test sleeve`, katana mesh/attack, punch → kick → grab stagger, north-gate USE transition and return, wilderness camera, four raider encounters and tower trigger. The owner tested the 2026-10-22 visual pass with no frame drops; the feet/staff/aim follow-up and weapons/wilderness/raider pass still need a device pass, and touch layout remains deferred.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (settlement/character visual pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (performance readout)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated limbs and menu stability)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (planted feet, hand-mounted staff, over-the-shoulder aim)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice; test-only sleeve)
