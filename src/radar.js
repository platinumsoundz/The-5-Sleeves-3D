// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (north-up bird's-eye minimap)
// World-to-radar projections. `birdseyeOffset` is the live minimap: north (negative Z) is up,
// the player is centred, and the map does not rotate when the player turns. Targets outside the
// ring are pinned to the rim so they still indicate a compass bearing. Pure for headless tests.
export function birdseyeOffset(player, target, limit = 24, radius = 32) {
  const dx = target.x - player.x;
  const dz = target.z - player.z;
  let x = (dx / limit) * radius;
  let y = (dz / limit) * radius;
  const length = Math.hypot(x, y);
  const clamped = length > radius;
  if (clamped && length > 0) {
    x = (x / length) * radius;
    y = (y / length) * radius;
  }
  return { x, y, clamped };
}

// Legacy forward-up projection retained for older callers and regression tests.
export function radarOffset(player, yaw, target, limit = 6, radius = 46) {
  const dx = target.x - player.x;
  const dz = target.z - player.z;
  const forward = dx * Math.sin(yaw) + dz * Math.cos(yaw);
  const right = dx * Math.cos(yaw) - dz * Math.sin(yaw);
  let x = (right / limit) * radius;
  let y = (-forward / limit) * radius;
  const length = Math.hypot(x, y);
  const clamped = length > radius;
  if (clamped && length > 0) {
    x = (x / length) * radius;
    y = (y / length) * radius;
  }
  return { x, y, clamped };
}
