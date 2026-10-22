# Roadmap — The 5 Sleeves browser game

This roadmap is shared guidance for ChatGPT, DeepSeek and future contributors. It separates the current playable prototype from proposed visual/content work. A story reference is not an approved game feature or proof it is implemented. Read `docs/memory/README.md`, then relevant memory chapters before changing code. Inspect the current implementation and tests first; record material decisions and AI provenance using the existing project workflow.

## Now — protect and verify the training prototype

**Current milestone:** village training, nonlethal staff sparring with Sensei, a wilderness test route past four raiders and an enemy outpost to a walkable First Tower, solid scenery collision, a skippable offline story opening, levels/XP/cash, inventory/equipment, passive skills, enemy vision and defence, a limited test-sleeve scan, and one-at-a-time quest tracking on a north-up minimap. Preserve controls, restart/reset behavior, tutorial/spar phases, first-to-three knockdowns, no deaths, headless rules tests and modular architecture.

**Status: training and settlement/character pass device-tested; progression/inventory/skills/tower/scan/enemy-vision/north-up minimap and collision/story/title pass headless-tested only.** The owner tested the 2026-10-22 settlement/character browser build on the S23+ and reports successful play with no frame drops. The newer systems still need an owner browser/device pass for layout, camera framing, tower interior, scan overlay, minimap feel and performance. Touch-button layout remains deferred. Do not claim feel from headless tests alone.

## Weapon and wilderness test slice

**Status: implemented; headless-tested; browser/device pass pending.** The north gate opens via USE/F into a bounded open route (x ≈ ±31, z −112 to −13.2) with four separate raiders, a worn track, an occupied enemy outpost and the First Tower beyond it. D-pad left/right (or `[`/`]`, or touch `SWAP`) cycles staff → katana → unarmed → cipher test sleeve. Unarmed uses a one-button punch → kick → grab sequence; grab staggers instead of knocking down. Raiders have their own HP, vision, alert, defence and knockdown state and do not award spar points. Reaching within 6.4m of the outpost at `(0, −63)` records outpost progress; the road continues to the tower at `(0, −91)`. Reachable props and tower walls publish solid colliders, so the player, Sensei and raiders stop or slide instead of walking through them. The `CIPHER SLEEVE · TEST` entry is temporary developer content: not a story acquisition, not a canon ability, and left-arm-only.

**Known limits:** no melee target cycling beyond nearest living target, no raider recovery after a knockdown, no persistence of individual raider state, placeholder raider silhouettes and outpost geometry, and touch layout/button tuning remains deferred. The route and tower exist as a test slice, not approved story geography.

## Quest tracking and expanded-world map

**Status: implemented; headless-tested; browser/device pass pending.** The QUESTS menu page offers five objectives built from existing progress hooks: reach the enemy outpost, knock down all four wilderness raiders, enter the First Tower, link its five channels, or win a spar. Older `first-tower` quest IDs migrate to `scout-outpost` when a save is restored. Exactly one quest can be active; selecting another replaces it, completion clears the slot and pays XP/cash once, and the save slot restores active/completed state. The HUD radar is north-up: the player stays centred, targets use world axes, the player heading arrow rotates, and the quest arrow clamps to the rim. Both menu maps are projected from `src/worldmap.js` bounds/regions/points of interest, and the active objective is marked in cyan. Adding a region or quest is a data change.

**Known limits:** five quests only; no quest chains, dialogue, choices, failure states or timers; the map is a test-world projection without pan/zoom; menu quest cards are rebuilt only when `questVersion` changes, which is sufficient while the menu is paused.

## Progression, First Tower, tactical scan and multiplayer scaffolding

**Status: implemented; headless-tested; browser/device pass pending.** Levels 1–20 use a rising XP curve and grant one skill point per level. Cash, quest/encounter rewards and dev codes feed one ledger. A 24-slot inventory holds prototype items with rarity, value, level requirement and stat rolls; equipment bonuses merge with level and passive-skill bonuses into the same combat/movement stats. The starter kit gives the player real attack, defence and vitality. The First Tower is walkable beyond the outpost and has an outer monumental shell, an inner control chamber, a central dais, five channels and a console. Linking it is a local prototype that awards XP/cash and a guardian plate and opens a short story deck; Cipher is silent and no activation power or global effect is defined. Aiming with the test sleeve shows a limited target scan (level, HP, abilities, weaknesses, LIVE/CACHED tag). `src/multiplayer.js` provides pure lobby/presence/party/chat state and an outbox for a future transport; it is not imported by story mode and no live networking exists.

**Known limits:** prototype item/skill numbers, no shop/economy loop, no raider-state persistence, no tower activation decision or Cipher dialogue, scan covers only observed tactical data, and multiplayer needs a backend/transport plus an owner-approved mode boundary. All new visuals and HUD layouts still need a real phone/tablet render. Do not treat the tower link or scan as canon mechanics until the owner approves them.

## Offline story opening and minimal title

**Status: implemented; headless-tested; browser/device pass pending.** The title screen is reduced to the game title and buttons. Start/Enter opens a five-page story introduction from `src/story.js`; NEXT advances and the final page button becomes EXIT. SKIP STORY is at the top of the story box and asks for confirmation before starting. Resume bypasses the introduction. The opening pages are broad mood/setting text, deliberately avoiding new canon, named geography, Cipher powers or tower activation. The reusable deck also presents a short tower-link scene that keeps Cipher silent. The deck is reusable for later story events.

**Known limits:** no story choices, branching, save marker for seen pages or dialogue portraits yet; the story overlay and title spacing still need a real phone/tablet render.

## Next visual milestone — make the whitebox read as a familiar settlement

**Status: implemented and device-tested (procedural first pass; reference sheets still required for final likeness).**

