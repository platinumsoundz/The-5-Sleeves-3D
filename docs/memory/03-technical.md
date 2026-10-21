# Chapter 3 — Technical plan

## Current files
- `index.html`: page shell and HUD.
- `src/main.js`: system composition and animation loop.
- `src/input.js`: normalized keyboard/gamepad/touch actions, input-type labels, and device-specific hints.
- `src/world.js`: Three.js scene, procedural placeholder fighters, arena and camera.
- `src/game.js`: tutorial and sparring rules.
- `src/config.js`: editable gameplay tuning values.
- `src/styles.css`: responsive UI.

## Design boundaries
Gameplay consumes named actions, not raw device codes. World owns render objects; game rules should not construct scenery. Keep XP/currency in future progression modules, and Cipher abilities behind a future ability interface. Do not create empty modules before a feature is needed.

## Workflow/performance
Develop on Samsung S23+ in Acode; test Samsung Internet, Chrome, and Brave. Serve over HTTP because JavaScript modules require it; Three.js loads from jsDelivr, so initial load requires internet. Procedural primitives only. Keep geometry, draw calls, shadows, and pixel ratio modest. 30 FPS is a goal, not yet measured.

## Immediate test checklist
Open on phone; confirm module/CDN loading and WebGL; tutorial progression and skip; movement, staff attack, aim hold, dodge, jump, sprint and crouch; Sensei remains passive before spar; hits and knockdowns/recovery; touch controls on touch devices; keyboard/mouse prompts on desktop; Xbox/PlayStation/generic gamepad labels and mappings; rotate/resize screen; check frame rate and console errors. Browser test has not yet been performed.
