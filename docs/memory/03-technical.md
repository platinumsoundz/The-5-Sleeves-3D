# Chapter 3 — Technical plan

## Current files
- `index.html`: page shell and HUD.
- `src/main.js`: system composition, frame loop, fps readout, visibility pause and feedback wiring.
- `src/input.js`: normalized keyboard/gamepad/touch actions, analog stick/right-stick look, mouse click-vs-drag, input-type labels and hints.
- `src/device.js`: pure touch-capability/standalone detection, including iPadOS desktop-UA handling.
- `src/controls.js`: pure deadzone/joystick/clamp math shared by the browser input layer and tests.
- `manifest.webmanifest`, `sw.js`, `icons/`: installable PWA metadata, app-shell/offline cache, owner-supplied source art and the five generated runtime icons.
- `icons/README.md`: exact runtime icon filenames and the `icons/source/app-icon.png` regeneration source.
- `src/settings.js`: sanitized sensitivity/invert-Y/quality/touch-layout settings with injectable storage.
- `src/bindings.js`: remappable keyboard/controller binding tables, sanitize/swap/persist helpers.
- `src/save.js`: versioned local save slot with sanitize/load/write/delete and injectable storage.
- `src/devcodes.js`: developer/cheat code registry; effects are pure save transforms.
- `src/radar.js`: pure world-to-radar projection (forward-up, rim clamping).
- `src/resources.js`: clamped regenerating resource used for stamina (the sleeve meter is display-only and appears only with the test sleeve).
- `src/log.js`: bounded HUD event feed (newest entries kept).
- `src/world.js`: Three.js scene composition, training/wilderness camera zones, lighting, yaw/pitch orbit camera, fixed over-the-shoulder aim camera, drag look, feedback tints/pulses, raider presentation and character shadows.
- `src/scenery.js`: procedural settlement set dressing (fence/gate, workshop, house, awning, water, solar, fan, laundry, props, trees, distant structures) plus the wilderness track, scrub, boundary posts, rocks, dead trees and the enemy-outpost silhouette; publishes solid circle/rotated-box colliders for reachable props and returns the outpost position; canvas ground/sky textures and ambient animation.
- `src/collision.js`: pure circle-vs-circle and circle-vs-rotated-box resolution with a small multi-pass settle loop; shared by player, Sensei and raider movement.
- `src/story.js`: data-driven five-page offline introduction and a small `StoryDeck` controller (page/count/isLast/next/reset).
- `src/characters.js`: low-poly Ajaye/Sensei/raider models with articulated hips/knees and shoulders/elbows, clothing/hair, staff/katana and left-arm test-sleeve meshes, simple faces and whole-body tint support. Static pieces are batched per limb section; the staff/katana are mounted at the right hand through a compensating grip group.
- `src/game.js`: orchestrator for tutorial, movement, collision-constrained knockback, weapons, strikes, gate/zone transitions, outpost trigger, raider encounters, rounds and match end. Accepts an optional `requestStart` hook so the browser can open the story before a new run.
- `src/fighter.js`: shared nonlethal HP, knockdown and recovery rules.
- `src/combat.js`: per-weapon attack cooldown, attack progress/swing arc and dodge window.
- `src/weapons.js`: loadout order, dynamic staff stats, katana/unarmed stats and the test-sleeve entry.
- `src/quests.js`: pure quest catalogue, one-active quest log, objective targets, completion checks, legacy quest-ID migration and save snapshots.
- `src/worldmap.js`: data-driven world bounds, regions, points of interest and map projection.
- `src/ai.js`: Sensei/raider state machine (approach, wind-up, strike, recover).
- `src/match.js`: knockdown scoring and winner.
- `src/hud.js`: all gameplay DOM writes for the HUD, radar, quest pointer and menu-map markers.
- `src/events.js`: synchronous pub/sub used to decouple gameplay from presentation.
- `src/config.js`: editable gameplay tuning values.
- `src/styles.css`: responsive UI.
- `tests/game.test.mjs`: Game/rules checks across defense, AI, scoring, rounds, weapons, unarmed combo, gate/wilderness transitions, raider knockdowns, wilderness strikes against the player, quest selection/completion, menu screens, save/resume, stamina, settings, control math, bindings and shell wiring.
- `tests/systems.test.mjs`: pure checks for saves, quests, world-map projection, device detection, PWA manifest/icons, dev codes, bindings, event feed, radar and resources.
- Current total: 89 headless checks.
- `package.json`: ESM marker plus `npm test` (`node --test`); no dependencies, nothing to install.

