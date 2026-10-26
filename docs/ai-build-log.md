# AI build log

Append-only. One entry per session that changes behavior. Format: date, model, scope, files,
tests, gaps, notes for the next model. See [memory/04-ai-collaboration.md](memory/04-ai-collaboration.md)
for the signature and review rules.

## 2026-10-21 — opencode/deepseek-v4.1-flash-free

**Scope:** owner asked to keep building without a device test and to add AI provenance rules.
Started the core systems pass and fixed four bugs found in the first read-through.

**Bugs fixed**

- Jump arc was damped by the idle settle; physics now owns `y` while airborne.
- Restart left knocked-down fighters lying on the floor; poses, jump velocity and queued
  presses are now cleared.
- A left-click camera drag also swung the staff; attack now fires on click-release, and only
  when the pointer moved under 6px.
- Sensei's health bar snapped back to full on knockdown; it now reads 0 until recovery.
- Dodge direction fell back to facing when one axis was legitimately 0; fixed.
- `main.js` did not pass the new `#score` element to the HUD; caught by a new shell-wiring test.

**Core systems added**

| File | Purpose |
| --- | --- |
| `src/events.js` | synchronous pub/sub for gameplay → UI/audio |
| `src/fighter.js` | shared nonlethal HP, knockdown and recovery rules |
| `src/combat.js` | attack cooldown, swing arc, dodge window and direction |
| `src/ai.js` | Sensei state machine: approach → wind-up → strike → recover |
| `src/match.js` | knockdown scoring, first to N, winner |
| `src/hud.js` | every DOM write, injected elements, no queries |
| `src/game.js` | orchestrator rewritten around the modules above |

Also: score readout in `index.html`/`styles.css`, `package.json` (ESM + `npm test`),
25 headless checks in `tests/game.test.mjs`.

**Verification:** `npm test` → 25/25, stable across 5 consecutive runs. `node --check` clean on
all `src/*.js`. Regression check: restoring the pre-fix `game.js` failed exactly the three
targeted tests.

**Not verified:** anything needing a browser — WebGL/CDN load, layout, camera feel, touch
controls, gamepad mapping, frame rate on the S23+. Browser testing still has not been performed.

**Provisional rules needing owner sign-off:** first to 3 knockdowns wins; 1.2s pause before
positions reset; Sensei wind-up 0.5s, reach 1.9, accuracy 0.8; crouch and dodge both avoid a
strike; a downed player must confirm before the next round starts.

**For the next model:** run `npm test` first. The `#score` element must exist in the shell or the
HUD silently skips it. The exact model ID for "ChatGPT-6 Luna" is still unconfirmed.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

## 2026-10-21 — opencode/deepseek-v4.1-flash-free (second pass)

**Scope:** owner asked for everything still buildable plus a single-button defense scheme: B alone
blocks, B with a direction dodges, a well-timed B parries.

**Defense**

- `combat.js` owns the parry window (0.2s), block pressure, guard break (3 hits in 3s, 0.9s stun).
- `game.js` decides on the guard press edge: direction → dodge, no direction → block + parry window.
- Blocking moves at 45% speed, passes 25% damage, and cannot attack.
- Parry negates the strike, clears block pressure and staggers Sensei for 1.1s.
- Crouch lost its accidental strike immunity; it is posture/mobility only.

**Feedback and feel**

- Knockback 0.22m on a landed strike; Sensei leans and tints amber during the wind-up; player
  tints and raises the staff while blocking; hit/parry/block produce short colour pulses.
- HUD "!" warning while Sensei winds up; score is now pips (`●●○ — ○○○`).
- Sensei punishes a whiffed swing within 3.1 units with a shortened 0.26s wind-up.

**Robustness**

- `index.html` reports CDN/module load failure and a 12s stuck-loading message.
- Frame loop skips updates while hidden; fps readout added; camera lerp is frame-rate independent.
- WebGL context-loss message.

**Verification:** `npm test` → 35/35, stable across repeated runs. Mutation checks: disabling the
parry branch, the direction-dodge branch, guard break, and whiff punish each fail at least one
test. One test initially measured the wrong wind-up timer (minimum instead of first frame) and was
corrected.

**Not verified:** every visual and input aspect listed in the first entry, plus the new tints,
warning placement, pips legibility, fps accuracy and load-failure path. No browser run has
happened yet.

**Tuning flagged for the device pass:** 25% blocked damage and a 3-hit guard break are placeholder
numbers; if blocking feels mandatory or useless, adjust `blockDamageScale`, `guardBreakHits` and
`senseiAccuracy` in `config.js` first.

**For the next model:** the `guard` action replaced `dodge`; any hint or test still using `dodge`
is stale. Defense numbers are provisional and need the owner's eye after the first browser test.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

## 2026-10-21 — opencode/deepseek-v4.1-flash-free (third pass)

