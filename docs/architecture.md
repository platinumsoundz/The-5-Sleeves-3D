# Architecture and safe modification

`main.js` wires the browser loop. `input.js` normalizes keyboard, standard gamepad and touch into
named actions plus an analog move vector and right-stick look; nothing downstream reads raw device
codes or touch coordinates. Pure deadzone/joystick math lives in `controls.js` so it can be tested
without a browser. `world.js` owns the Three.js scene, procedural fighters, arena, yaw/pitch orbit
camera, aim zoom and viewport. `game.js` orchestrates tutorial, movement, strikes, rounds and match
end, and is the only class the browser entry point touches.

Rules are split so they cannot drift apart and can be tested without a renderer:

| Module | Responsibility |
| --- | --- |
| `fighter.js` | nonlethal HP, knockdown, auto-recovery and confirm-to-rise |
| `combat.js` | attack cooldown, swing arc, dodge window and direction |
| `ai.js` | Sensei decisions: approach, wind-up, strike, recover |
| `match.js` | knockdown points, winner, first to `CONFIG.pointsToWin` |
| `events.js` | synchronous pub/sub between gameplay and presentation |
| `hud.js` | every DOM write; receives elements, never queries them |
| `controls.js` | pure deadzone, joystick and clamp math |
| `config.js` | tuning values only |

`game.js` passes stub world/input/ui objects in tests, so no module below it may touch
`document`, `window` or `THREE`. New presentation concerns subscribe to `events` or extend
`hud.js`; new rules go in their own module, not in `game.js`.

Defense uses a single `guard` action. On the press edge `game.js` asks for a direction: with one
it starts a dodge (i-frames), without one it starts a block and opens the parry window. Holding
guard keeps blocking; three blocked hits inside the window break the guard. All of those timers
live in `combat.js`, never in the input layer.

Presentation is push-only: `main.js` passes `setFeedback({ senseiWindingUp, playerBlocking,
aiming })` to `world.js` each frame, forwards gamepad look and `hit`/`parry`/`block` events, and
`world.look(dx, dy)` handles mouse/touch drags internally. No render module reads gameplay state
directly. The frame loop skips updates while the document is hidden, and `index.html` reports a
load failure if the CDN module never arrives.

Touch is laid out like a mobile shooter: the joystick owns the bottom-left, the right 45% of the
canvas is the look area, and the right cluster holds aim/attack/jump/guard/crouch/sprint/use.
Holding aim also reveals `#fire` under the left thumb. `Hud.sync` is what toggles those elements;
`input.js` only reads the DOM nodes for the stick and buttons.

One opponent is supported. Sensei is passive during the tutorial. Both fighters can be knocked
down; a downed player must confirm before the next round starts, while Sensei recovers on his own.
XP/money, saves and Cipher powers remain deferred, with extension points preserved. Cipher
abilities must sit behind a future ability interface, and Ajaye's Sleeve stays left-arm-only if
shown. Browser execution has not been verified.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
