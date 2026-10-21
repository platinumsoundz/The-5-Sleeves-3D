# Architecture and safe modification

`main.js` wires the browser loop; `input.js` maps keyboard, standard gamepad and touch; `world.js` builds the procedural arena and camera; `game.js` owns tutorial and nonlethal spar; `config.js` contains tuning values. One opponent is supported. XP/money are deferred; game logic is the future extension point. Cipher powers and story representation are excluded.