**Scope:** owner asked for Call of Duty Mobile-style touch controls and a standard PC shooter
layout, and to keep building until the big playtest.

**Touch**

- New `#stick-zone` analog joystick bottom-left (120px base, 52px knob, deadzone, analog
  magnitude). Gameplay movement now consumes a `move()` vector; half tilt is half speed.
- The right 45% of the canvas is the look area: yaw and pitch, including a second finger while
  AIM is held. Buttons and the joystick capture their own pointers, so look/move/aim work together.
- AIM zooms FOV 55→42, pulls the camera 10→6.5 and shows a centre reticle; while aiming, the
  right STAFF button hides and `#fire` appears under the left thumb. All other buttons form a
  3×3 bottom-right cluster (aim, staff, jump, guard, crouch, run, use, confirm).

**PC**

- Standard mapping: LMB = RT attack (click vs drag preserved), RMB = LT aim/lock, Shift = L3
  sprint, Space = jump/get up, Ctrl = R3 crouch, F = interact, Q or K = guard, Enter = confirm.
  `E` no longer aims.
- Camera gained pitch; mouse drag orbits and pitches. Gamepad right stick feeds look through
  `input.consumeLook()` → `world.look()`; left stick is analog movement.

**Structure**

- New `src/controls.js`: pure `clamp`, `deadzone`, `joystick` helpers, unit-tested.
- `world.js` imports `CONFIG` for sensitivity/FOV/distance; it still owns all render objects.
- `game.js` remains DOM/THREE-free and now reads `input.move()` and exposes `aiming` to the HUD.

**Verification:** `npm test` → 40/40 (control math, PC bindings, analog speed, touch aim HUD,
plus all earlier rules). No new mutation runs this pass.

**Not verified:** everything visual/touch/gamepad, plus stick feel, look sensitivity, pitch
direction preference, aim zoom framing, FIRE placement and the 3×3 cluster on an S23+. No browser
run has happened yet.

**Tuning flagged:** `lookSensitivity`, `stickDeadzone`, `gamepadLookSpeed`, `fov`, `aimFov`,
`cameraDistance`, `aimCameraDistance` are first guesses. Pitch sign is set so drag down looks
down; if it feels inverted on the phone, flip the `pitch +=` sign in `world.look`.

**For the next model:** if touch look and joystick ever conflict, check that the joystick zone and
buttons keep pointer capture and that `world.js` only starts a look drag on the right 55% for
`pointerType === 'touch'`.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

## 2026-10-21 — opencode/deepseek-v4.1-flash-free (fourth pass)

**Scope:** playtest-readiness while the browser pass is still pending.

- **Gamepad look fix:** right-stick deltas were already scaled by `gamepadLookSpeed` and then
  multiplied again by `lookSensitivity`, making look ~100× too slow. `gamepadLookSpeed` is now
  420 px/s (the same unit as drag deltas), so full deflection ≈2.5 rad/s.
- **Pause/settings:** Esc or the MENU button freezes the simulation and opens a panel with look
  sensitivity (0.4–2×), invert-Y and graphics quality (pixel ratio 1 / ≤1.5 / ≤2.5). Resume
  unpauses; values persist under `five-sleeves.settings.v1` in local storage.
- **Held-button safety:** a button hidden while held (MENU, or STAFF while aiming) could leave its
  action stuck because its pointerup never landed. Pointer releases are now also caught on
  `window` and matched by `pointerId`.
- `settings.js` is pure and storage-injected; `world.setSettings`/`setQuality` apply it; `main.js`
  owns the form wiring.

**Verification:** `npm test` → 42/42, including new settings clamp/round-trip and pause/resume
checks. Syntax check clean. Not mutation-tested this pass.

**Not verified:** the panel layout, slider feel, invert direction, quality levels on an S23+,
local-storage persistence in a real browser, and whether MENU collides with skip/restart on small
screens. No browser run yet.

**Follow-up in the same session:** tutorial wording now follows the active device (touch sees
STAFF/AIM/GUARD, PC sees LMB/RMB/Q, gamepad sees RT/LT/B), and the touch controls respect phone
safe-area insets. Tests: 43/43.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

## 2026-10-21 — opencode/deepseek-v4.1-flash-free (shell, saves, remapping and HUD pass)

**Scope:** the title/menu shell and HUD slice requested by the owner, built without a device run.

- **Screens:** `Game.screen` is now `title | menu | map | playing`; only `playing` simulates.
  Title has Start, Resume (disabled until a valid save exists), Settings (opens the Controls page,
  Back returns to the title) and a visible disabled “Multiplayer · in development” button.
  Start/Esc opens the menu; Select/Tab/M or tapping the radar opens the map. Closing a map opened from the menu returns
  to the menu, not into the spar. The menu is the old `#settings` overlay rebuilt with CHARACTER,
  INVENTORY, SKILLS, MAP, SETTINGS and SYSTEM pages.
