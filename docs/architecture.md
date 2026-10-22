# Architecture and safe modification

`main.js` wires the browser loop and the title/menu chrome. `input.js` normalizes keyboard,
standard gamepad and touch into named actions plus an analog move vector and right-stick look;
nothing downstream reads raw device codes or touch coordinates. `device.js` holds the pure
touch/standalone detection hints, including the iPadOS desktop-UA case. An active source changes
tutorial prompts, while `touchUI` keeps the touch control surface visible on tablets even when a
keyboard or paired controller is the last-used source. Bindings are sanitized in
`bindings.js`, and remapping swaps displaced keys/buttons so no action silently loses its input.
Pure deadzone/joystick math lives in `controls.js` so it can be tested without a browser.
`world.js` owns the Three.js scene, training/wilderness camera zones, orbit camera, fixed
over-the-shoulder aim view and viewport. `scenery.js` builds the procedural settlement, the
wilderness track and the enemy-outpost silhouette, and publishes circle/rotated-box collider data
for reachable props; `collision.js` resolves actor circles against that data. `characters.js`
builds the Ajaye, Sensei and raider silhouettes with articulated hip/knee and shoulder/elbow
pivots. `story.js` holds the data-driven offline opening and a small deck controller; `main.js`
owns the story overlay and Skip confirmation. `game.js` orchestrates screens, tutorial, movement,
weapon selection, strikes, gate/zone transitions, rounds, saves and match end, and is the only
class the browser entry point touches.

Rules are split so they cannot drift apart and can be tested without a renderer:

| Module | Responsibility |
| --- | --- |
| `fighter.js` | nonlethal HP, knockdown, auto-recovery and confirm-to-rise |
| `combat.js` | per-weapon attack cooldown, swing/attack progress, dodge window and direction |
| `weapons.js` | loadout order, katana/unarmed/test-sleeve stats, dynamic staff stats |
| `ai.js` | Sensei/raider decisions: approach, wind-up, strike, recover |
| `match.js` | knockdown points, winner, first to `CONFIG.pointsToWin` |
| `events.js` | synchronous pub/sub between gameplay and presentation |
| `hud.js` | gameplay HUD DOM writes; receives elements, never queries them |
| `controls.js` | pure deadzone, joystick and clamp math |
| `device.js` | pure touch capability and standalone-display detection hints |
| `settings.js` | look/quality/touch-layout defaults, clamping and storage I/O |
| `bindings.js` | keyboard/controller bindings, sanitize/swap/persist |
| `save.js` | versioned local save slot, sanitize/load/write/delete |
| `devcodes.js` | developer code registry and pure save transforms |
| `quests.js` | quest catalogue, one-active quest log, objective resolution, completion checks and legacy quest-ID migration |
| `worldmap.js` | data-driven world bounds, regions, points of interest and map projection |
| `collision.js` | pure circle-vs-circle and circle-vs-rotated-box actor resolution |
| `story.js` | data-driven opening pages and the StoryDeck navigation controller |
| `radar.js` | forward-up, player-centred world-to-radar projection |
| `resources.js` | clamped regenerating stamina resource |
| `log.js` | bounded HUD event feed |
| `config.js` | tuning values only |

`scenery.js` and `characters.js` import Three.js and are browser-only presentation modules:
`world.js` composes them and never reads gameplay rules from them. They share low-poly geometry,
cached materials and a canvas-texture ground/sky; no shadow maps or post-processing is used.
The training scene is the pre-Cipher settlement: Ajaye has wrapped forearms and no story-acquired
Sleeve, and the set dressing is generic repaired infrastructure, not story locations or named
props. The temporary `CIPHER SLEEVE · TEST` loadout adds a left-arm-only test mesh and a test HUD
meter while equipped; it is developer test content, not a story acquisition or a canon ability.
The wilderness track and enemy-outpost silhouette are prototype presentation for this slice, not
a claim that the outpost, raiders or route are final story locations. The outpost reuses the
existing relay/guard geometry; it is not a new story tower. Reachable buildings, stalls, trees,
bushes, rocks, posts, crates, barrels, sacks and the outpost publish solid colliders. Actor
movement resolves against them in `collision.js`, with world bounds applied between passes.

`game.js` passes stub world/input/ui objects in tests, so no module below it may touch
`document`, `window` or `THREE`. New presentation concerns subscribe to `events` or extend
`hud.js`; new rules go in their own module, not in `game.js`.

Defense uses a single `guard` action. On the press edge `game.js` asks for a direction: with one
it starts a dodge (i-frames), without one it starts a block and opens the parry window. Holding
guard keeps blocking; three blocked hits inside the window break the guard. All of those timers
live in `combat.js`, never in the input layer.

Presentation is push-only: `main.js` passes `setFeedback({ senseiWindingUp, playerBlocking,
aiming, crouching, swing, weapon, attackMove, attackProgress })` to `world.js` each frame and
forwards gamepad look plus `hit`/`parry`/`block`/`grab`/`sleeve-pulse` events. `game.js` calls
`world.setZone('training'|'wilds')` on gate/restart transitions, and `world.look(dx, dy)` handles
mouse/touch drags internally. No render module reads gameplay state directly. The frame loop
skips updates while the document is hidden, and `index.html` reports a load failure if the CDN
module never arrives.

