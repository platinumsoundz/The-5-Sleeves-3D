// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Pure control math shared by the browser input layer and the headless tests.
// No DOM, no window: safe to unit test.
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Rescales a raw axis past a deadzone so small drift is zero and full tilt still reaches 1.
export function deadzone(value, threshold = .18) {
  if (threshold <= 0 || threshold >= 1) return clamp(value, -1, 1);
  const magnitude = Math.abs(value);
  if (magnitude <= threshold) return 0;
  const scaled = (magnitude - threshold) / (1 - threshold);
  return Math.sign(value) * clamp(scaled, 0, 1);
}

// Touch joystick: offset in pixels from the base centre. Returns screen-space x/y (y grows down)
// already multiplied by magnitude, plus the magnitude itself. Gameplay treats y as forward -z.
export function joystick(dx, dy, radius, dead = .15) {
  if (!(radius > 0)) return { x: 0, y: 0, magnitude: 0 };
  const length = Math.hypot(dx, dy);
  if (length < radius * dead) return { x: 0, y: 0, magnitude: 0 };
  const magnitude = clamp((length - radius * dead) / (radius * (1 - dead)), 0, 1);
  return { x: (dx / length) * magnitude, y: (dy / length) * magnitude, magnitude };
}