- **Save:** `src/save.js` writes `five-sleeves.save.v1` with tutorial completion, dev-granted
  XP/cash and permissions. SYSTEM can save/delete; boot enables Resume when a sanitized save
  exists. Settings, bindings and touch layout persist separately, so New Game does not erase controls.
- **Dev codes:** `src/devcodes.js` provides `DEV-XP-500`, `DEV-CASH-1000` and
  `DEV-GEAR-SLEEVE`. They only write placeholders/permissions and log to the event feed; no real
  economy, weapons or inventory exists yet. The input is in SYSTEM and returns success/failure text.
- **Remapping:** `src/bindings.js` holds keyboard/controller action tables. Controls page captures a
  key or controller button; a displaced binding is swapped back so the other action keeps an input.
  Input builds lookups from the tables instead of the old hard-coded `KEYS` map. Left/right sticks
  remain fixed. Touch reconfiguration is currently size, opacity and left-handed layout; per-button
  drag placement is not built.
- **HUD:** top-left health/stamina/sleeve bars, radar beneath (forward-up, rim-clamped), event feed
  beneath that; MENU top-centre with score below; Sensei health/phase top-right; fps/input labels.
  `src/log.js` is a bounded feed, `src/radar.js` is pure projection, and `src/resources.js` powers
  stamina. Stamina drains while sprinting and is spent by jump/dodge; low stamina blocks a dodge and
  falls back to guard. The sleeve meter is display-only because no ability exists.
- **Tuning:** stamina values are provisional in `config.js` (`maxStamina`, regen/delay, sprint/dodge/
  jump costs, `maxSleeve`).
- **Docs:** architecture, gameplay memory, technical memory and decision log updated; 30 FPS and the
  device checklist remain unverified.

**Verification:** `npm test` → 53/53 across two files; `node --check` clean for every `src/*.js`.
New headless coverage: save sanitize/round-trip/delete, dev codes, binding sanitize/swap/persist,
event-feed bounds, radar projection/clamping, resource regen, title/menu/map transitions, save/resume
restoration and stamina gating. Browser/WebGL/phone layout, remap capture, touch sliders, save
persistence across reload and the actual menu feel have **not** been verified. No browser run yet.

**Follow-ups:** device pass; check title/menu layout at 360×640 and landscape; check RMB aim and
touch look still work with the shell overlays; verify controller Start/Select mapping; decide whether
Resume should also restore the current spar score; add per-button touch drag placement after a phone
pass if size/opacity/handedness is insufficient.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

## 2026-10-21 — opencode/deepseek-v4.1-flash-free (test link)

- The prototype is static: `index.html` loads ES modules directly and three.js comes from jsDelivr,
  so there is no build step. GitHub Pages could not be enabled from this session's token (no Pages
  permission), and the token also lacks `workflow` scope, so a Pages workflow could not be pushed.
- Test link uses raw.githack's GitHub CDN with correct MIME types for HTML, CSS and JS:
  https://raw.githack.com/platinumsoundz/The-5-Sleeves-3D/main/index.html
- All `src/*.js`, `src/styles.css` and the three.js CDN URL were fetched successfully through that
  host. Browser rendering/touch behaviour is still not verified.
- `.nojekyll` remains for a future GitHub Pages enablement.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

## 2026-10-22 — opencode/deepseek-v4.1-flash-free (settlement/character visual pass)

**Scope:** owner reported the browser build smooth at 120 FPS with no issues beyond the deferred
touch-button layout, asked to hide the sleeve meter until the Cipher Sleeve is acquired, and asked
to finish the visual, character and scenery pass.

**Files:** `index.html`, `src/styles.css`, `src/config.js`, `src/game.js`, `src/hud.js`, `src/main.js`,
`src/world.js`, new `src/scenery.js` and `src/characters.js`, `src/resources.js` (comment),
`tests/systems.test.mjs`, `README.md`, `docs/architecture.md`, `docs/decision-log.md`,
`docs/memory/02-gameplay.md`, `docs/memory/03-technical.md`, `docs/memory/05-visual-style.md`,
`docs/roadmap.md`.

**Visuals and characters**

- Added `src/scenery.js`: a repaired settlement training yard with patched perimeter fence and gate,
  workshop, house with warm windows and chimney smoke, market awning, rain barrel/hand pump, solar
  array and battery, air-scrubber fan, laundry, crates/barrels/sacks, staff rack, trees, ring markers,
  a path, distant water tower/relay mast, procedural hills, canvas ground/sky textures, dust and a
  green-grey fogline. No shadow maps, post-processing or external art assets.
- Added `src/characters.js`: low-poly Ajaye and Sensei silhouettes with layered clothing, utility
  gear, hair, simple faces and a padded staff. Ajaye has **no Cipher Sleeve**, only wrapped forearms;
  Sensei has tied-back hair and facial hair. Both keep the old `root/body/stick` contract, support
  whole-body hit/wind-up/block tints and use idle breathing, guard staff angle and sensei wind-up
  animation.
