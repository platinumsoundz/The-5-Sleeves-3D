# Chapter 2 — Gameplay decisions

## Confirmed
- Single-player prototype, browser first; multiplayer is a later ambition only.
- Start in the home-village training area. Short guided tutorial is skippable; after it, free sparring with Sensei. Sensei remains passive during the tutorial.
- Staff first; keep weapon/ability interfaces open for Cipher later. No deaths; either fighter can be knocked down. Press A/confirm to recover.
- Hold LT/RMB to aim and lock on. RT/LMB attacks with the current staff action. A/Space jumps, B/Q guards, X/F interacts, L3/Shift sprints, R3/Ctrl crouches; Enter or Space confirms/get up. Camera movement should cycle targets when there are multiple; first scene has one opponent.
- Touch follows a Call of Duty Mobile-style layout: analog movement stick bottom-left; drag the right side of the screen to look; hold AIM on the right to zoom/lock (and keep looking with another finger) while a FIRE button appears under the left thumb; all other buttons sit bottom-right.
- Support touch, keyboard/mouse, Xbox/PlayStation/third-party controllers, detected-input annotations, and future remapping.
- XP/currency are not in the prototype, but future progression should be a separate module. Local saves are acceptable later; cloud persistence deferred.
- Target 30 FPS baseline on S23+; higher refresh modes are later best-effort options, not guaranteed.

## Deferred
Physical ragdoll; multi-target cycling; full remapping UI; saves; progression; inventory; Sleeve skills; online networking; final art.

## Working (built, headless-tested, not yet browser-tested)
- Sparring win condition: knockdowns are points, first to 3 wins, then a result screen and restart.
- Rounds: after a knockdown and recovery, a short pause returns both fighters to their marks at full health; scores persist.
- Sensei behavior: approach, 0.5s wind-up telegraph, strike, recover, with reach and accuracy tunable in `src/config.js`.
- Defense on one guard input: tap alone to block (45% move speed), hold to keep blocking, add a direction to dodge, or press just before impact for a parry. Parry negates the hit and staggers Sensei for 1.1s; after the window closes it cannot be re-armed for 0.35s, so mashing guard does not work.
- Guard pressure: three blocked hits inside 3s break the guard for 0.9s; a parry or dodge clears the pressure.
- Crouch is posture and mobility only; it no longer avoids strikes.
- Feedback: 0.22m knockback on a landed strike, body tint during wind-up and block, hit/parry/block flashes, HUD "!" warning during a wind-up, fps readout.
- Punish: a whiffed staff swing within 3.1 units invites a shortened 0.26s Sensei wind-up.
- Robustness: load-failure message if three.js or a module does not arrive, paused updates while the tab is hidden, frame-rate-independent camera lerp, WebGL context-loss notice.
- HUD: score pips, phase label (TUTORIAL / FREE SPAR / SPAR COMPLETE), knockdown health at zero until recovery.
- Analog movement: stick tilt sets travel speed (half tilt = half speed); keyboard diagonals are normalized. Camera has yaw and pitch, with drag/right-stick look.
- Aim mode: FOV eases 55→42 and camera distance 10→6.5; a centre reticle appears. On touch the right STAFF button is replaced by a left FIRE button.
- Touch look area is the right 45% of the canvas; the left side belongs to the joystick. A locked aim offsets the camera and recentres 0.45s after the last drag.
- All sensitivities, deadzones, FOV and camera distance are placeholder values in `src/config.js`.
- Pause: Esc or the MENU button freezes the simulation and opens look sensitivity (0.4–2×), invert-Y and graphics quality (performance 1×, balanced ≤1.5×, sharp ≤2.5× pixel ratio). Settings persist in local storage; no other save data exists.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
