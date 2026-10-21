# Decision log

Approved starting scope: village training area, short skippable tutorial then sparring. Sensei stays passive until tutorial ends; start with staff. No deaths; either fighter may be knocked down and player gets up with contextual confirm/A. L3 sprint, R3 crouch. Lock-on normal combat; presently one target. Keyboard, gamepad and touch support. XP/money excluded but preserve extension points. Cipher integration remains open; Ajaye's Cipher Sleeve is left arm only if eventually shown. Browser/procedural, Samsung S23+ target, 30fps goal.

Implementation corrections: restart fully resets both fighters' pose and clears queued presses; knockdown health shows zero until recovery; jumping is no longer damped by the idle settle; a mouse click attacks only if it did not drag, so dragging orbits without swinging. Headless rules tests live in `tests/` (`npm test`).

2026-10-21 — Owner: proceed without the device test. Core systems may be built against headless tests alone; the browser pass is still required before feel and performance tuning, and remains unperformed. The owner does not need to approve individual commits in this session.

AI provenance (Confirmed by owner): every model signs each file it creates or materially changes, signatures stack instead of replacing earlier ones, and every behavior-changing session appends to `docs/ai-build-log.md`. Primary model is DeepSeek V4.1 Flash Free; ChatGPT-6 Luna is used occasionally, exact model ID unconfirmed. Details in `docs/memory/04-ai-collaboration.md`.

Sparring structure (Working — provisional, not owner-approved): knockdowns score a point and the first to 3 takes the spar; a 1.2s pause follows before both fighters reset to their marks. Sensei telegraphs for 0.5s inside 1.9 units and connects at most 0.8 of the time; dodging avoids a strike (crouch immunity was later removed, see below). There are no deaths; the result reads as spar complete.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

Touch and PC controls (owner instruction, numbers provisional): touch should feel like Call of Duty Mobile — analog stick bottom-left, drag the right screen to look, hold AIM on the right to aim and keep looking with another finger, and a FIRE button appears on the left while aiming; every other button stays bottom-right. On PC, standard shooter bindings: left-click = RT, right-click = LT, Shift = L3, Space = jump, F = interact; Q (and K) guard, Ctrl crouch, Enter/Space confirm. Implemented as an analog move vector plus yaw/pitch camera and aim zoom. Sensitivities, deadzone, FOV and camera distance are placeholders in `config.js`.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

Defense (owner instruction, numbers provisional): one guard input covers block, dodge and parry. Tap alone to block and hold to keep blocking (45% move speed, 25% damage through); add a direction to dodge; press within 0.2s of impact to parry, which negates the hit and staggers Sensei for 1.1s. Parry cannot be re-armed for 0.35s after the window closes, so mashing guard does not work. Three blocked hits inside 3s break the guard for 0.9s. Crouch is now posture only and no longer avoids strikes; that earlier immunity was accidental and removed so block has a purpose. A whiffed swing within 3.1 units invites a shortened 0.26s Sensei wind-up.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

Shell, saves, remapping and HUD (owner instruction, provisional implementation): title screen with Start, Resume (disabled when no save), Settings, and a visible but disabled Multiplayer button labelled in-development. Start opens a tabbed menu (character, inventory, skills, map, settings, system); Select opens the map. Controls can be remapped for keyboard and controller; touch can change size, opacity and handedness. Save/delete and placeholder dev codes live in System. HUD: vitals top-left, radar beneath, event feed beneath that, MENU top-centre with score, Sensei/phase top-right. Stamina is spent by sprint/jump/dodge; the sleeve meter is display-only because no ability exists yet. Per-button drag placement, real XP/cash/weapons/inventory/skills and multiplayer remain deferred. The screen state machine and pure modules are headless-tested; layout and feel still require the owner's phone pass.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
