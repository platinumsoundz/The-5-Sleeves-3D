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
