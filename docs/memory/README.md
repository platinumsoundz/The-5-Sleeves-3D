# Project memory index

Read this page first, then only open the relevant chapter. Status labels: Confirmed = owner decided; Working = implementation/design direction; Open = unresolved; Draft = supplied source not yet approved.

## Chapters
1. [Canon guardrails](01-canon.md) — world rules and game adaptation constraints.
2. [Game design decisions](02-gameplay.md) — prototype scope, controls, and deferred mechanics.
3. [Technical plan](03-technical.md) — architecture, performance, and testing.
4. [AI collaboration](04-ai-collaboration.md) — model provenance, signatures and review protocol.
5. [Visual style & rendering](05-visual-style.md) — palette, linework, lighting, materials, composition and page rules.
6. [Character visual continuity](06-character-visuals.md) — detailed appearance notes for Ajaye, Korb, Sensei, Mother and Kael.
7. [Cipher visual reference](07-cipher-visuals.md) — identity distinction, portrait, hologram treatment and visual limitations.
8. [Book One visual production](08-book1-visual-production.md) — Canva prompt-pack status, page sequencing and continuity checklist.
9. [Book One story & game adaptation](09-book1-story-game-adaptation.md) — detailed working-manuscript beats, status/conflicts, and game adaptation guardrails.
10. [Master canon & five-book saga](10-master-canon-and-saga.md) — Bible rules, technology/spirits limits, open mysteries, and working saga summary.
11. [Decision log](../decision-log.md) — concise chronological summary.
12. [AI build log](../ai-build-log.md) — append-only record of what each model changed.

## Current operator
Primary model: `opencode/deepseek-v4.1-flash-free` (DeepSeek V4.1 Flash Free). Occasional:
ChatGPT-6 Luna, exact model ID unconfirmed. See chapter 4 before editing.

## Current milestone
Whitebox village training area plus a wilderness test route: skippable tutorial, nonlethal sparring
with Sensei scored first to 3 knockdowns, and four separate raiders guarding the path past an enemy
outpost to a walkable First Tower. Staff → katana → unarmed → test sleeve cycle on D-pad left/right;
unarmed is a punch → kick → grab combo. Guard, block, dodge and parry share one input; Sensei
telegraphs and punishes whiffs. Raiders now use vision cones, `?`/`!` alerts, auto-approach and
player-like block/parry/dodge reactions. Levels/XP/cash, a 24-slot inventory, equipment bonuses and a
passive skill tree are real local-save progression; the test sleeve provides a limited aim scan.
Touch uses a mobile-shooter layout (analog stick, right-side look, hold AIM for zoom/lock, left FIRE
and a SWAP button); PC uses the standard shooter layout. The settlement and character visual pass was
owner-tested; the progression/tower/scan/enemy-vision/north-up-minimap pass is headless-tested and
still needs a browser/device pass. `src/multiplayer.js` is a future-mode client-state scaffold only;
it is not wired into story mode. The `CIPHER SLEEVE · TEST` entry is temporary developer content, not
story acquisition or canon. The tower link is a silent local prototype; its exact activation effect
and first Cipher speech are unresolved.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness milestone note; test-only sleeve)

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (progression, First Tower, scan, enemy defence, north-up minimap, multiplayer scaffold milestone note)