**Intent:** replace the anonymous arena impression with a recognizable, inhabited, near-future village training yard while retaining inexpensive procedural geometry and the existing combat footprint. This is a visual/presentation pass; it does not expand gameplay or change story canon.

Possible visual language grounded in Book One drafts and the canon guide:
- Keep a clear, readable training surface and safe combat space; do not crowd the fighters or obscure staff movement/camera framing.
- Add a small set of modular low-poly/primitive structures at the perimeter: patched fence/gate, reused public-building or workshop shapes, simple rooflines, a water-pump silhouette, rain barrel, repair materials, crates, hand-built solar panels/battery boxes, filter-fan housing, and restrained market/settlement props.
- Use recognisable modern forms with repaired/reused construction, not medieval fantasy, generic cyberpunk, or a featureless wasteland. The location should feel inhabited and maintained by people.
- Establish depth and location through a distant perimeter, sparse housing/utility silhouettes and a soft green-grey Fogline beyond the safe yard. Keep local visibility readable; outdoor air is not universally unsafe.
- Use muted charcoal, slate, fog-grey, weathered brown/olive/rust, and restrained warm interior/dawn light. Cyan/blue should be reserved for established Sleeve/interface technology; do not add random glowing tech.
- Retain readable silhouettes, low material count, simple lighting and instanced/reused geometry where useful. Avoid dense foliage, many unique draw calls, costly real-time shadows, high-resolution textures, or decorative detail that competes with combat.

**Acceptance checks:** the training ring and both fighters remain easy to see from the gameplay camera; movement/collision/rules are unchanged; the setting reads as lived-in and contemporary; visual dressing is presentation-only; desktop and phone layout remain usable; performance is measured on target hardware before increasing detail.

## Character whitebox — shape before likeness

**Status: implemented (articulated procedural silhouettes; not final likeness).**

The story/visual references do help establish character design direction: Ajaye is a practical, dark-layered scavenger with dense curly brown hair and a left-arm-only Cipher Sleeve after discovery; Sensei is a disciplined practical teacher; Korb is agile/expressive with an emerald Wind Sleeve only after his spirit chooses him. Approved model sheets outrank text descriptions. Exact character reference images are not currently available in the project, so do not claim a faithful likeness or invent facial specifics.

A staged code approach:
1. Improve generic capsule stand-ins into readable low-poly silhouettes (head/hair mass, torso/limb proportions, basic clothing layers, boots, staff) without detailed faces.
2. Add gear and damage only when the scene/story state supports it. Keep character parts grouped and materials named so later replacement is simple.
3. When approved reference images are supplied, reconcile silhouette, proportions, colors, clothes and accessories before refining. For this 3D game, translate the sheet into meshes/materials or approved image textures; do not paste comic panels or use portrait-page settings as the game canvas.
4. Add the Cipher Sleeve only in scenes after the bond, on Ajaye's left arm only; keep his right arm normal. Korb's Wind device/effects are later content, not part of the opening training scene unless story timing changes by approval.

Character rendering is a presentation layer. Keep gameplay rules independent of mesh internals; use stable root transforms/anchors for movement, staff, feedback and future equipment. Avoid putting unapproved abilities, character dialogue, or lore into placeholder visuals.

## Later narrative/gameplay candidates — not committed features

Only add after the owner selects scope and the current milestone is stable:
- Interactive settlement repairs, trade, supplies and route preparation.
- Exploration between settlements with variable environmental exposure, navigation, transport limits and credible resource sources.
- Cipher scans/connectivity as limited, access- and energy-dependent tools; no universal map or automatic solution.
- Korb/partner cooperation where spirits and characters retain agency; stamina, device energy and spirit willingness remain distinct.
- Adaptive tower guardians with observable patterns; exact prose tactics (for example the draft vent sequence) are not assumed to be game mechanics.
- Local tower improvements and story transitions; no global Fog-clearing reward by default.
- Unarmed combat refinement: the first pass is a one-button punch → kick → grab combo. Further stances, grabs/throws, target selection and tutorial/menu treatment need owner scope and must preserve the spar rules.

Do not invent module names, energy units/capacities, transfer/storage/simultaneous-use rules, lore explanations, or unresolved collapse causality to fill a mechanic gap. Mark prototypes as placeholders until owner-approved.

## Cross-device and performance guardrails

- Browser-first, responsive, touch/keyboard/mouse/controller support remains the goal.
- S23+ target and 30 FPS baseline are met/exceeded in the owner’s current device test (no frame drops reported); keep reporting FPS, draw calls and triangles during future content additions.
- Prefer simple procedural geometry, restrained materials and controlled draw calls; measure before adding effects. The HUD FPS readout also reports draw calls and triangles so device checks can record a concrete budget.
- Recheck camera framing, combat readability, menu/HUD legibility and touch reach after environment changes.
- Browser screenshots/video are evidence for visual QA; headless tests remain evidence for pure game rules, not visual fidelity.

## Documentation and handoff

After any roadmap item is started, update this page with status (proposed / in progress / implemented / verified), exact scope, test evidence, device/browser, and known limitations. Update `docs/memory/02-gameplay.md` only when an owner decision changes gameplay scope; update canon notes only when story/canon is deliberately approved. Append AI changes to `docs/ai-build-log.md`; retain existing signatures and append rather than overwrite.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (status update only; original roadmap material supplied by owner/ChatGPT)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (performance readout note)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated limbs and menu stability)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (feet/staff/aim follow-up scope)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice status; test-only sleeve)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass status)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (solid scenery, enemy outpost, story introduction status)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (progression, First Tower, scan, enemy defence, north-up minimap, multiplayer scaffolding status)
