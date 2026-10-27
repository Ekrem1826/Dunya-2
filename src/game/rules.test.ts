/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_RADIUS,
  ROLES,
  MATCH_DURATION_SECONDS,
  FORMATIONS,
} from './constants.ts';
import {
  resetDisks,
  calculateShotPower,
  formatTimeMMSS,
  formatFootballMatchMinute,
  checkMatchEnd,
  physicsStep,
  createDisk,
} from './rules.ts';

test('Match duration is configured to exactly 3 minutes (180 seconds)', () => {
  assert.equal(MATCH_DURATION_SECONDS, 180);
  assert.equal(formatTimeMMSS(180), '03:00');
  assert.equal(formatTimeMMSS(90), '01:30');
  assert.equal(formatTimeMMSS(0), '00:00');
});

test('Football match minute scales across 3 minutes', () => {
  assert.equal(formatFootballMatchMinute(180), "1'");
  assert.equal(formatFootballMatchMinute(90), "45'");
  assert.equal(formatFootballMatchMinute(0), "90'+");
  assert.equal(formatFootballMatchMinute(30, 180, true), 'Uzatma (Altın Gol)');
});

test('All 6 requested mevkiler (positions) have precise attributes', () => {
  assert.equal(ROLES.length, 6);

  const [kaleci, stoper, bek, onLibero, onNumara, forvet] = ROLES;

  // 1 — Kaleci: %35 daha büyük, çok yüksek kütle, düşük şut gücü
  assert.equal(kaleci.id, 1);
  assert.equal(kaleci.name, 'Kaleci');
  assert.equal(kaleci.sizeDesc, '%35 daha büyük');
  assert.equal(kaleci.radius, Math.round(BASE_RADIUS * 1.35 * 10) / 10); // 28.4
  assert.ok(kaleci.mass > stoper.mass, 'Kaleci mass must be very high');
  assert.ok(kaleci.powerMultiplier < stoper.powerMultiplier, 'Kaleci base shot power is low');
  assert.ok(kaleci.clearanceBonus && kaleci.clearanceBonus > 1.5, 'Kaleci has clearance bonus');

  // 2 — Stoper: %15 daha büyük, yüksek kütle, orta şut gücü
  assert.equal(stoper.id, 2);
  assert.equal(stoper.sizeDesc, '%15 daha büyük');
  assert.equal(stoper.radius, Math.round(BASE_RADIUS * 1.15 * 10) / 10); // 24.2
  assert.ok(stoper.mass > bek.mass, 'Stoper mass is higher than bek');
  assert.ok(stoper.blockBonus && stoper.blockBonus > 1.3, 'Stoper has block bonus');

  // 3 — Bek: Normalden biraz küçük, orta kütle, orta şut gücü
  assert.equal(bek.id, 3);
  assert.ok(bek.radius < BASE_RADIUS, 'Bek is slightly smaller than normal');
  assert.equal(bek.mass, 4.0);

  // 4 — Ön libero & merkez: Normal boyut, orta kütle, orta şut gücü
  assert.equal(onLibero.id, 4);
  assert.equal(onLibero.radius, BASE_RADIUS);
  assert.equal(onLibero.mass, 4.5);
  assert.ok(onLibero.controlBonus && onLibero.controlBonus > 1.0);

  // 5 — On numara: %5 daha küçük, orta-düşük kütle, yüksek şut gücü
  assert.equal(onNumara.id, 5);
  assert.equal(onNumara.sizeDesc, '%5 daha küçük');
  assert.equal(onNumara.radius, Math.round(BASE_RADIUS * 0.95 * 10) / 10); // 20.0
  assert.ok(onNumara.powerMultiplier > onLibero.powerMultiplier, 'On numara has high shot power');
  assert.ok(onNumara.precisionBonus && onNumara.precisionBonus > 1.0);

  // 6 — Forvet: %12 daha küçük, düşük kütle, çok yüksek şut gücü
  assert.equal(forvet.id, 6);
  assert.equal(forvet.sizeDesc, '%12 daha küçük');
  assert.equal(forvet.radius, Math.round(BASE_RADIUS * 0.88 * 10) / 10); // 18.5
  assert.ok(forvet.mass < onNumara.mass, 'Forvet mass is low');
  assert.ok(forvet.powerMultiplier > onNumara.powerMultiplier, 'Forvet power is very high');
  assert.ok(forvet.finishingBonus && forvet.finishingBonus > 1.0);
});

test('Forvet gets close-to-goal finishing bonus', () => {
  const normalPower = calculateShotPower(100, 6, 500, 0);
  const attackingPower = calculateShotPower(100, 6, 200, 0); // offensive third
  assert.ok(attackingPower > normalPower, 'Forvet should have higher power near opponent goal');
});

test('Multiple tactical formations are defined and can be loaded', () => {
  assert.equal(FORMATIONS.length, 5);
  const classic = FORMATIONS[0];
  const offensive = FORMATIONS[1];
  assert.notDeepEqual(classic.positions, offensive.positions);

  const customDisks = resetDisks(offensive.positions, classic.positions);
  assert.equal(customDisks.length, 13);
  // User player 2 in offensive formation
  assert.equal(customDisks[1].x, 50 + offensive.positions[1][0]);
});

test('Match end logic correctly handles group ties, extra time, and penalties', () => {
  // Not finished when time remains
  const active = checkMatchEnd(100, 1, 0, false, false);
  assert.equal(active.finished, false);

  // Group stage match ended with a tie
  const groupEnd = checkMatchEnd(0, 1, 1, false, false);
  assert.equal(groupEnd.finished, true);
  assert.equal(groupEnd.startExtraTime, false);

  // Knockout stage tied -> trigger extra time
  const koTie = checkMatchEnd(0, 2, 2, true, false);
  assert.equal(koTie.finished, false);
  assert.equal(koTie.startExtraTime, true);

  // Knockout stage still tied after extra time -> trigger penalties
  const koEtTie = checkMatchEnd(0, 2, 2, true, true);
  assert.equal(koEtTie.finished, false);
  assert.equal(koEtTie.startPenalties, true);

  // Knockout match with clear winner -> finish
  const koWin = checkMatchEnd(0, 2, 1, true, false);
  assert.equal(koWin.finished, true);
});

test('Physics step simulates ball movement and collision without errors', () => {
  const disks = resetDisks();
  // Give ball velocity
  disks[12].vx = 100;
  disks[12].vy = -200;

  const result = physicsStep(disks, 0.016);
  assert.ok(disks[12].x !== 250 || disks[12].y !== 410);
  assert.equal(typeof result.goal, 'number');
});
