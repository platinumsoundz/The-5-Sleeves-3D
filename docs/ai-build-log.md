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
