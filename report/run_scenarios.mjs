// Headless scenario runner: executes every validation scenario from
// src/scenarios.js through the exact same physics code the browser runs,
// and writes one CSV per run into report/data/ for chart generation.
//
//   node report/run_scenarios.mjs
//
// Also prints per-run diagnostics (bounce peaks, obstacle hits, final state)
// used to verify each scenario actually exercises what the study claims.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DT } from '../src/constants.js';
import { initialWorld } from '../src/state/world.js';
import { initialBall } from '../src/state/ball.js';
import { step } from '../src/physics/integrator.js';
import { scenarios, applyScenario } from '../src/scenarios.js';
import { createRecorder, startRecording, recordStep, toCSV } from '../src/recorder.js';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), 'data');
mkdirSync(DATA_DIR, { recursive: true });

// Extra comparison runs for the report's theory overlays:
//   *_ideal  — air removed (rho_air = 0): pure-gravity analytic reference
//   *_nospin — same launch without spin: isolates the Magnus deflection
const variants = [
  { base: 's1', id: 's1_ideal', mutate: (ball, world) => { world.rho_air = 0; } },
  { base: 's2', id: 's2_ideal', mutate: (ball, world) => { world.rho_air = 0; } },
  { base: 's3', id: 's3_nospin', mutate: (ball) => { ball.omega.set(0, 0, 0); } },
  { base: 's4', id: 's4_nospin', mutate: (ball) => { ball.omega.set(0, 0, 0); } },
  { base: 's7', id: 's7_nospin', mutate: (ball) => { ball.omega.set(0, 0, 0); } },
];

function distanceToObstacle(ball, obs) {
  if (obs.type === 'sphere') {
    return ball.r.distanceTo(obs.center) - (ball.R + obs.radius);
  }
  // AABB: clamp center into the box, measure to the clamp point.
  const px = Math.min(Math.max(ball.r.x, obs.min.x), obs.max.x);
  const py = Math.min(Math.max(ball.r.y, obs.min.y), obs.max.y);
  const pz = Math.min(Math.max(ball.r.z, obs.min.z), obs.max.z);
  const dx = ball.r.x - px, dy = ball.r.y - py, dz = ball.r.z - pz;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - ball.R;
}

function clampPoint(ball, obs) {
  return [
    Math.min(Math.max(ball.r.x, obs.min.x), obs.max.x),
    Math.min(Math.max(ball.r.y, obs.min.y), obs.max.y),
    Math.min(Math.max(ball.r.z, obs.min.z), obs.max.z),
  ];
}

function runScenario(sc, id, mutate) {
  const ball = initialBall();
  const world = initialWorld();
  const added = applyScenario(ball, world, sc);
  if (mutate) mutate(ball, world);

  const rec = createRecorder();
  startRecording(rec, id, sc.duration);

  const peaks = [];
  let prevVy = ball.v.y;
  let minObsDist = Infinity;
  let firstContact = null;
  let modeSwitchT = null;

  while (rec.recording) {
    step(ball, world, DT);
    recordStep(rec, ball, DT);

    // Bounce peaks: vy sign change + → −  well above the resting height.
    if (prevVy > 0 && ball.v.y <= 0 && ball.r.y > ball.R + 0.02) {
      peaks.push({ t: rec.t, y: ball.r.y });
    }
    prevVy = ball.v.y;

    for (const obs of added) {
      const d = distanceToObstacle(ball, obs);
      if (d < minObsDist) minObsDist = d;
      // respond() pushes the ball back out within the same step, so a resolved
      // contact shows up as d ≈ 0 rather than d < 0.
      if (d <= 1e-3 && !firstContact) {
        firstContact = obs.type === 'box'
          ? { t: rec.t, at: clampPoint(ball, obs) }
          : { t: rec.t, at: [ball.r.x, ball.r.y, ball.r.z] };
      }
    }
    if (ball.mode === 'rolling' && modeSwitchT === null) modeSwitchT = rec.t;
  }

  writeFileSync(join(DATA_DIR, `${id}.csv`), toCSV(rec));

  const fmt = (v) => v.toFixed(2);
  const parts = [
    `${id.padEnd(10)} rows=${String(rec.rows.length).padStart(4)}`,
    `end=(${fmt(ball.r.x)}, ${fmt(ball.r.y)}, ${fmt(ball.r.z)})`,
  ];
  if (peaks.length) parts.push(`peaks=[${peaks.map((p) => p.y.toFixed(3)).join(', ')}]`);
  if (added.length) {
    parts.push(`minObsDist=${minObsDist.toFixed(3)}`);
    if (firstContact) {
      parts.push(`hit@t=${firstContact.t.toFixed(2)} p=(${firstContact.at.map(fmt).join(', ')})`);
    } else {
      parts.push('NO HIT');
    }
  }
  if (modeSwitchT !== null) parts.push(`rolling@t=${modeSwitchT.toFixed(2)}`);
  console.log(parts.join('  '));
}

for (const sc of scenarios) runScenario(sc, sc.id);
for (const v of variants) {
  const sc = scenarios.find((s) => s.id === v.base);
  runScenario(sc, v.id, v.mutate);
}
console.log(`\nCSV files written to ${DATA_DIR}`);
