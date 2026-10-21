# Architecture and safe modification

- index.html: viewport, HUD and touch labels.
- src/styles.css: responsive layout.
- src/main.js: module wiring and animation loop.
- src/input.js: shared keyboard/gamepad/touch action map; add controls here.
- src/world.js: procedural geometry and camera; visual tuning belongs here.
- src/game.js: tutorial, movement and spar logic. Keep recovery non-lethal. A future XP/currency module can connect here without mixing with input.

Small modules avoid build tooling. Geometry is intentionally simple for mobile. Lock-on currently toggles a single target; multi-target selection is not implemented. Jump, crouch and dodge controls are mapped but their game actions are placeholders. Add features incrementally and preserve canon guardrails.
