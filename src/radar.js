// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// World-to-radar projection. Forward is up on the radar; targets outside the ring are pinned
// to the rim so they still indicate direction. Pure for headless tests.
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
