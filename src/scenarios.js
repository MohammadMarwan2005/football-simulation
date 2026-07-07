import { Vector3 } from './math.js';
import { initialBall } from './state/ball.js';

// The 9 validation scenarios from §8 of the reference study, as plain data.
// Spin conventions follow the study: shots that carry spin travel along +z,
// so top-spin is ω.x > 0 (matches the no-slip relation ω.x = v.z / R) and
// side-spin is ω.y ≠ 0. Spin-free shots travel along +x where the pitch is longest.
//
// Each scenario:
//   { id, nameAr, nameEn, ball: {r, v, omega, e?}, wind?, extraObstacles?, cam?, duration }
// Vectors are given as [x, y, z] triples; `duration` is the recording window in seconds.

// Temporary obstacles for scenarios 5 and 6.
const OBSTACLE_SPHERE = { type: 'sphere', center: [0, 0.8, 7], radius: 0.8 };
const OBSTACLE_BOX = { type: 'box', min: [-1, 0, 8], max: [1, 2, 10], color: 0x8a5a2a };

export const scenarios = [
  {
    id: 's1',
    nameAr: 'سقوط حر — تحقق الارتداد',
    nameEn: 'Free fall — bounce decay',
    ball: { r: [0, 5, 0], v: [0, 0, 0], omega: [0, 0, 0] },
    cam: { pos: [6, 3, 4], target: [0, 2.5, 0] },
    duration: 10,
  },
  {
    id: 's2',
    nameAr: 'قذف مائل 45° بلا دوران',
    nameEn: '45° launch, no spin',
    ball: { r: [0, 0.11, 0], v: [10.61, 10.61, 0], omega: [0, 0, 0] },
    cam: { pos: [10, 5, 22], target: [10, 2, 0] },
    duration: 8,
  },
  {
    id: 's3',
    nameAr: 'دوران أمامي Top-spin',
    nameEn: 'Top-spin launch',
    ball: { r: [0, 0.11, 0], v: [0, 10.61, 10.61], omega: [10, 0, 0] },
    cam: { pos: [22, 6, 10], target: [0, 2, 10] },
    duration: 8,
  },
  {
    id: 's4',
    nameAr: 'دوران جانبي Side-spin',
    nameEn: 'Side-spin launch',
    ball: { r: [0, 0.11, 0], v: [0, 10.61, 10.61], omega: [0, 10, 0] },
    cam: { pos: [14, 18, 8], target: [0, 0, 10] },
    duration: 8,
  },
  {
    id: 's5',
    nameAr: 'اصطدام بكرة عائق',
    nameEn: 'Sphere obstacle hit',
    ball: { r: [0, 0.11, 0], v: [0.8, 3.5, 12], omega: [0, 0, 0] },
    extraObstacles: [OBSTACLE_SPHERE],
    cam: { pos: [10, 3, 3], target: [0, 1, 6] },
    duration: 6,
  },
  {
    id: 's6a',
    nameAr: 'صندوق — إصابة وجه',
    nameEn: 'Box — face hit',
    ball: { r: [0, 0.11, 3], v: [0, 3, 12], omega: [0, 0, 0] },
    extraObstacles: [OBSTACLE_BOX],
    cam: { pos: [10, 3, 4], target: [0, 1, 8] },
    duration: 6,
  },
  {
    id: 's6b',
    nameAr: 'صندوق — إصابة حافة',
    nameEn: 'Box — edge hit',
    ball: { r: [0, 0.11, 3], v: [0, 6.6, 10], omega: [0, 0, 0] },
    extraObstacles: [OBSTACLE_BOX],
    cam: { pos: [10, 3, 4], target: [0, 2, 8] },
    duration: 6,
  },
  {
    id: 's6c',
    nameAr: 'صندوق — إصابة زاوية',
    nameEn: 'Box — corner hit',
    ball: { r: [0, 0.11, 3], v: [2.05, 6.6, 10], omega: [0, 0, 0] },
    extraObstacles: [OBSTACLE_BOX],
    cam: { pos: [10, 3, 4], target: [1, 2, 8] },
    duration: 6,
  },
  {
    id: 's7',
    nameAr: 'Top-spin على الجدار',
    nameEn: 'Top-spin wall bounce',
    ball: { r: [0, 0.11, 30], v: [0, 4, 14], omega: [20, 0, 0] },
    cam: { pos: [12, 4, 28], target: [0, 1.5, 36] },
    duration: 6,
  },
  {
    id: 's8',
    nameAr: 'إطلاق ضحل → تدحرج',
    nameEn: 'Shallow launch → rolling',
    ball: { r: [0, 0.11, 0], v: [6.76, 1.81, 0], omega: [0, 0, 0] },
    cam: { pos: [20, 12, 25], target: [22, 0, 0] },
    duration: 25,
  },
  {
    id: 's9a',
    nameAr: 'ارتداد e = 0.4',
    nameEn: 'Restitution e = 0.4',
    ball: { r: [0, 5, 0], v: [0, 0, 0], omega: [0, 0, 0], e: 0.4 },
    cam: { pos: [6, 3, 4], target: [0, 2.5, 0] },
    duration: 10,
  },
  {
    id: 's9b',
    nameAr: 'ارتداد e = 0.7',
    nameEn: 'Restitution e = 0.7',
    ball: { r: [0, 5, 0], v: [0, 0, 0], omega: [0, 0, 0], e: 0.7 },
    cam: { pos: [6, 3, 4], target: [0, 2.5, 0] },
    duration: 10,
  },
  {
    id: 's9c',
    nameAr: 'ارتداد e = 0.9',
    nameEn: 'Restitution e = 0.9',
    ball: { r: [0, 5, 0], v: [0, 0, 0], omega: [0, 0, 0], e: 0.9 },
    cam: { pos: [6, 3, 4], target: [0, 2.5, 0] },
    duration: 12,
  },
];

export function getScenario(id) {
  return scenarios.find((s) => s.id === id) ?? null;
}

// Turn an obstacle spec (plain arrays) into a live world obstacle (Vector3s).
function materializeObstacle(spec) {
  if (spec.type === 'sphere') {
    return { type: 'sphere', center: new Vector3(...spec.center), radius: spec.radius };
  }
  return {
    type: 'box',
    min: new Vector3(...spec.min),
    max: new Vector3(...spec.max),
    color: spec.color,
  };
}

// Reset the ball, apply the scenario's initial conditions, set the wind, and
// append any temporary obstacles to the world. Returns the obstacles that were
// added so the caller can remove them (and their meshes) later.
export function applyScenario(ball, world, sc) {
  Object.assign(ball, initialBall());
  const b = sc.ball;
  if (b.r) ball.r.set(...b.r);
  if (b.v) ball.v.set(...b.v);
  if (b.omega) ball.omega.set(...b.omega);
  if (b.e !== undefined) ball.e = b.e;

  world.v_wind.set(...(sc.wind ?? [0, 0, 0]));

  const added = [];
  for (const spec of sc.extraObstacles ?? []) {
    const obs = materializeObstacle(spec);
    world.obstacles.push(obs);
    added.push(obs);
  }
  return added;
}

// Remove previously added temporary obstacles and restore still air.
export function removeScenarioObstacles(world, added) {
  for (const obs of added) {
    const i = world.obstacles.indexOf(obs);
    if (i !== -1) world.obstacles.splice(i, 1);
  }
  world.v_wind.set(0, 0, 0);
}
