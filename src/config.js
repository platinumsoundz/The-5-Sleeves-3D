// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Tunable prototype values. No progression or canon powers are implemented here.
export const CONFIG = {
  // Movement
  move: 3.2, sprint: 5.2, jump: 6.2, gravity: 18,
  dodgeTime: .42, dodgeSpeed: 7,
  // Player staff
  attackCooldown: .65, attackAnimTime: .28, range: 2.3, damage: 12,
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
  // Match structure: knockdowns are points; first to N takes the spar.
  pointsToWin: 3,
  roundPause: 1.2,
  arenaLimit: 5.5
};