## Design boundaries
Gameplay consumes named actions plus an analog `move()` vector, not raw device codes or touch coordinates. Deadzone/joystick math lives in `controls.js` so it is testable without a browser. World owns render objects and the camera; game rules should not construct scenery or touch the camera. Damage, knockdown and recovery live in `fighter.js`, timing in `combat.js`, Sensei decisions in `ai.js`, scoring in `match.js`, save/dev-code policy in `save.js`/`devcodes.js`; `game.js` wires them together. Progression, items, inventory, skills, raider vision/defence, scan and multiplayer client state live in their own pure modules. Gameplay HUD writes live in `hud.js`; menu-chrome mounting, binding-row construction, inventory/skill cards and live touch CSS variables live in `main.js` because they are browser-only shell concerns. Keep Cipher abilities behind a future approved ability interface; the current test scan is tactical presentation only. Do not create empty modules before a feature is needed. Keep `Game` runnable without a renderer by passing in world/input/ui objects; the headless tests rely on that.

The shell uses one `screen` field in `Game`: `title`, `menu`, `map` or `playing`. Only `playing` runs the simulation; title/menu/map keep rendering but freeze gameplay. Start/Enter opens the story introduction, then EXIT starts a new training session; Skip Story confirms and starts immediately. Resume restores a save; Settings on the title opens the Controls page and Back returns to the title. `Hud.sync` owns the title's `hidden` state, so the story overlay hides the title with `style.visibility` while open. In play, Start/Esc opens the menu, Select/Tab/M opens the map, and Select from the menu returns to the menu when the map closes. Saved binding/settings data lives in separate keys from the save slot so controls survive New Game.

## Workflow/performance
Develop on Samsung S23+ in Acode; test Samsung Internet, Chrome, Brave, Safari on iPhone/iPad and a paired controller. Serve over HTTPS (or localhost) because JavaScript modules, service workers and installation require it; Three.js loads from jsDelivr on the first visit and is pinned in the service-worker cache for later offline starts. Procedural primitives only. Keep geometry, draw calls, shadows, and pixel ratio modest. The owner reports successful browser/device tests with no frame drops after the 2026-10-22 visual pass. The HUD FPS readout reads `FPS · draws · tris` over a one-second window; draw calls and triangles describe scene complexity, while FPS changes as the scene moves. The weapons/wilderness/HUD/PWA and collision/story/title changes have not been browser- or device-rendered here. Run `npm test` first: it checks the rules without a browser, but cannot cover camera, layout, touch, gamepad, iPadOS UA behavior, installation, scenery composition, collision feel, story overlay sizing, raider readability or frame rate.

