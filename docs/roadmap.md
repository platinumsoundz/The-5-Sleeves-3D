# Roadmap — The 5 Sleeves browser game

This roadmap is shared guidance for ChatGPT, DeepSeek and future contributors. It separates the current playable prototype from proposed visual/content work. A story reference is not an approved game feature or proof it is implemented. Read `docs/memory/README.md`, then relevant memory chapters before changing code. Inspect the current implementation and tests first; record material decisions and AI provenance using the existing project workflow.

## Now — protect and verify the training prototype

**Current milestone:** village training and nonlethal staff sparring with Sensei. Preserve controls, restart/reset behavior, tutorial/spar phases, first-to-three knockdowns, no deaths, headless rules tests and modular architecture.

**Status: implemented and device-tested.** The owner tested the 2026-10-22 browser build on the S23+ and reports successful play with no frame drops. The feet/staff/over-the-shoulder-aim follow-up still needs a device pass. Touch-button layout remains deferred. Recheck camera/readability only when changing combat framing or the settlement. Do not tune performance or claim feel based only on headless tests.

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
- Weaponless sparring stance: proposal only. Requires owner scope for toggle vs scenario, reach/damage/cooldown, animation set, tutorial/menu treatment and how it coexists with the staff; do not invent those rules.

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
