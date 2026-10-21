# Architecture and safe modification

`main.js` wires the browser loop. `input.js` normalizes keyboard, standard gamepad and touch into
named actions; nothing downstream reads raw device codes. `world.js` owns the Three.js scene,
procedural fighters, arena, drag-orbit camera and viewport. `game.js` orchestrates tutorial,
movement, strikes, rounds and match end, and is the only class the browser entry point touches.

Rules are split so they cannot drift apart and can be tested without a renderer:

| Module | Responsibility |
| --- | --- |
| `fighter.js` | nonlethal HP, knockdown, auto-recovery and confirm-to-rise |
| `combat.js` | attack cooldown, swing arc, dodge window and direction |
| `ai.js` | Sensei decisions: approach, wind-up, strike, recover |
| `match.js` | knockdown points, winner, first to `CONFIG.pointsToWin` |
| `events.js` | synchronous pub/sub between gameplay and presentation |
| `hud.js` | every DOM write; receives elements, never queries them |
| `config.js` | tuning values only |

`game.js` passes stub world/input/ui objects in tests, so no module below it may touch
`document`, `window` or `THREE`. New presentation concerns subscribe to `events` or extend
`hud.js`; new rules go in their own module, not in `game.js`.

One opponent is supported. Sensei is passive during the tutorial. Both fighters can be knocked
down; a downed player must confirm before the next round starts, while Sensei recovers on his own.
XP/money, saves and Cipher powers remain deferred, with extension points preserved. Cipher
abilities must sit behind a future ability interface, and Ajaye's Sleeve stays left-arm-only if
shown. Browser execution has not been verified.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