## Immediate test checklist
Run `npm test` (89 headless checks) before the device pass. Start with the title screen: only the game title and buttons should show; Start/Enter should open the story, NEXT should advance, the last page button should read EXIT, and SKIP STORY should show its confirmation before starting. Then check Start, greyed Resume with no save, title Settings and its Back return, disabled Multiplayer, and the INSTALL APP button when the browser offers it. Verify the manifest/icons in the browser application panel and install to the home screen on Android; on iPhone/iPad use Share → Add to Home Screen, then relaunch in standalone mode. Check that iPadOS shows the touch controls (not a PC layout) and that pairing a controller updates the input label only after a stick/button is used. Confirm the minimap is top-left and player-centred with a distinct gold marker, player health/stamina top-right, Sensei boss health top-centre below MENU, SKIP beside MENU, and the event feed visible under the minimap in both portrait and landscape. The FPS label should read `FPS · draws · tris`; checking SYSTEM explains it. Then continue: Check menu tabs and scrolling on a phone; CHARACTER/INVENTORY/SKILLS pages and real stat changes; QUESTS selection cards; MAP tab and full map with region/POI labels; Start/Esc menu and Select/Tab map; close paths. Save in SYSTEM, reload, confirm Resume is enabled and restores tutorial completion, dev grants and the active quest; delete the save and confirm Resume disables again. Apply each dev code and check the event feed/STATUS values. Remap a keyboard action and a controller button, confirm the displaced key/button still works, and reload to confirm persistence. Adjust touch size/opacity and left-hand mode, then reload. Check health/stamina bars, the hidden sleeve bar (visible and marked test only while the test sleeve is equipped), weapon chip, target name, north-up radar with rotating player heading and rim clamping, raider `?`/`!` dots, quest arrow/tracker and the event feed. Select each quest in turn, confirm only one card is TRACKED, confirm the cyan arrow/point moves to the objective or gate, and complete at least one quest; save and resume to confirm the completed/active state persists. Inspect the new settlement for prop clipping, fog/sky seams, character proportions, staff grip/swing, face/hair readability, shadow placement and draw-call frame rate. Then the spar: tutorial progression and skip; analog joystick speed and recentring; right-side drag look including vertical pitch; AIM + second-finger look; FIRE under the left thumb while aiming and the right STAFF hiding; reticle and aim zoom; guard tap vs direction-dodge vs timed parry; three blocked hits break the guard; jump, sprint (stamina drain) and crouch; Sensei passive before spar; wind-up warning; hits, knockback, knockdown, confirm-to-rise and Sensei recovery; score pips and round reset; first to 3 result; desktop LMB attack vs drag look, RMB aim, Shift sprint, Ctrl crouch, Q guard, F interact, `[`/`]` weapon cycle, Space jump, Enter confirm; gamepad D-pad left/right weapon cycle, left/right stick and labels; fps readout, resize, load-failure message; console errors. Then the new slice: D-pad `staff → katana → unarmed → cipher test sleeve`, katana mesh/attack, punch → kick → grab stagger, north-gate USE transition and return, wilderness camera, four raider encounters and enemy-outpost trigger. Walk the player into yard props and wilderness rocks/trees; confirm Sensei and raiders also stop or slide instead of passing through them, and that the outpost trigger fires from outside its solid footprint. Check raider alert `?`/`!`, auto-approach, block/parry/dodge and the absence of any player exclamation marker. Continue past the outpost and enter the tower through the south door; check the open chamber, five channels, dais/console, camera/fog, USE prompt and tower story. Confirm the link awards once, Cipher stays silent and no unapproved power appears. While aiming with the test Cipher sleeve, check the scan card (level, health, abilities, weaknesses, LIVE/CACHED), then switch to another weapon and confirm it disappears. Open INVENTORY/SKILLS, equip/remove gear, spend a point, close and reopen the menu, then save/resume and confirm all progression state persists in schema v2. Finally check the disabled multiplayer placeholders and confirm multiplayer is not part of story mode. The owner tested the 2026-10-22 visual pass with no frame drops; the progression/gear, enemy-vision/defence, tower, scan, north-up minimap and tower-story passes still need a device pass, and touch layout remains deferred.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (settlement/character visual pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (performance readout)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated limbs and menu stability)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (planted feet, hand-mounted staff, over-the-shoulder aim)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice; test-only sleeve)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (HUD/PWA/device detection follow-up)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (solid scenery, enemy outpost rename, story introduction)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (runtime icon exports from owner source)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (progression, gear, enemy vision/defence, First Tower, scan, north-up minimap, multiplayer scaffolding; 89 checks)