- Rewrote `src/world.js` composition for the new modules, warm dawn/cool fill lighting, ACES tone
  mapping, atmospheric fog, canvas sky, contact character shadows and upper-body/staff presentation.
  `main.js` now passes the player swing angle into `setFeedback`.
- Updated title/menu/HUD palette and copy toward the charcoal/slate/rust/olive plus restrained amber
  language. Character/gear pages now say the Cipher Sleeve is not yet acquired. Touch layout was left
  untouched as requested.

**Sleeve gating**

- Removed `maxSleeve` and the runtime sleeve `Resource`; added `sleeveAcquired: false` presentation
  state. `#sleeve-vital` is hidden by default and `Hud.sync` keeps it hidden until `sleeveAcquired`.
  No replacement capacity, charge or ability was invented. Radar/feed were pulled up to close the
  gap left by the missing third bar.

**Verification:** `npm test` → 53/53; `node --check` clean on every `src/*.js` and test file. A
local Three.js smoke harness (not committed) built the scene with a stub canvas, exercised both
fighters and `update()`, then ran `createWorld`/`render()` with a stub renderer. Static-material
batching reduced scenery to 41 meshes/points and each fighter to 24/22 meshes, keeping the expected
draw-call budget low. The owner's 120 FPS browser report applies to the pre-visual build. The new
scenery/character pass has **not** been browser-rendered here; no claim is made about its frame
rate, composition, clipping, staff grip or character likeness.


**Test URL for this pass:** https://raw.githack.com/platinumsoundz/The-5-Sleeves-3D/c42ea07/index.html — the
commit-pinned path avoids raw.githack's `/main/` module cache, which was still serving the pre-pass
`world.js` at verification time. Use the pinned path until the branch cache refreshes.

**Gaps / next model:** run the new build on the S23+ and inspect fog/sky seams, prop clipping, character
proportions, staff grip during swing/block, contact shadows and draw-call cost. Touch-button layout
and per-button placement remain deferred. Reference sheets are still required before final likeness
and before any Cipher Sleeve mesh is added. Do not add Korb, Cipher, tower, module or energy content
to this scene without approval.

**Provenance note:** the owner-supplied ChatGPT canon/visual docs committed before this pass remain
unsigned and have no separate build-log entry; they are treated as owner-provided reference material.
This agent did not author or alter their canon claims.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22

## 2026-10-22 — opencode/deepseek-v4.1-flash-free (performance readout)

**Scope:** owner asked to keep building roadmap items while noting session token usage. Added a small performance QA aid for the pending device pass.

**Files:** `src/main.js`, `README.md`, `docs/memory/03-technical.md`, `docs/roadmap.md`.

**Change:** the existing top-right FPS label now appends renderer draw-call and triangle counts (`FPS · DC · K TRI`). This makes the owner's browser pass report a concrete draw-call/triangle budget alongside frame rate. No gameplay, camera, touch layout, materials or scene content changed.

**Verification:** `node --check src/main.js`; `npm test` → 53/53. Browser rendering remains unverified here.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (performance readout)

## 2026-10-22 — opencode/deepseek-v4.1-flash-free (articulated limbs and menu stability)

**Scope:** owner reported successful device/browser tests with no frame drops and asked for more structured character control — real bending limbs while attacking/crouching — plus stable menu tabs and general polish.

**Files:** `src/characters.js`, `src/world.js`, `src/game.js`, `src/main.js`, `src/styles.css`, `README.md`, `docs/architecture.md`, `docs/memory/02-gameplay.md`, `docs/memory/03-technical.md`, `docs/roadmap.md`.

**Change:**
- Added hip/knee pivots and retained shoulder/elbow groups; per-limb batching keeps the extra articulation cheap. The free arm, hips and knees now walk, counterbalance attacks and bend into a crouch. The staff arm remains stable so grip/guard swing stay readable.
- Crouch is now a presentation pose (arms/legs/lean) instead of squashing the whole gameplay root; movement/combat rules are unchanged.
- Player crouch state is pushed through `setFeedback({ crouching })`.
- Menu tabs use non-shrinking flex items and a non-shrinking tab strip, so the header stays stable while the menu body scrolls.
- Updated roadmap status from device-pending to owner-tested with no reported frame drops.

**Verification:** `node --check` clean; `npm test` → 53/53; local Three smoke checks built environment + both fighters, exercised `pose()` for crouch/walk and render. Browser visuals still need the owner’s eyes.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated limbs and menu stability)

## 2026-10-22 — opencode/deepseek-v4.1-flash-free (feet, staff grip and over-the-shoulder aim)

**Scope:** owner reported that feet looked detached during jumps, the staff did not read as held, weaponless combat should be considered, and held aim should become a fixed over-the-shoulder camera.

