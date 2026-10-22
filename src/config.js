// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (settlement/character visual pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)

// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (over-the-shoulder aim tuning)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (HUD/radar follow-up)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (solid scenery, enemy outpost)
// Tunable prototype values. No progression or canon powers are implemented here.
export const CONFIG = {
  // Movement
  move: 3.2, sprint: 5.2, jump: 6.2, gravity: 18,
  dodgeTime: .42, dodgeSpeed: 7,
  // Player staff
  attackCooldown: .65, attackAnimTime: .28, range: 2.3, damage: 12,
  // Vitals: stamina gates sprint/dodge/jump. The Cipher Sleeve is not acquired in this scene,
  // so no sleeve capacity or charge is represented yet.
  maxStamina: 100, staminaRegen: 20, staminaDelay: .7,
  sprintCost: 16, dodgeCost: 18, jumpCost: 8,
  // Shared nonlethal knockdown
  knockdown: 2.5,
  // Sensei sparring brain
  senseiSpeed: 1.25, senseiDamage: 8,
  senseiApproach: 1.6,
  senseiReach: 1.9,
  senseiReachGrace: .35,
  senseiWindup: .5,
  senseiRecover: .55,
  senseiCooldown: .9,
  senseiAccuracy: .8,
  // Defense: one guard button. Tap alone to block, add a direction to dodge, press just before
  // impact to parry. Parry rewards timing with an opening; block only softens the hit.
  guardSpeed: .45,
  parryWindow: .2,
  parryRecover: .35,
  blockDamageScale: .25,
  guardBreakHits: 3,
  guardBreakWindow: 3,
  guardBreakStun: .9,
  parryStagger: 1.1,
  whiffPunishTime: 1,
  whiffPunishReach: 1.2,
  senseiPunishWindup: .26,
  knockback: .22,
  // Match structure: knockdowns are points; first to N takes the spar.
  pointsToWin: 3,
  roundPause: 1.2,
  arenaLimit: 11.2,
  // World slice: a training yard opening through the north gate into a wide wilderness
  // corridor. The enemy outpost closes the current test area; it is not a story tower.
  trainingHalfX: 11.2,
  trainingMaxZ: 8.2,
  gateHalf: 2.45,
  gateZ: -13.2,
  wildHalfX: 31,
  wildMinZ: -67,
  wildMaxZ: -13.2,
  wildOutpostX: 0,
  wildOutpostZ: -63,
  wildOutpostReach: 6.4,
  // Simple body radius used to keep actors out of solid scenery.
  actorRadius: .42,
  // Wilderness raiders use the same nonlethal knockdown loop with separate stats.
  wildEnemyHp: 45,
  wildDamage: 7,
  wildSpeed: 1.05,
  wildAggro: 20,
  // Radar follow range in world metres. Wider in the wilderness so the route and raiders
  // are readable instead of every target sitting on the rim; the player stays centred.
  radarRange: 24,
  radarWildRange: 52,
  // Camera, look and touch input. Tuning placeholders until the first phone pass.
  lookSensitivity: .006,
  pitchLimit: 1.05,
  stickDeadzone: .16,
  // Pixels per second at full right-stick deflection; world.js applies lookSensitivity.
  gamepadLookSpeed: 420,
  fov: 55,
  aimFov: 42,
  cameraDistance: 9.5,
  // Over-the-shoulder aim is anchored to the player, not the fighter midpoint.
  aimCameraDistance: 4.1,
  aimShoulderOffset: .68,
  aimHeight: 1.55,
  aimFocusHeight: 1.28
};
