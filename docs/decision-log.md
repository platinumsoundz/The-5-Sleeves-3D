# Decision log

Approved starting scope: village training area, short skippable tutorial then sparring. Sensei stays passive until tutorial ends; start with staff. No deaths; either fighter may be knocked down and player gets up with contextual confirm/A. L3 sprint, R3 crouch. Lock-on normal combat; presently one target. Keyboard, gamepad and touch support. XP/money excluded but preserve extension points. Cipher integration remains open; Ajaye's Cipher Sleeve is left arm only if eventually shown. Browser/procedural, Samsung S23+ target, 30fps goal.

Implementation corrections: restart fully resets both fighters' pose and clears queued presses; knockdown health shows zero until recovery; jumping is no longer damped by the idle settle; a mouse click attacks only if it did not drag, so dragging orbits without swinging. Headless rules tests live in `tests/` (`npm test`).

2026-10-21 — Owner: proceed without the device test. Core systems may be built against headless tests alone; the browser pass is still required before feel and performance tuning, and remains unperformed. The owner does not need to approve individual commits in this session.

AI provenance (Confirmed by owner): every model signs each file it creates or materially changes, signatures stack instead of replacing earlier ones, and every behavior-changing session appends to `docs/ai-build-log.md`. Primary model is DeepSeek V4.1 Flash Free; ChatGPT-6 Luna is used occasionally, exact model ID unconfirmed. Details in `docs/memory/04-ai-collaboration.md`.

Sparring structure (Working — provisional, not owner-approved): knockdowns score a point and the first to 3 takes the spar; a 1.2s pause follows before both fighters reset to their marks. Sensei telegraphs for 0.5s inside 1.9 units and connects at most 0.8 of the time; crouching or dodging avoids a strike. There are no deaths; the result reads as spar complete.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
