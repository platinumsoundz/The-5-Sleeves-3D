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
10. [Decision log](../decision-log.md) — concise chronological summary.
11. [AI build log](../ai-build-log.md) — append-only record of what each model changed.

## Current operator
Primary model: `opencode/deepseek-v4.1-flash-free` (DeepSeek V4.1 Flash Free). Occasional:
ChatGPT-6 Luna, exact model ID unconfirmed. See chapter 4 before editing.

## Current milestone
Whitebox village training area: skippable tutorial, then nonlethal staff sparring with Sensei,
scored first to 3 knockdowns. Guard, block, dodge and parry share one input; Sensei telegraphs
and punishes whiffs. Touch uses a mobile-shooter layout (analog stick, right-side look, hold AIM
for zoom/lock and a left FIRE button); PC uses the standard shooter layout. Core rules, AI,
defense, controls, feedback and HUD modules are built and headless-tested; the first browser test
is still outstanding and gates any feel/tuning work.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
