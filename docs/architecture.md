# Architecture and safe modification

`main.js` wires the browser loop and the title/menu chrome. `input.js` normalizes keyboard,
standard gamepad and touch into named actions plus an analog move vector and right-stick look;
nothing downstream reads raw device codes or touch coordinates. Bindings are sanitized in
`bindings.js`, and remapping swaps displaced keys/buttons so no action silently loses its input.
Pure deadzone/joystick math lives in `controls.js` so it can be tested without a browser.
`world.js` owns the Three.js scene, camera, aim zoom and viewport. `scenery.js` builds the
procedural settlement set dressing and ambient animation; `characters.js` builds the Ajaye and
Sensei silhouettes with articulated hip/knee and shoulder/elbow pivots. `game.js` orchestrates screens, tutorial, movement, strikes, rounds,
saves and match end, and is the only class the browser entry point touches.

Rules are split so they cannot drift apart and can be tested without a renderer:

| Module | Responsibility |
| --- | --- |
| `fighter.js` | nonlethal HP, knockdown, auto-recovery and confirm-to-rise |
| `combat.js` | attack cooldown, swing arc, dodge window and direction |
| `ai.js` | Sensei decisions: approach, wind-up, strike, recover |
| `match.js` | knockdown points, winner, first to `CONFIG.pointsToWin` |
| `events.js` | synchronous pub/sub between gameplay and presentation |
| `hud.js` | gameplay HUD DOM writes; receives elements, never queries them |
| `controls.js` | pure deadzone, joystick and clamp math |
| `settings.js` | look/quality/touch-layout defaults, clamping and storage I/O |
| `bindings.js` | keyboard/controller bindings, sanitize/swap/persist |
| `save.js` | versioned local save slot, sanitize/load/write/delete |
| `devcodes.js` | developer code registry and pure save transforms |
| `radar.js` | forward-up world-to-radar projection |
| `resources.js` | clamped regenerating stamina resource |
| `log.js` | bounded HUD event feed |
| `config.js` | tuning values only |

`scenery.js` and `characters.js` import Three.js and are browser-only presentation modules:
`world.js` composes them and never reads gameplay rules from them. They share low-poly geometry,
cached materials and a canvas-texture ground/sky; no shadow maps or post-processing is used.
The training scene is the pre-Cipher settlement: Ajaye has wrapped forearms and no Sleeve, the
sleeve HUD meter is hidden, and the set dressing is generic repaired infrastructure, not story
locations or named props.

`game.js` passes stub world/input/ui objects in tests, so no module below it may touch
`document`, `window` or `THREE`. New presentation concerns subscribe to `events` or extend
`hud.js`; new rules go in their own module, not in `game.js`.

Defense uses a single `guard` action. On the press edge `game.js` asks for a direction: with one
it starts a dodge (i-frames), without one it starts a block and opens the parry window. Holding
guard keeps blocking; three blocked hits inside the window break the guard. All of those timers
live in `combat.js`, never in the input layer.

Presentation is push-only: `main.js` passes `setFeedback({ senseiWindingUp, playerBlocking,
aiming, crouching, swing })` to `world.js` each frame, forwards gamepad look and `hit`/`parry`/`block` events,
and `world.look(dx, dy)` handles mouse/touch drags internally. No render module reads gameplay
state directly. The frame loop skips updates while the document is hidden, and `index.html` reports
a load failure if the CDN module never arrives.

Touch is laid out like a mobile shooter: the joystick owns the bottom-left, the right 45% of the
canvas is the look area, and the right cluster holds aim/attack/jump/guard/crouch/sprint/use.
Holding aim also reveals `#fire` under the left thumb. `Hud.sync` is what toggles those elements;
`input.js` only reads the DOM nodes for the stick and buttons. Because a held button can disappear
(MENU pauses, STAFF hides while aiming), pointer releases are also caught on `window` so an action
cannot stay stuck down.

Screens live in `game.js` as `screen: title | menu | map | playing`. Only `playing` simulates;
the others stay paused while still rendering. `paused` mirrors `screen !== 'playing'` for older
callers. The menu overlay is the old `#settings` element, now a tabbed shell; the map is its own
overlay. `Hud.sync` decides which gameplay HUD/touch elements are visible. Menu-chrome mounting,
binding-row construction, save/dev buttons and live touch CSS variables are handled by `main.js`
because they are browser-only shell concerns. Gameplay HUD writes remain in `hud.js`.

`settings.js` owns validation and storage I/O for look/quality/touch; `main.js` loads settings,
passes them to `world.setSettings`/`setQuality`, and reflects the controls. `save.js` persists
tutorial completion plus dev-granted XP/cash/permissions under a separate key; `bindings.js`
persists remaps under another. Deleting the save never deletes controls or settings.

One opponent is supported. Sensei is passive during the tutorial. Both fighters can be knocked
down; a downed player must confirm before the next round starts, while Sensei recovers on his own.
XP/money progression, inventory/skill content and Cipher powers remain deferred, with extension
points preserved. Dev codes may write placeholder XP/cash/permissions, but nothing consumes them
in combat. Cipher abilities must sit behind a future ability interface, and Ajaye's Sleeve stays
left-arm-only if shown. The Cipher Sleeve is not acquired in the opening training scene, so no
sleeve capacity is modelled and the sleeve HUD meter stays hidden until an acquisition system
exists. The owner has browser-tested the pre-visual build on the S23+ at 120 FPS with no reported
errors; the new settlement/character visual pass still needs its own browser check. Touch-button
size, placement and feel remain deferred at the owner's request.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (settlement/character visual pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated limbs and menu stability)
