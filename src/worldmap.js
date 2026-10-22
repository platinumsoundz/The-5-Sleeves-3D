// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (enemy outpost POI)
// Data-driven world map for the menu and map screen. New zones only need another entry in
// WORLD_MAP; projection accepts any bounds so a larger open world can reuse the same helpers.
import { CONFIG } from './config.js';

const BOUNDS = Object.freeze({
  minX: -CONFIG.wildHalfX - 4,
  maxX: CONFIG.wildHalfX + 4,
  minZ: CONFIG.wildMinZ - 3,
  maxZ: CONFIG.trainingMaxZ + 2
});

const TRAINING_BOUNDS = Object.freeze({
  minX: -CONFIG.trainingHalfX,
  maxX: CONFIG.trainingHalfX,
  minZ: -10.6,
  maxZ: CONFIG.trainingMaxZ
});

const WILDS_BOUNDS = Object.freeze({
  minX: -CONFIG.wildHalfX,
  maxX: CONFIG.wildHalfX,
  minZ: CONFIG.wildMinZ,
  maxZ: CONFIG.wildMaxZ
});

export const WORLD_MAP = Object.freeze({
  bounds: BOUNDS,
  regions: [
    {
      id: 'training-yard',
      label: 'TRAINING YARD',
      kind: 'yard',
      bounds: TRAINING_BOUNDS
    },
    {
      id: 'wilderness',
      label: 'WILDERNESS',
      kind: 'wilds',
      bounds: WILDS_BOUNDS
    }
  ],
  points: [
    { id: 'gate', label: 'NORTH GATE', kind: 'gate', x: 0, z: -11.7 },
    { id: 'outpost', label: 'ENEMY OUTPOST', kind: 'outpost', x: CONFIG.wildOutpostX, z: CONFIG.wildOutpostZ }
  ]
});

// Returns percentage coordinates inside a map viewport. North is negative Z, so negative Z
// must land at the top. The inset keeps dots and labels away from the circular clip edge.
export function projectMapPoint(point, bounds = WORLD_MAP.bounds, inset = 5) {
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const depth = Math.max(1, bounds.maxZ - bounds.minZ);
  const usable = Math.max(0, 100 - inset * 2);
  return {
    left: inset + ((point.x - bounds.minX) / width) * usable,
    top: inset + ((point.z - bounds.minZ) / depth) * usable
  };
}

export function projectMapBounds(bounds, worldBounds = WORLD_MAP.bounds, inset = 5) {
  const topLeft = projectMapPoint({ x: bounds.minX, z: bounds.minZ }, worldBounds, inset);
  const bottomRight = projectMapPoint({ x: bounds.maxX, z: bounds.maxZ }, worldBounds, inset);
  return {
    left: topLeft.left,
    top: topLeft.top,
    width: Math.max(0, bottomRight.left - topLeft.left),
    height: Math.max(0, bottomRight.top - topLeft.top)
  };
}
