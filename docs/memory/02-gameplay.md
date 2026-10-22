# Chapter 2 — Gameplay decisions

## Confirmed
- Single-player prototype, browser first; multiplayer is a later ambition only.
- Start in the home-village training area. Short guided tutorial is skippable; after it, free sparring with Sensei. Sensei remains passive during the tutorial.
- Staff first; the loadout order is staff → katana → unarmed → cipher test sleeve. No deaths; either fighter can be knocked down. Press A/confirm to recover. The Cipher entry is explicitly test-only and is not a story acquisition or a source of invented abilities.
- Hold LT/RMB to aim and lock on; aim switches to an over-the-shoulder camera anchored to Ajaye, not the fighter midpoint. RT/LMB attacks with the current weapon or unarmed move. A/Space jumps, B/Q guards, X/F interacts, L3/Shift sprints, R3/Ctrl crouches; Enter or Space confirms/get up. Lock-on chooses the nearest living target in the wilderness; manual target cycling is still deferred.
- D-pad left/right (`[` / `]` or touch `SWAP`) cycles weapons. Katana has its own blade stats. Unarmed uses one attack button for `punch → kick → grab`; the grab applies a short stagger instead of a knockdown. Staff remains wired to `CONFIG` so the original spar tuning and tests stay authoritative.
- Touch follows a Call of Duty Mobile-style layout: analog movement stick bottom-left; drag the right side of the screen to look; hold AIM on the right to zoom/lock (and keep looking with another finger) while a FIRE button appears under the left thumb; all other buttons sit bottom-right.
- Support touch, keyboard/mouse, Xbox/PlayStation/third-party controllers and detected-input annotations. Keyboard/controller buttons are remappable in the Controls page; touch supports size, opacity and a left-handed layout (per-button drag positioning is still deferred).
- XP/currency are not real progression yet, but the STATUS page and dev codes can hold placeholder values. Local saves are implemented; cloud persistence deferred.
- Target 30 FPS baseline on S23+; higher refresh modes are later best-effort options, not guaranteed.

## Deferred
Physical ragdoll; manual multi-target cycling; real progression/XP/currency; inventory and skill-tree content; per-button drag placement for touch; Cipher abilities and story acquisition; online networking/multiplayer; final art and character likeness.

## Working (built, headless-tested; owner browser test passed for the pre-visual build)
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
- Aim mode: FOV eases 55→42; the camera moves from the shared orbit to a fixed over-the-shoulder view roughly 4.1m behind, 0.68m to the right and 1.55m high, looking along the player’s facing. A centre reticle appears. On touch the right STAFF button is replaced by a left FIRE button.
- Touch look area is the right 45% of the canvas; the left side belongs to the joystick. During locked aim, horizontal drag is a small camera offset around the fixed shoulder view and recentres 0.45s after the last drag; vertical drag controls aim pitch.
- All sensitivities, deadzones, FOV and camera distance are placeholder values in `src/config.js`.
- Shell: title screen with Start, Resume (disabled until a save exists), Settings and a visible but disabled “Multiplayer · in development” button. Start/Esc opens the menu; Select/Tab/M opens the map. The menu pages are CHARACTER (XP/cash placeholders, tutorial, knockdowns, permissions), INVENTORY (equipped/inventory placeholders), SKILLS (locked placeholder), MAP, SETTINGS (look/quality + remapping + touch layout) and SYSTEM (save/delete, dev codes, multiplayer note).
- Save: SYSTEM → SAVE GAME writes tutorial completion, dev-granted XP/cash and permissions to `five-sleeves.save.v1`. Resume restores them; Delete removes the slot. Settings, bindings and touch layout persist separately.
- Dev codes: `DEV-XP-500`, `DEV-CASH-1000` and `DEV-GEAR-SLEEVE` are placeholders for the eventual code list; they grant save values/permissions and log to the feed. No real weapons or economy yet.
- HUD: top-left health/stamina bars, radar beneath, then the event feed; MENU top centre with the weapon chip and spar score beneath; target health/phase top right. The radar is also a map shortcut on touch/desktop. Stamina drains while sprinting and is spent by jumps/dodges. The sleeve bar is hidden unless the `TEST` sleeve is equipped, in which case it is marked as test content; no capacity, charge or ability is modelled.
- Character articulation (2026-10-22): hips/knees and the free shoulder/elbow bend for walking, crouching and attack counterbalance. Crouch is a pose rather than a root squash; the boots stay at the knee group’s planted offsets. The staff and katana are mounted at the right hand so they follow the grip through ready/block/swing. Menu tabs no longer shrink when the menu body scrolls.
- Visual pass (2026-10-22): the arena is now a repaired settlement training yard rather than a bare ring — patched perimeter fence and gate, workshop, house with warm windows, market awning, rain barrel/hand pump, solar array and battery, air-scrubber fan, laundry, crates/barrels, staff rack, trees, distant water tower/mast and a green-grey fogline. Ajaye and Sensei are low-poly whitebox silhouettes with clothing, hair, staff and simple faces. Ajaye has no story-acquired Cipher Sleeve; the visible sleeve is a left-arm-only `TEST` mesh for the temporary loadout slot. Owner reference sheets are still needed before claiming likeness.
- Wilderness slice (2026-10-22): the north gate opens via USE/F into a wide open route (x ≈ ±31, z −67 to −13.2) with a worn track, scrub, boundary posts, rocks and dead trees. Four separate raiders (`raider-1`…`raider-4`) hold the route at z −22.5, −33, −45 and −55; two carry staffs and two katanas, each has 45 HP and stays down when defeated. Reaching `z <= −61` triggers the first-tower test message. Raiders do not award spar points and Sensei AI is disabled while outside the yard.
- HUD/loadout: a weapon chip shows the current loadout; the target panel shows Sensei or the nearest living raider; spar score pips hide in the wilderness. Radar/map nodes show living raiders. The sleeve vital appears only while the test sleeve is equipped and is marked as test content.
- Browser status: owner tested the 2026-10-22 visual pass on the S23+ and reported successful play with no frame drops. The feet/staff/over-the-shoulder-aim follow-up and the weapon/wilderness/raider pass still need their own device pass. Touch layout remains intentionally deferred.
- Pause/settings: menu freezes simulation; look sensitivity (0.4–2×), invert-Y and graphics quality (performance 1×, balanced ≤1.5×, sharp ≤2.5× pixel ratio) plus remapping and touch layout all persist in local storage.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (settlement/character visual pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated limbs and menu stability)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (planted feet, hand-mounted staff, over-the-shoulder aim)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice; test-only sleeve)