**Files:** `src/characters.js`, `src/world.js`, `src/config.js`, `README.md`, `docs/architecture.md`, `docs/memory/02-gameplay.md`, `docs/memory/03-technical.md`, `docs/roadmap.md`.

**Change:**
- Corrected the knee-group boot/sole/heel offsets that placed the boots 0.4 units below the shins; feet now stay attached and planted. Deepened the crouch pose so the body lowers while the soles stay at floor level.
- Created a compensating `staffMount` at the right hand and parented the staff to it, so the grip origin is exactly the hand anchor and follows ready/guard/swing rotations. Per-limb batching excludes the mount.
- Added an aim-only over-the-shoulder camera branch: 4.1m behind, 0.68m to the player's right, 1.55m high, looking along the player's facing. Vertical drag controls aim pitch; horizontal drag is a small recentring shoulder offset. Normal play keeps the orbit camera.
- Recorded weaponless combat as a proposal only; no reach/damage/stance/toggle rules were invented.

**Verification:** `node --check` clean; `npm test` → 53/53; local Three smoke built both fighters, confirmed staff grip and hand positions coincide (delta 0.0000), rest foot minY 0.012, crouch foot minY 0.019, and aim camera at (-0.68, 1.55, 6.60) for a player at z 2.5 facing the Sensei. Browser visual/device pass still required.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (feet, staff grip and over-the-shoulder aim)

## 2026-10-22 — opencode/deepseek-v4.1-flash-free (weapons/wilderness slice)

**Scope:** owner asked for expanded unarmed combat (punch, kick, grab), a traversable wilderness
route to the first tower with enemies, D-pad left/right weapon cycling, more weapons including a
katana, and a temporary test Cipher Sleeve. Preserve the training/tutorial/spar loop, first-to-three
knockdowns, no-death recovery, save/menu systems and the deferred touch-button layout.

**Files:** `src/weapons.js` (new), `src/game.js`, `src/characters.js`, `src/combat.js`,
`src/scenery.js`, `src/world.js`, `src/config.js`, `src/hud.js`, `src/main.js`, `src/bindings.js`,
`src/input.js`, `index.html`, `src/styles.css`, `tests/game.test.mjs`, `tests/systems.test.mjs`, `README.md`,
`docs/architecture.md`, `docs/memory/02-gameplay.md`, `docs/roadmap.md`, `docs/canon-guardrails.md`.

**Weapons and unarmed**

- Added loadout order `staff → katana → unarmed → cipher`; D-pad left/right, keyboard `[`/`]` and
  touch `SWAP` cycle it. Staff still reads dynamic `CONFIG` stats, so existing spar tuning remains
  authoritative. Katana has its own blade stats and right-hand mesh.
- Unarmed uses one attack button for `punch → kick → grab`. The grab applies a stagger rather than a
  knockdown. Grab reach was widened and punch/kick knockback reduced so the combo remains usable
  after the first two hits; the sequence times out back to punch.
- Added weapon chip, target name, raider radar/map dots and control hints. The spar score hides in
  the wilderness. The map projection now treats negative z as north/up and widens to cover the
  wilderness route, so the gate/tower labels and raider dots stay on-screen.

**Wilderness and raiders**

- Opened the north gate and added a broad wilderness route (x ≈ ±31, z −67 to −13.2), worn track,
  scrub, rocks, dead trees, boundary posts, supply props and a procedural first-tower silhouette.
  USE/F at the gate transitions to the wilderness; USE/F at the return side goes back to the yard.
- Added four separate raiders at z −22.5, −33, −45 and −55 (two staff, two katana, 45 HP each) with
  a shared AI cycle, aggro range and nonlethal knockdowns. They do not award spar points and do not
  recover after defeat. Reaching `z <= −61` flags the first tower and ends the test slice.
- Camera focus switches to Ajaye in the wilderness; over-the-shoulder aim remains player-anchored.

**Test-only Cipher Sleeve**

- Added a `CIPHER SLEEVE · TEST` loadout entry with a left-arm-only mesh, visible only while
  equipped. It is explicitly labelled developer test content in the HUD, gear page and messages.
  No story acquisition, Cipher capacity, energy or ability was invented. The sleeve HUD meter is
  hidden except while the test item is equipped.

**Verification:** `npm test` → 58/58; `node --check` clean on modified JS. Local Three smoke (not
committed) created the full world with four raiders, switched unarmed/katana/test-sleeve feedback,
exercised wilderness render with a stub renderer and confirmed weapon visibility. No browser or
device render pass was run for this slice, so camera composition, raider silhouettes, sleeve mesh,
gate readability and frame rate remain unverified. Touch-button layout tuning remains deferred.
Character likeness still requires approved reference sheets.

**Preview:** https://raw.githack.com/platinumsoundz/The-5-Sleeves-3D/94aee01/index.html — the
commit-pinned path avoids raw.githack's `/main/` module cache.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)

## 2026-10-22 — opencode/deepseek-v4.1-flash-free (quests and minimap pass)

