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

2026-10-22 — Owner: the browser build works on the S23+, runs smoothly at a reported 120 FPS and has no issues other than the touch-button layout, which is explicitly deferred. The Cipher Sleeve is not acquired in the opening training scene, so its HUD meter is hidden and no sleeve capacity is modelled until an acquisition system exists. Finish the visual/character/scenery pass next: generic settlement set dressing, Ajaye and Sensei whitebox silhouettes, no Cipher Sleeve, no Korb/Cipher/tower story content. Owner reference sheets are still needed before claiming final likeness; the new visual pass needs its own browser check.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22

2026-10-22 — Owner: expand the prototype with a punch/kick/grab unarmed combo, a traversable wilderness route to the first tower with enemies, D-pad left/right weapon cycling, more weapons including a katana, and a temporary test Cipher Sleeve. Preserve training/tutorial/spar, first-to-three knockdowns, no deaths, and save/menu behavior; touch-button layout tuning remains deferred. The Sleeve is test-only arsenal content, labelled TEST, and must not be presented as canon acquisition or used to invent Cipher abilities.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice decision)

2026-10-22 — Owner: make the minimap follow the character, prepare the menu map for a large open world, and add quests selectable in the menu with exactly one active quest tracked by a minimap arrow. Preserve the existing training/spar/wilderness slice, no-death rules, save/menu behavior and deferred touch-button tuning. Implemented with a pure quest log and data-driven world-map catalogue; quests use placeholder objectives/rewards rather than new canon story or abilities.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap decision)

2026-10-22 — Owner HUD/device follow-up: minimap top-left, player health/stamina top-right, Sensei treated as a 1v1 boss with health top-centre under MENU, SKIP TUTORIAL beside MENU, event feed under the minimap and visible in landscape. The minimap must keep the player at the centre, show enemies/loot as distinct dots and cover a larger area. The wilderness crash when a raider reaches the player must be fixed, and the FPS readout must be understandable (`FPS`, draw calls, triangles) rather than unexplained `DC`/`TRI`. Preserve training/spar/wilderness rules and deferred touch-button tuning. Implemented with a wider radar range, high-contrast centred player marker, HUD repositioning and a regression test for the raider strike.

2026-10-22 — Owner PWA/device follow-up: make the site installable to the Android and iOS home screen, retain touch controls on iPad even when it is treated as a PC, detect the active controller/device, and leave the custom PWA icon open for later art. Implemented a manifest, service worker offline shell (including pinned three.js), Apple meta/touch icon, optional Chromium install prompt and pure iPadOS-aware touch detection. Runtime icons are placeholders; the owner will supply a square source at `icons/source/app-icon.png` and the documented runtime filenames stay stable.

2026-10-22 — Owner collision/outpost/story follow-up: players and enemies must collide with scenery and props instead of walking through them. Do not create a story "first tower"; retain the existing structure as an enemy outpost. Reduce the title screen to essentially only the game title and buttons. Start must open a story-mode introduction with pages, NEXT until the final page, then a button that changes to EXIT. Put SKIP STORY at the top of the story box; pressing it must ask for confirmation. Keep the dialogue/story system data-driven and extensible for later story events. Preserve training/tutorial/spar, first-to-three knockdowns, no deaths, save/menu behavior, the wilderness slice and deferred touch-button tuning. Implemented a shared `collision.js` with circle/rotated-box colliders for reachable scenery, an outpost rename with old-save quest-ID migration, a minimal title, and a five-page `StoryDeck` with an inline skip confirmation. Custom PWA icon art is still pending at `icons/source/app-icon.png`.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (collision/outpost/story decision)
