# Chapter 4 — AI collaboration and provenance

The owner builds this project with more than one AI model and needs to know which model wrote
what, so outputs can be compared and one model can audit another.

## Owner's setup

- Primary (owner-stated, 2026-10-21): **DeepSeek V4.1 Flash Free** via OpenCode, model ID
  `opencode/deepseek-v4.1-flash-free`.
- Occasional (owner-stated): **ChatGPT-6 Luna**. The owner's name for it; the exact provider
  model ID is unconfirmed. Do not invent an ID — record what the owner says.
- The owner may switch models mid-project, and may run one model to review the other's work.

## Signature rule (owner instruction)

Every file an AI creates, or materially changes, carries a one-line signature. Signatures are
**stacked, never replaced**: append yours below the existing ones, most recent last.

```js
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: <next model> — YYYY-MM-DD
```

| File type | Form |
| --- | --- |
| `.js` | `// ai: <model> — YYYY-MM-DD` at the top |
| `.css` | `/* ai: <model> — YYYY-MM-DD */` at the top |
| `.html` | `<!-- ai: <model> — YYYY-MM-DD -->` at the top |
| `.md` | `> ai: <model> — YYYY-MM-DD` as the final line |

Use the model identifier the harness reports, not a marketing name, when both exist. Signatures
record provenance only — they are not approval and they never override the canon guardrails.

## Build log rule

Any session that changes code appends an entry to [docs/ai-build-log.md](../ai-build-log.md):
date, model, scope, files touched, tests run and their result, known gaps, and notes for the next
model. Small typo fixes do not need an entry; behavior changes do.

## Review protocol when a different model takes over

1. Read this chapter and the newest build-log entry before editing.
2. Run `npm test` before changing anything and note the baseline.
3. Make changes, then run `npm test` again.
4. Append a log entry with a verdict: **verified**, **corrected**, or **disputed**.
5. Never silently overwrite another model's work. If you disagree, keep the original and add a
   note explaining why; the owner decides.

## Why this exists

So the owner can compare models across the same task, spot regressions introduced by one model,
and have the other model check the reasoning rather than re-deriving it from scratch.

> ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