**Scope:** owner asked for a minimap that follows the character, a menu map ready for a big open
world, and selectable quests with exactly one active quest tracked by a minimap arrow. Preserve the
training/tutorial/spar loop, first-to-three knockdowns, no deaths, save/menu behavior, the existing
wilderness slice and deferred touch-button tuning.

**Files:** `src/quests.js` (new), `src/worldmap.js` (new), `src/game.js`, `src/hud.js`, `src/main.js`,
`src/save.js`, `index.html`, `src/styles.css`, `tests/game.test.mjs`, `tests/systems.test.mjs`,
`README.md`, `docs/architecture.md`, `docs/memory/02-gameplay.md`, `docs/memory/03-technical.md`,
`docs/roadmap.md`, `docs/ai-build-log.md`.

**Quest system**

- Added a pure quest catalogue and `QuestLog` with one active slot, completion checks, available/
  active/completed states, objective resolution and sanitised save snapshots. Three starter quests
  reuse existing hooks: reach the first tower, knock down all four raiders, or win a spar.
- The former SKILLS placeholder tab is now QUESTS. Cards are built by `main.js` from
  `Game.questEntries` whenever `questVersion` changes; selecting another quest replaces the active
  one, completed quests cannot be re-tracked, and the current card is marked TRACKED.
- Completion clears tracking and pays the quest's placeholder XP once. If the objective sits in the
  other zone, the arrow points at the appropriate gate first. Save/Resume restores active/completed
  quest state alongside tutorial, XP, cash and permissions.

**Minimap and menu map**

- The HUD radar remains a player-centred follow view. Target radius was reduced from 40 to 32 so
  pinned targets are not clipped by the 70px mobile radar. Added a cyan active-quest arrow with
  rotation toward the objective, a compact title/progress/distance tracker, and a documented
  follow-view regression test.
- Added `worldmap.js` with configurable bounds, training/wilderness regions and gate/tower points
  of interest. Both menu maps now project live markers through those bounds instead of an `arena`
  radius, and build region/POI overlays plus a cyan quest marker from the same catalogue.
- North remains negative Z, so the gate/tower stay up-screen. Adding a region or quest is a data
  change; no new map module or projection path is needed.

**Verification:** `node --check` clean on every `src/*.js` and both test files; `git diff --check`
clean; `npm test` → 64/64. New tests cover radar follow invariance, quest one-active enforcement,
completion/reward-once behavior, cross-zone target fallback, world-map bounds/projection and HUD
quest marker/arrow output. No browser/device render pass was run here, so the cyan arrow geometry,
mobile tracker placement, quest cards and map overlays still need the owner's screen test.

**Gaps/next:** only three placeholder quests; no chains, choices, failure states, timers or canon
story rewards. Menu maps have no pan/zoom yet. Quest cards are main.js-built DOM (tested through
Game/HUD state, not DOM automation). Touch-button layout tuning remains deferred by owner request.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass)

## 2026-10-22 — opencode/deepseek-v4.1-flash-free (HUD, crash, minimap, PWA and device detection)

**Scope:** owner reported incorrect HUD placement, a wilderness crash when a raider reached the
player, unstable/unclear FPS values, a landscape event log hidden behind the left joystick, and a
minimap that felt too zoomed in with an unclear moving red dot. Owner also asked for PWA
installation on Android/iOS, proper iPad touch detection and controller detection, with the custom
icon deferred. Preserve the training/tutorial/spar loop, first-to-three knockdowns, no deaths,
save/menu behavior, the wilderness slice and deferred touch-button tuning.

**Files:** `src/game.js`, `src/config.js`, `src/hud.js`, `src/input.js`, `src/device.js` (new),
`src/main.js`, `src/styles.css`, `index.html`, `manifest.webmanifest` (new), `sw.js` (new),
`icons/` (new placeholder PNGs and handoff README), `tests/game.test.mjs`, `tests/systems.test.mjs`,
`README.md`, `docs/architecture.md`, `docs/memory/02-gameplay.md`, `docs/memory/03-technical.md`,
`docs/decision-log.md`, `docs/roadmap.md`.

**Crash and minimap**

- Root cause of the wilderness crash: `Game.moveWildEnemies()` called `hit()` on
  `this.world.player` (the Three.js mesh) instead of `this.player` (the FighterState). Fixed the
  target and added a regression test that lets a raider reach and strike the player, asserting no
  throw and one `CONFIG.wildDamage` hit.
- Radar range is now config-driven: `CONFIG.radarRange = 24` in training and
  `CONFIG.radarWildRange = 52` in the wilderness. The player remains at the centre with a larger
  gold/white marker and forward tick, while Sensei/raiders/quest targets move around it.
  `Hud` uses the published range for every marker, including the quest arrow.

**HUD/FPS**

