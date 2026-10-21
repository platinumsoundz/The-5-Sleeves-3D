# Chapter 2 — Gameplay decisions

## Confirmed
- Single-player prototype, browser first; multiplayer is a later ambition only.
- Start in the home-village training area. Short guided tutorial is skippable; after it, free sparring with Sensei. Sensei remains passive during the tutorial.
- Staff first; keep weapon/ability interfaces open for Cipher later. No deaths; either fighter can be knocked down. Press A/confirm to recover.
- Hold LT to lock on. RT attacks with the current staff action. A jump, B dodge, X interact, L3 sprint, R3 crouch. Camera movement should cycle targets when there are multiple; first scene has one opponent.
- Support touch, keyboard/mouse, Xbox/PlayStation/third-party controllers, detected-input annotations, and future remapping.
- XP/currency are not in the prototype, but future progression should be a separate module. Local saves are acceptable later; cloud persistence deferred.
- Target 30 FPS baseline on S23+; higher refresh modes are later best-effort options, not guaranteed.

## Deferred
Physical ragdoll; multi-target cycling; full remapping UI; saves; progression; inventory; Sleeve skills; online networking; final art.

## Working (built, headless-tested, not yet browser-tested)
- Sparring win condition: knockdowns are points, first to 3 wins, then a result screen and restart.
- Rounds: after a knockdown and recovery, a short pause returns both fighters to their marks at full health; scores persist.
- Sensei behavior: approach, 0.5s wind-up telegraph, strike, recover, with reach and accuracy tunable in `src/config.js`.
- HUD: score readout, phase label (TUTORIAL / FREE SPAR / SPAR COMPLETE), knockdown health at zero until recovery.
- Dodge and crouch both avoid a Sensei strike; a dodge keeps its directional input, including a pure sideways dodge.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
