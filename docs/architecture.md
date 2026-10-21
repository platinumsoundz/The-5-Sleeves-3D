# Architecture and safe modification

- `index.html` and `src/styles.css`: HUD and touch labels.
- `src/main.js`: Three.js scene wiring and animation loop.
- `src/input.js`: shared keyboard, standard gamepad, and touch action map; browser gamepad connection is detected.
- `src/world.js`: procedural whitebox village and camera.
- `src/game.js`: tutorial, movement, lock-on and nonlethal spar state.
- `src/config.js`: tunable gameplay values.

One opponent is supported. XP/money are excluded; `game.js` is the future connection point, without implemented progression. Cipher powers and story representation are intentionally excluded.
