/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BASE_RADIUS,
  ROLES,
  PlayerRole,
  PITCH_LEFT,
  PITCH_TOP,
  PITCH_RIGHT,
  PITCH_BOTTOM,
  GOAL_LEFT,
  GOAL_RIGHT,
  CENTER_X,
  CENTER_Y,
  PHYSICS_DT,
  MAX_PULL_DISTANCE,
  MATCH_DURATION_SECONDS,
  FORMATIONS,
} from './constants.ts';

export interface Disk {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  m: number;
  k: number; // friction drag coefficient
  f: number; // Math.exp(-k * DT)
  ball?: boolean;
  roleId?: number; // 1..6
  teamIndex?: number; // 0: User, 1: Bot
  playerIndex?: number; // 0..5
}

/**
 * Creates disk representation.
 */
export function createDisk(
  x: number,
  y: number,
  r: number,
  m: number,
  k: number,
  ball = false,
  roleId?: number,
  teamIndex?: number,
  playerIndex?: number
): Disk {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    r,
    m,
    k,
    f: Math.exp(-k * PHYSICS_DT),
    ball,
    roleId,
    teamIndex,
    playerIndex,
  };
}

/**
 * Resets the 13 disks on the field:
 * Disks 0..5: User's 6 players (bottom half with formationA)
 * Disks 6..11: Bot's 6 players (top half with formationB)
 * Disk 12: Ball (center)
 */
export function resetDisks(
  formationA: [number, number][] = FORMATIONS[0].positions,
  formationB: [number, number][] = FORMATIONS[0].positions
): Disk[] {
  const disks: Disk[] = [];

  // Team 0 (User - bottom half)
  formationA.forEach((p, idx) => {
    const role = ROLES[idx];
    disks.push(
      createDisk(
        PITCH_LEFT + p[0],
        PITCH_TOP + p[1],
        role.radius,
        role.mass,
        2.4, // ground friction
        false,
        role.id,
        0,
        idx
      )
    );
  });

  // Team 1 (Bot - top half, mirrored)
  formationB.forEach((p, idx) => {
    const role = ROLES[idx];
    disks.push(
      createDisk(
        PITCH_LEFT + p[0],
        PITCH_TOP + 680 - p[1],
        role.radius,
        role.mass,
        2.4,
        false,
        role.id,
        1,
        idx
      )
    );
  });

  // Disk 12: Ball (Center of pitch)
  disks.push(createDisk(CENTER_X, CENTER_Y, 10, 1.0, 1.7, true));

  return disks;
}

export interface StepResult {
  goal: number; // 0: none, 1: team A goal (top net), 2: team B goal (bottom net)
  highestCollisionImpulse: number;
  ballContactRoleId: number | null;
}

/**
 * Advanced 2D physics step adhering to the 6 roles:
 * 1 — Kaleci: Very high mass, low impulse shot, but huge clearance when colliding with ball,
 *     and goal-line penalty-box save reflex!
 * 2 — Stoper: High mass, block bonus: absorbs ball/opponent momentum, harder to push.
 * 3 — Bek: Fast and agile, quick acceleration, diagonal coverage.
 * 4 — Ön libero & merkez: Cushions ball on contact for smooth passes & setups.
 * 5 — On numara: High technique, laser aiming, high shot power.
 * 6 — Forvet: Low mass (rebounds harder on heavy stoppers), lethal shot speed & goal bonus.
 */
