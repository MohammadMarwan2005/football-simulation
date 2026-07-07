import { G, INERTIA_FACTOR } from './constants.js';

// Time-series recorder for validation runs. One row per physics step:
// state, energies, and mode — everything §9 of the study charts.
// DOM-free so the same code runs in the browser and in the headless runner.

// Below these thresholds (and resting on the ground) the run is considered over.
const REST_SPEED = 0.05;      // m/s
const REST_SPIN = 0.5;        // rad/s
const REST_MIN_TIME = 1;      // s, don't stop before the scenario has begun

export function createRecorder() {
  return { rows: [], recording: false, t: 0, duration: 0, scenarioId: null };
}

export function startRecording(rec, scenarioId, duration) {
  rec.rows = [];
  rec.t = 0;
  rec.duration = duration;
  rec.scenarioId = scenarioId;
  rec.recording = true;
}

export function stopRecording(rec) {
  rec.recording = false;
}

// Call once per fixed physics step, after step(). No-op unless recording.
export function recordStep(rec, ball, dt) {
  if (!rec.recording) return;

  const I = INERTIA_FACTOR * ball.m * ball.R * ball.R;
  const keTrans = 0.5 * ball.m * ball.v.lengthSq();
  const keRot = 0.5 * I * ball.omega.lengthSq();
  const pe = ball.m * G * ball.r.y;

  rec.rows.push([
    rec.t,
    ball.r.x, ball.r.y, ball.r.z,
    ball.v.x, ball.v.y, ball.v.z,
    ball.omega.x, ball.omega.y, ball.omega.z,
    keTrans, keRot, pe, keTrans + keRot + pe,
    ball.mode,
  ]);
  rec.t += dt;

  const atRest = ball.v.length() < REST_SPEED
    && ball.omega.length() < REST_SPIN
    && ball.r.y <= ball.R + 0.001;
  if (rec.t >= rec.duration || (rec.t > REST_MIN_TIME && atRest)) {
    rec.recording = false;
  }
}

const CSV_HEADER = 't,x,y,z,vx,vy,vz,wx,wy,wz,ke_trans,ke_rot,pe,e_total,mode';

export function toCSV(rec) {
  const lines = [CSV_HEADER];
  for (const row of rec.rows) {
    lines.push(row.map((v) => (typeof v === 'number' ? v.toFixed(6) : v)).join(','));
  }
  return lines.join('\n');
}
