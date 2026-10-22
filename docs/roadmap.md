# Roadmap — The 5 Sleeves browser game

This roadmap is shared guidance for ChatGPT, DeepSeek and future contributors. It separates the current playable prototype from proposed visual/content work. A story reference is not an approved game feature or proof it is implemented. Read `docs/memory/README.md`, then relevant memory chapters before changing code. Inspect the current implementation and tests first; record material decisions and AI provenance using the existing project workflow.

## Now — protect and verify the training prototype

**Current milestone:** village training, nonlethal staff sparring with Sensei, a wilderness test route to the enemy outpost, solid scenery collision, a skippable offline story opening, and one-at-a-time quest tracking on a player-following minimap. Preserve controls, restart/reset behavior, tutorial/spar phases, first-to-three knockdowns, no deaths, headless rules tests and modular architecture.

**Status: training and settlement/character pass device-tested; weapons/wilderness/raider/quest/HUD/PWA and collision/story/title pass headless-tested only.** The owner tested the 2026-10-22 settlement/character browser build on the S23+ and reports successful play with no frame drops. The feet/staff/aim follow-up, weapon/wilderness/raider pass, quest/minimap pass, HUD/PWA pass and collision/story/title pass still need their own device pass. Touch-button layout remains deferred. Recheck camera/readability only when changing combat framing or the settlement. Do not tune performance or claim feel based only on headless tests.

## Weapon and wilderness test slice

**Status: implemented; headless-tested; browser/device pass pending.** The north gate opens via USE/F into a bounded open route (x ≈ ±31, z −67 to −13.2) with four separate raiders, a worn track and an occupied enemy outpost. D-pad left/right (or `[`/`]`, or touch `SWAP`) cycles staff → katana → unarmed → cipher test sleeve. Unarmed uses a one-button punch → kick → grab sequence; grab staggers instead of knocking down. Raiders have their own 45 HP, AI and knockdown state and do not award spar points. Reaching within 6.4m of the outpost at `(0, −63)` ends the current test slice. Reachable props publish solid colliders, so the player, Sensei and raiders stop or slide instead of walking through them. The `CIPHER SLEEVE · TEST` entry is temporary developer content: not a story acquisition, not a canon ability, and left-arm-only.

**Known limits:** no melee target cycling beyond nearest living target, no raider recovery after a knockdown, no persistence of wilderness state, placeholder raider silhouettes and outpost geometry, and touch layout/button tuning remains deferred. The route exists as a test slice, not approved story geography.

## Quest tracking and expanded-world map

**Status: implemented; headless-tested; browser/device pass pending.** The QUESTS menu page offers three starter objectives built from existing progress hooks: reach the enemy outpost, knock down all four wilderness raiders, or win a spar. Older `first-tower` quest IDs migrate to `scout-outpost` when a save is restored. Exactly one quest can be active; selecting another replaces it, completion clears the slot and pays placeholder XP once, and the save slot restores active/completed state. The HUD radar is a player-centred follow view with a cyan arrow clamped to the rim plus a compact tracker. Both menu maps are projected from `src/worldmap.js` bounds/regions/points of interest, and the active objective is marked in cyan. Adding a region or quest is a data change.

**Known limits:** three quests only; placeholder XP rewards; no quest chains, dialogue, choices, failure states, timers or canon story rewards; the map is a test-world projection without pan/zoom; menu quest cards are rebuilt only when `questVersion` changes, which is sufficient while the menu is paused.

## Offline story opening and minimal title

**Status: implemented; headless-tested; browser/device pass pending.** The title screen is reduced to the game title and buttons. Start/Enter opens a five-page story introduction from `src/story.js`; NEXT advances and the final page button becomes EXIT. SKIP STORY is at the top of the story box and asks for confirmation before starting. Resume bypasses the introduction. The pages are broad mood/setting text, deliberately avoiding new canon, named geography, Cipher powers or a story tower. The deck is reusable for later story events.

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