export function physicsStep(disks: Disk[], dt = PHYSICS_DT): StepResult {
  let goal = 0;
  let highestImpulse = 0;
  let ballContactRoleId: number | null = null;

  // 1. Movement and boundary collisions
  for (const o of disks) {
    if (!o.vx && !o.vy) continue;
    o.x += o.vx * dt;
    o.y += o.vy * dt;

    const f = o.f;
    const r = o.r;
    const e = o.ball ? 0.85 : 0.6; // restitution on border bounce
    const sp = Math.hypot(o.vx, o.vy);
    const minSpeedLoss = o.ball ? 24 : 58;
    const ns = Math.max(0, sp * f - minSpeedLoss * dt);

    if (ns < 10) {
      o.vx = 0;
      o.vy = 0;
    } else {
      o.vx *= ns / sp;
      o.vy *= ns / sp;
    }

    if (o.vx * o.vx + o.vy * o.vy < 90) {
      o.vx = 0;
      o.vy = 0;
    }

    // Left and right side pitch boundaries
    if (o.x < PITCH_LEFT + r) {
      o.x = PITCH_LEFT + r;
      o.vx = Math.abs(o.vx) * e;
    }
    if (o.x > PITCH_RIGHT - r) {
      o.x = PITCH_RIGHT - r;
      o.vx = -Math.abs(o.vx) * e;
    }

    // Top and bottom goal boundaries
    if (o.ball && o.x > GOAL_LEFT && o.x < GOAL_RIGHT) {
      if (o.y < PITCH_TOP) goal = 1; // Team 0 scored into Team 1's goal!
      else if (o.y > PITCH_BOTTOM) goal = 2; // Team 1 scored into Team 0's goal!
    } else {
      if (o.y < PITCH_TOP + r) {
        o.y = PITCH_TOP + r;
        o.vy = Math.abs(o.vy) * e;
      }
      if (o.y > PITCH_BOTTOM - r) {
        o.y = PITCH_BOTTOM - r;
        o.vy = -Math.abs(o.vy) * e;
      }
    }
  }

  // 2. Inter-disk collisions
  for (let i = 0; i < disks.length; i++) {
    for (let j = i + 1; j < disks.length; j++) {
      const a = disks[i];
      const b = disks[j];
      if (!(a.vx || a.vy || b.vx || b.vy)) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const rr = a.r + b.r;
      const d2 = dx * dx + dy * dy;

      if (d2 < rr * rr && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const ny = dy / d;

        const im = 1 / a.m + 1 / b.m;
        const overlap = rr - d;
        const pa = overlap / a.m / im;
        const pb = overlap / b.m / im;

        a.x -= nx * pa;
        a.y -= ny * pa;
        b.x += nx * pb;
        b.y += nx * pb;

        const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (vn < 0) {
          highestImpulse = Math.max(highestImpulse, -vn);

          let eRest = a.ball || b.ball ? 0.9 : 0.7;

          // Check role-specific collision characteristics
          const playerDisk = a.ball ? b : b.ball ? a : null;
          const isBallCollision = a.ball || b.ball;

          if (isBallCollision && playerDisk && playerDisk.roleId) {
            ballContactRoleId = playerDisk.roleId;

            // 1 — Kaleci special clearance:
            // "topa temas ettiğinde güçlü uzaklaştırma yapar" & "kale çizgisine yakınken kalecilik avantajı"
            if (playerDisk.roleId === 1) {
              const isNearOwnGoal =
                playerDisk.teamIndex === 0
                  ? playerDisk.y > 630
                  : playerDisk.y < 190;
              eRest = isNearOwnGoal ? 1.25 : 1.1; // Powerful clearance reflex
            }

            // 2 — Stoper block:
            // "top çarpışmalarında daha güçlü müdahale ve blok"
            if (playerDisk.roleId === 2) {
              eRest = 1.05; // solid block
            }

            // 4 — Ön libero & merkez:
            // "top kontrolünde ve pas bağlantılarında avantaj"
            if (playerDisk.roleId === 4) {
              // Dampens excess bounce so ball stays controlled near teammates
              eRest = 0.78;
            }

            // 6 — Forvet:
            // "kaleye yakın şutlarda güç ve isabet bonusu"
            if (playerDisk.roleId === 6) {
              const inOffensiveHalf =
                playerDisk.teamIndex === 0
                  ? playerDisk.y < CENTER_Y
                  : playerDisk.y > CENTER_Y;
              if (inOffensiveHalf) {
                eRest = 1.15; // Extra snap on goal scoring shots
              }
            }
          }

          const q = -((1 + eRest) * vn) / im;
          a.vx -= (q * nx) / a.m;
          a.vy -= (q * ny) / a.m;
          b.vx += (q * nx) / b.m;
          b.vy += (q * ny) / b.m;
        }
      }
    }
  }

  return {
    goal,
    highestCollisionImpulse: highestImpulse,
    ballContactRoleId,
  };
}

/**
 * Checks if any disk has active velocity above threshold.
 */
export function areDisksMoving(disks: Disk[], minSpeedSq = 80): boolean {
  return disks.some((o) => o.vx * o.vx + o.vy * o.vy > minSpeedSq);
}

/**
 * Calculates shot impulse based on pull length and player role.
 */
export function calculateShotPower(
  pullDistance: number,
  roleId: number,
  diskY: number,
  teamIndex: number
): number {
  const clampedPull = Math.min(pullDistance, MAX_PULL_DISTANCE);
  const baseImpulse = 80 + 820 * Math.pow(clampedPull / MAX_PULL_DISTANCE, 1.6);
  const role = ROLES.find((r) => r.id === roleId) || ROLES[3];

  let power = baseImpulse * role.powerMultiplier;

  // Role 6 (Forvet): Kaleye yakın şutlarda güç ve isabet bonusu
  if (roleId === 6) {
    const isAttackingThird =
      teamIndex === 0 ? diskY < 280 : diskY > PITCH_BOTTOM - 210;
    if (isAttackingThird) {
      power *= 1.2; // Extra finishing power when close to the goal!
    }
  }

  // Role 5 (On Numara): Technique finesse bonus
  if (roleId === 5) {
    power *= 1.05;
  }

  return power;
}

/**
 * Formats time in seconds to mm:ss format.
 */
export function formatTimeMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Converts real match seconds to simulated football match minute (0' to 90'+).
 */
export function formatFootballMatchMinute(
  remainingSeconds: number,
  totalSeconds = MATCH_DURATION_SECONDS,
  isExtraTime = false
): string {
  if (isExtraTime) {
    return 'Uzatma (Altın Gol)';
  }
  const elapsed = Math.max(0, totalSeconds - remainingSeconds);
  const minute = Math.min(90, Math.ceil((elapsed / totalSeconds) * 90));
  if (minute >= 90 && remainingSeconds <= 0) {
    return "90'+";
  }
  return `${Math.max(1, minute)}'`;
}

/**
 * Evaluates match end conditions.
 */
export function checkMatchEnd(
  remainingSeconds: number,
  scoreA: number,
  scoreB: number,
  isKnockout: boolean,
  isExtraTime: boolean
): { finished: boolean; startExtraTime: boolean; startPenalties: boolean } {
  // If time hasn't expired, match continues
  if (remainingSeconds > 0) {
    return { finished: false, startExtraTime: false, startPenalties: false };
  }

  const isTied = scoreA === scoreB;

  // In regular league/group matches: ties are permitted
  if (!isKnockout) {
    return { finished: true, startExtraTime: false, startPenalties: false };
  }

  // Knockout match handling
  if (!isTied) {
    return { finished: true, startExtraTime: false, startPenalties: false };
  }

  // It's tied and knockout
  if (!isExtraTime) {
    // Regular time expired tied: go to Extra Time (Golden Goal)
    return { finished: false, startExtraTime: true, startPenalties: false };
  } else {
    // Extra time also expired tied: go to Penalty Shootout
    return { finished: false, startExtraTime: false, startPenalties: true };
  }
}