Touch is laid out like a mobile shooter: the joystick owns the bottom-left, the right 45% of the
canvas is the look area, and the right cluster holds aim/attack/jump/guard/crouch/sprint/use/swap.
Holding aim switches the camera to a player-anchored over-the-shoulder view and reveals `#fire` under the left thumb. `Hud.sync` is what toggles those elements;
`input.js` only reads the DOM nodes for the stick and buttons. Because a held button can disappear
(MENU pauses, STAFF hides while aiming), pointer releases are also caught on `window` so an action
cannot stay stuck down.

Screens live in `game.js` as `screen: title | menu | map | playing`. Only `playing` simulates;
the others stay paused while still rendering. `paused` mirrors `screen !== 'playing'` for older
callers. The menu overlay is the old `#settings` element, now a tabbed shell; the map is its own
overlay. `Hud.sync` decides which gameplay HUD/touch elements are visible. Menu-chrome mounting,
binding-row construction, quest-card construction, save/dev buttons and live touch CSS variables
are handled by `main.js` because they are browser-only shell concerns. Gameplay HUD writes remain
in `hud.js`.

The title is intentionally reduced to the game title and buttons. `Game` accepts an optional
`requestStart` hook; the browser passes one that opens the story overlay, while headless tests
without it still call `startNew()` directly. Start/Enter opens the five-page deck. NEXT advances;
on the final page the button becomes EXIT. SKIP STORY is at the top of the story box and opens an
inline confirmation. `Hud.sync` owns the title's `hidden` state, so the story overlay also hides
the title with `style.visibility` while it is open. Story pages and `StoryDeck` live in
`story.js`; the browser-only overlay wiring lives in `main.js`.

`quests.js` is pure: it owns the quest definitions, the single active slot, completion checks,
objective target resolution, legacy `first-tower` ID migration and serialisable snapshots. `Game`
feeds it outpost/raider/spar progress from existing hooks and publishes the active quest view to
`Hud`. The menu's QUESTS page rebuilds
from `Game.questEntries` only when `questVersion` changes. `worldmap.js` owns world bounds, regions
and points of interest; both menu maps build their region/POI overlays from that catalogue, while
`Hud` projects live player, Sensei, raider and quest markers through the same bounds. The HUD radar
remains a player-centred follow view: the player is a high-contrast gold marker at the centre,
targets are projected forward-up relative to the player's yaw, and the quest arrow clamps to the
rim. Its follow range is `CONFIG.radarRange` in the yard and `CONFIG.radarWildRange` in the
wilderness. Adding a region or quest is a data change, not a new projection path.

`manifest.webmanifest` and `sw.js` provide PWA installability. The worker precaches the app shell,
the runtime icons and the pinned jsDelivr three.js module; navigations are network-first with an
offline shell fallback, while static assets use stale-while-revalidate. Chromium's deferred
`beforeinstallprompt` drives the optional title-screen install button; iOS uses the manifest and
Apple touch icon plus Share → Add to Home Screen. Icons are generated placeholders under `icons/`
with a documented source-art handoff in `icons/README.md`.

`settings.js` owns validation and storage I/O for look/quality/touch; `main.js` loads settings,
passes them to `world.setSettings`/`setQuality`, and reflects the controls. `save.js` persists
tutorial completion, dev-granted XP/cash/permissions and the active/completed quest snapshot under
a separate key; `bindings.js` persists remaps under another. Deleting the save never deletes
controls or settings.

The training yard has one sparring opponent, Sensei. Sensei is passive during the tutorial. Both
fighters can be knocked down; a downed player must confirm before the next round starts, while
Sensei recovers on his own. The wilderness uses separate raider encounters with their own AI and
HP; their knockdowns do not award spar points. Raiders do not currently recover after a defeat.
The north gate requires USE/F rather than walking through the fence; the training bounds stop the
player short of it. XP/money progression, inventory/skill content and Cipher powers remain
deferred, with extension points preserved. Dev codes may write placeholder XP/cash/permissions,
but nothing consumes them in combat. Cipher abilities must sit behind a future ability interface,
and Ajaye's Sleeve stays left-arm-only if shown. The opening training scene has no story-acquired
Cipher Sleeve, so no capacity is modelled. The test-only sleeve mesh is presentation for the
loadout cycle; the sleeve HUD meter only appears while it is equipped. The owner has
browser-tested the settlement/character visual build on the S23+ with no reported frame drops;
the weapon/wilderness/raider/quest/HUD/PWA pass still needs its own browser/device check.
Touch-button size, placement and feel remain deferred at the owner's request.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (settlement/character visual pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated limbs and menu stability)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (over-the-shoulder aim)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice; test-only sleeve)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (HUD/PWA/device detection follow-up)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (solid scenery, enemy outpost rename, story introduction)