- Repositioned the HUD for the owner's layout: minimap top-left, player health/stamina top-right,
  Sensei boss health/phase top-centre below MENU, SKIP TUTORIAL beside MENU (wrapped with
  pause/restart in `#top-actions`), weapon/score/quest tracker below the boss bar, and the event
  feed under the minimap. Removed the short-height rule that hid the feed so it remains visible in
  landscape; added compact landscape and portrait overrides.
- FPS readout now uses a one-second sample and plain labels: `60 FPS · 277 draws · 27k tris`, with
  an explanatory tooltip/title and a SYSTEM page note. Draw calls and triangles are renderer
  complexity, not separate frame rates.

**PWA and device detection**

- Added `manifest.webmanifest` with standalone display, relative scope/start URL, 192/512 icons and
  a maskable icon; added Apple touch icon/meta tags, theme/color-scheme and `viewport-fit=cover`.
- Added `sw.js`, which precaches the app shell, icons and pinned three.js module. Navigations are
  network-first with an offline shell fallback; static modules use stale-while-revalidate. Added
  optional Chromium install prompt handling and an INSTALL APP title button; iOS uses Share → Add to
  Home Screen. Service-worker registration is limited to HTTPS/localhost.
- Added pure `device.js` detection. iPadOS is recognised through touch points + coarse pointer even
  when its user agent reports Macintosh. `Input` now tracks `touchUI` separately from the active
  prompt source, so a keyboard/controller cannot hide the touch controls on a tablet. A paired
  controller changes the active device only when a stick/button is actually used.
- Generated placeholder PWA/favicon PNGs and documented the custom-art handoff in
  `icons/README.md`; owner artwork is still pending.

**Verification:** `node --check` clean on modified JS and `sw.js`; CSS brace balance clean;
`git diff --check` clean; `npm test` → 67/67. New tests cover device detection, PWA manifest/icon
existence and service-worker shell entries, plus the wilderness raider strike regression. No
browser/device render pass was run here, so final HUD spacing, landscape feed visibility, minimap
readability, iPad touch layout, controller pairing, installability and FPS smoothing still need the
owner's screen test.

**Gaps/next:** custom PWA icon artwork; optional quest/loot markers once a loot system exists;
landscape HUD/feed tuning after a real phone pass; touch-button layout remains deferred.

**Preview:** commit-pinned raw.githack URL to be added after this commit is pushed.

## 2026-10-22 — Solid scenery, enemy outpost, minimal title and offline story

**Collision**

- Added pure `src/collision.js`: circle-vs-circle and circle-vs-rotated-box resolution with a
  multi-pass settle loop. `CONFIG.actorRadius = .42`.
- `scenery.js` now publishes colliders for reachable yard buildings, stalls, water/solar/fan,
  laundry and ring posts, gate posts, crates, barrels, sacks, trees, bushes, wilderness boundary
  posts, rocks, dead trees, distant structures, supply props and the outpost footprint.
- `world.js` merges training and wilderness colliders and exposes `outpost`.
- `game.js` resolves player movement, dodge, knockback, Sensei movement and raider movement
  against the collider list, then reapplies zone bounds. Raider reset positions are settled out of
  props as well. The outpost trigger is distance-based at `(0, −63)` with a 6.4m radius, outside its
  solid footprint.

**Outpost rename**

- The existing end-of-slice relay/guard geometry is retained and relabelled as an enemy outpost,
  not a story tower. Config keys are now `wildOutpostX/Z/Reach`; gameplay state is
  `outpostReached`; the quest is `scout-outpost` / “Scout the Enemy Outpost”; the world-map POI is
  `ENEMY OUTPOST`. Older saves using `first-tower` migrate on `QuestLog.restore`.
- The sequence ends at the outpost watch radius and emits `outpost-reached`; the test slice message
  and prompt now use the outpost wording. No new tower geometry or canon geography was added.

**Title and story**

- Reduced `#title` to `THE 5 SLEEVES` plus Start, Resume, Install (when offered), Settings and the
  disabled Multiplayer button. Removed eyebrow, tagline and version copy.
- Added `src/story.js` with five data-driven, deliberately broad mood/setting pages and a reusable
  `StoryDeck`. Added `#story` overlay with page count, NEXT, last-page EXIT, top-of-box SKIP STORY,
  and inline “Skip the story?” confirmation. Escape mirrors the skip confirmation. Resume bypasses
  the introduction.
- `Game` accepts an optional `requestStart` hook. The browser passes one that opens the story;
  headless tests without the hook still call `startNew()` directly. `Hud.sync` owns the title's
  hidden state, so the story overlay hides the title with `style.visibility`.
- Updated the service-worker shell for `collision.js` and `story.js`, bumped the cache to
  `five-sleeves-shell-v2`, and refreshed README/architecture/gameplay/technical/roadmap notes.

