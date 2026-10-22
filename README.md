# The 5 Sleeves — Training Ground & Wilderness Slice

This is the procedural training-yard and wilderness prototype. Serve it over HTTP and open `localhost:8000`. It requires WebGL and three.js from the CDN; no external art assets are needed.

The playable loop is still nonlethal: train with Sensei, then spar to the first three knockdowns. The north gate now opens into a wide wilderness route with four raiders and the silhouette of the first tower. D-pad left/right (or `[` / `]` on keyboard, `SWAP` on touch) cycles `staff → katana → unarmed → cipher test sleeve`; the staff remains first so the existing tutorial and spar flow are unchanged. Unarmed uses one attack button for a `punch → kick → grab` sequence; the grab staggers rather than scoring a knockdown. Raiders use separate encounters and do not award spar points. No deaths, save/menu behavior and first-to-three sparring are preserved.

**Test-only content:** the `CIPHER SLEEVE · TEST` loadout exists only to exercise an equipment slot and a left-arm mesh. It is not a story acquisition, does not unlock or invent Cipher powers, and is labelled as developer test content in the HUD and gear page. Ajaye still has no story-acquired Sleeve in this opening scene. The test mesh is left-arm-only, as required if a Sleeve is ever shown.

Keyboard/mouse: WASD/arrows move, left-click attack, `[`/`]` cycle weapons, right-click hold to aim/lock, Space jump/get up, Shift sprint, Ctrl crouch, Q (or K) guard — tap to block, direction to dodge, time it just before impact to parry — F interact/use, Enter confirm; drag to orbit and pitch the camera. Standard gamepad: left stick move, right stick look, D-pad left/right cycle weapons, LT aim/lock, RT attack, A jump/get up, B guard, X interact/confirm, L3 sprint, R3 crouch. Touch uses the existing mobile-shooter layout: analog stick bottom-left, drag the right side to look, hold AIM for the fixed over-the-shoulder view, `SWAP` cycles weapons, and the other buttons sit bottom-right. Touch-button size and placement remain deferred at the owner's request.

At the north gate, stand near it and press USE/F to move into the wilderness; USE/F at the gate on the wilderness side returns to the yard. Follow the track to the first tower. Reaching it ends the current test slice. The raiders use the same nonlethal knockdown/recovery rules as the spar but are separate from Sensei and the match score. The camera follows Ajaye in the wilderness and the over-the-shoulder aim stays player-anchored.

The tutorial guides movement, attack, aim/lock and guard/dodge/parry and can be skipped. Sensei is passive until spar, then telegraphs with a HUD `!` before striking. Both fighters can be knocked down and recover; a downed player must confirm to get up. Three blocked hits in a row break the guard. MENU (top-right) or Esc pauses and opens look sensitivity, invert-Y and graphics-quality settings, stored locally. XP/currency and Cipher powers remain deferred.

The Cipher Sleeve HUD meter stays hidden unless the test sleeve is equipped. Hips, knees and the free arm are articulated for walking, crouching and attack counterbalance; boots stay planted and the staff/katana is mounted in the right hand. Character likeness still requires approved reference sheets. The 2026-10-22 settlement/character visual pass was device-tested by the owner without reported frame drops; **this weapon/wilderness/raider pass has not been browser- or device-rendered here**, so its camera framing, raider silhouettes, sleeve test mesh and performance still need an owner pass. Run `npm test` for the 58 headless checks; the in-game FPS readout also reports draw calls and triangles for device checks. See `docs/architecture.md`, `docs/memory/02-gameplay.md`, provenance in `docs/memory/04-ai-collaboration.md`, and `docs/ai-build-log.md`.

Current preview is commit-pinned because raw.githack's `/main/` path can serve cached modules: `https://raw.githack.com/platinumsoundz/The-5-Sleeves-3D/1aea0d9/index.html`.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (settlement/character visual pass; sleeve meter hidden until acquisition)
> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated limbs and menu stability)
> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (planted feet, hand-mounted staff, over-the-shoulder aim)
> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice; test-only sleeve)
