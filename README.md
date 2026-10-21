# The 5 Sleeves — browser whitebox

A small training-yard prototype. Serve this folder over HTTP (for example: python -m http.server 8000) and open http://localhost:8000. Requires WebGL and internet: Three.js 0.160.0 loads from jsDelivr CDN. No build step.

Keyboard: WASD/arrows move, J attack, K dodge, Space jump, Shift sprint (L3), Ctrl crouch (R3), E lock-on, Enter get up. Touch controls are on-screen. Gamepad: left stick moves; A jump, B dodge, X attack, Y lock, shoulder sprint, D-pad up crouch, Start get-up. Tutorial can be skipped. No deaths. XP/currency are excluded. Cipher Sleeve/powers are unspecified and not depicted.

See docs/README.md for project memory. Files are divided by entry point, input, world and gameplay. Test on actual target hardware before relying on performance; a 30fps baseline is a goal, not a verified result.
