// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (solid scenery/outpost pass)
// Small 2D collision helpers shared by player, Sensei and wilderness raiders. Colliders live in
// world.js/scenery.js as circles or (optionally rotated) boxes; gameplay only resolves an actor
// circle against them, so the renderer stays free of movement rules.

const EPSILON = 1e-8;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveCircleShape(x, z, radius, collider) {
  const minDistance = radius + Math.max(0, collider.r || 0);
  if (minDistance <= 0) return null;
  const dx = x - collider.x;
  const dz = z - collider.z;
  const distanceSq = dx * dx + dz * dz;
  if (distanceSq >= minDistance * minDistance) return null;

  if (distanceSq < EPSILON) {
    return { x: x + minDistance, z, nx: 1, nz: 0 };
  }
  const distance = Math.sqrt(distanceSq);
  const push = minDistance - distance;
  return {
    x: x + (dx / distance) * push,
    z: z + (dz / distance) * push,
    nx: dx / distance,
    nz: dz / distance
  };
}

function resolveBoxShape(x, z, radius, collider) {
  const hx = Math.max(0, collider.hx || 0);
  const hz = Math.max(0, collider.hz || 0);
  if (!hx && !hz) return null;

  const rot = collider.rot || 0;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const dx = x - collider.x;
  const dz = z - collider.z;
  // Rotate the actor into the box's local frame.
  const lx = cos * dx + sin * dz;
  const lz = -sin * dx + cos * dz;
  const qx = clamp(lx, -hx, hx);
  const qz = clamp(lz, -hz, hz);
  const ex = lx - qx;
  const ez = lz - qz;
  const distanceSq = ex * ex + ez * ez;

  if (distanceSq > radius * radius) return null;

  let localX;
  let localZ;
  let push;
  if (distanceSq > EPSILON) {
    const distance = Math.sqrt(distanceSq);
    localX = ex / distance;
    localZ = ez / distance;
    push = radius - distance;
  } else {
    // The actor centre is inside the box: eject through the nearest face.
    const toXFace = hx - Math.abs(lx);
    const toZFace = hz - Math.abs(lz);
    if (toXFace < toZFace) {
      localX = Math.sign(lx) || 1;
      localZ = 0;
      push = toXFace + radius;
    } else {
      localX = 0;
      localZ = Math.sign(lz) || 1;
      push = toZFace + radius;
    }
  }

  // Rotate the local normal back to world space.
  const nx = cos * localX - sin * localZ;
  const nz = sin * localX + cos * localZ;
  return {
    x: x + nx * push,
    z: z + nz * push,
    nx,
    nz
  };
}

// Accepts a mutable {x,z} position, an actor radius and a list of circle/box colliders.
// A few passes settle corners shared by two props without letting either one win arbitrarily.
export function resolveSolidCollisions(position, radius, colliders = [], iterations = 3) {
  if (!position || !(radius > 0) || !Array.isArray(colliders) || !colliders.length) return false;
  let collided = false;
  for (let pass = 0; pass < iterations; pass++) {
    let moved = false;
    for (const collider of colliders) {
      if (!collider || collider.solid === false) continue;
      const result = collider.type === 'box'
        ? resolveBoxShape(position.x, position.z, radius, collider)
        : resolveCircleShape(position.x, position.z, radius, collider);
      if (!result) continue;
      position.x = result.x;
      position.z = result.z;
      collided = true;
      moved = true;
    }
    if (!moved) break;
  }
  return collided;
}

export function circleCollider(x, z, r) {
  return { type: 'circle', x, z, r };
}

export function boxCollider(x, z, hx, hz, rot = 0) {
  return { type: 'box', x, z, hx, hz, rot };
}