**Verification:** `node --check` clean on all JS and `sw.js`; `npm test` → 72/72. New/updated tests
cover outpost trigger and quest completion, quest-ID migration, solid circle/rotated-box
resolution, player and raider collision, story deck navigation/final exit, story-page guardrails,
world-map outpost labelling and the HUD quest fixture. No browser/device render pass was run here:
collision feel, outpost approach, title/story layout, landscape HUD, iPad touch layout, controller
pairing, PWA installation and FPS behavior still need the owner's screen test.

**PWA icon follow-up:** the owner supplied `icons/source/app-icon.png` (1254×1254 RGB). Exported
the five runtime files from that one source: `icons/icon-192.png`, `icons/icon-512.png`,
`icons/icon-maskable-512.png`, `icons/apple-touch-icon.png` and `icons/favicon-32.png`. The
maskable export pads the illustration into the central safe area on the source's dark margin,
then the service-worker cache was bumped so installed clients refresh the icon set. The five
runtime files should not be replaced individually: update the single source and regenerate all
five exports.

**Progression, First Tower, enemy defence, scan and multiplayer scaffolding (2026-10-22)**

- Added pure `progression.js` (level 1–20, rising XP curve, cash ledger, derived stats,
  mitigation), `items.js` (prototype common→legendary catalogue, values and stat lines),
  `inventory.js` (24 slots, weapon/armour/gear equipment and active-kind bonuses), `skills.js`
  (passive movement/defence/conditioning/striking tree) and `enemy.js` (vision cone, alert
  markers, auto-approach, block/parry/dodge reactions).
- Added `scan.js` for a limited test-sleeve tactical readout and `multiplayer.js` for pure
  lobby/presence/party/chat state plus a drained transport outbox. The multiplayer module is not
  imported by story mode and no live networking is implemented.
- `save.js` is now schema v2 with progression, inventory, skills, permissions, quests and tower
  state; old flat XP/cash slots migrate and receive the starter kit if inventory is absent.
- `game.js` now merges level, skill and gear stats into combat/movement, grants XP/cash/item
  rewards, tracks tower entry/link, handles the test-sleeve scan target, and routes attacks in
  both wilderness and tower. `scenery.js` adds the walkable First Tower (outer monumental wall,
  inner control chamber, dais, five channels, console) beyond the outpost and extends the road.
- `hud.js` projects a north-up bird's-eye radar with a rotating player heading arrow, enemy alert
  states, scan overlay, progression readouts and tower status. `main.js` builds inventory/skill
  cards and opens the tower story deck. `index.html`/`styles.css` add the scan, skills/inventory,
  target-alert, north marker and tower map presentation.
- Two new quests cover entering the tower and linking its five channels. The link is deliberately
  local: channels answer, Cipher is silent, and no activation power or global effect is defined.
- Updated the service-worker shell for the new modules and bumped the cache to
  `five-sleeves-shell-v4`.

**Verification:** `node --check` clean on all JS and `sw.js`; `npm test` → 89/89. New
`tests/features.test.mjs` covers the level curve, cash, mitigation, item rarity/stat lines,
inventory/equipment, skill prerequisites and bonuses, raider vision/alert/defence, scan fields,
north-up projection, tower quests/save state and multiplayer bounds/isolation. Game tests were
updated for starter gear (+8 HP, +3 defence, +2 attack), mitigation and schema v2 saves. No
browser/device render pass was run here: menu cards, tower interior, scan overlay, north-up
minimap feel, enemy markers, loading and performance still need the owner's screen test.

**Gaps/next:** touch-button layout remains deferred. The story deck currently has no branches,
portraits or seen-state save. The tower activation effect, first Cipher speech and live networking
remain owner-approval/backend items.

**Preview:** commit-pinned raw.githack URL: `https://raw.githack.com/platinumsoundz/The-5-Sleeves-3D/0fcbb06/index.html`.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (HUD/PWA/device detection follow-up)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (solid scenery, enemy outpost rename, story introduction)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (runtime icon exports from owner source)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (progression, inventory, skills, enemy vision, First Tower, scan, north-up minimap, multiplayer scaffolding)


## 2026-10-26 — GPT-6 (save recovery pass)

**Scope:** protect local progression from a corrupt or interrupted browser-storage write without changing the save schema or gameplay rules.

- Added `SAVE_BACKUP_KEY` and a last-known-good save snapshot.
- Loading prefers the current save, then falls back to the backup if the current slot is missing or malformed.
- Saving rotates a parseable primary save into the backup before replacing it. A malformed primary never overwrites a good backup.
- Deleting a save clears both slots so Resume cannot silently restore data the player chose to delete.
- Added `tests/save-recovery.test.mjs` for corrupt-primary recovery, backup rotation, malformed-primary safety, and deletion of both slots.

**Verification:** not run, following the owner's deferred-verification workflow. No browser/device test or deployment was performed.

**Known limit:** browser storage can be cleared or unavailable; this is recovery from a damaged local save, not cloud backup or cross-device sync.
