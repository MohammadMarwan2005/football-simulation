import {
  Mesh, SphereGeometry, MeshStandardMaterial, PlaneGeometry, BoxGeometry,
  RingGeometry, CircleGeometry, Group,
} from 'three';
import {
  PITCH_LENGTH, PITCH_WIDTH, PITCH_PADDING, LINE_WIDTH, CENTER_CIRCLE_RADIUS,
  GOAL_AREA_DEPTH, GOAL_AREA_WIDTH,
  PENALTY_AREA_DEPTH, PENALTY_AREA_WIDTH,
  PENALTY_SPOT_DISTANCE, PENALTY_SPOT_RADIUS, PENALTY_ARC_RADIUS,
  WALL_THICKNESS, STAND_TIER_COUNT, STAND_TIER_DEPTH, STAND_TIER_RISE,
} from '../constants.js';

// Lines/markings sit slightly above the pitch to avoid z-fighting.
const MARKING_Y = 0.01;

export function createBallMesh(ball) {
  const geom = new SphereGeometry(ball.R, 32, 16);
  const mat = new MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6 });
  return new Mesh(geom, mat);
}

export function createGroundMesh() {
  const geom = new PlaneGeometry(PITCH_LENGTH + 2 * PITCH_PADDING, PITCH_WIDTH + 2 * PITCH_PADDING);
  geom.rotateX(-Math.PI / 2);
  const mat = new MeshStandardMaterial({ color: 0x2a6a2a, roughness: 1.0 });
  return new Mesh(geom, mat);
}

// Open box outline (3 strips): both side lines + the far edge.
// The near edge (goal line) is omitted because the boundary lines already cover it.
function addBoxOutline(group, mat, goalX, depth, width) {
  const sign = Math.sign(goalX);
  const halfW = width * 0.5;
  const innerX = goalX - sign * depth;
  const midX = (goalX + innerX) * 0.5;

  const sideGeom = new PlaneGeometry(depth, LINE_WIDTH);
  sideGeom.rotateX(-Math.PI / 2);
  for (const z of [halfW, -halfW]) {
    const m = new Mesh(sideGeom, mat);
    m.position.set(midX, MARKING_Y, z);
    group.add(m);
  }
  const frontGeom = new PlaneGeometry(LINE_WIDTH, width);
  frontGeom.rotateX(-Math.PI / 2);
  const front = new Mesh(frontGeom, mat);
  front.position.set(innerX, MARKING_Y, 0);
  group.add(front);
}

export function createPenaltyMarkingsMesh() {
  const group = new Group();
  const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 });
  const halfL = PITCH_LENGTH * 0.5;
  // Half-angle of the visible (outside-the-box) portion of the penalty arc.
  const alpha = Math.acos((PENALTY_AREA_DEPTH - PENALTY_SPOT_DISTANCE) / PENALTY_ARC_RADIUS);

  for (const goalX of [halfL, -halfL]) {
    const sign = Math.sign(goalX);
    addBoxOutline(group, mat, goalX, GOAL_AREA_DEPTH, GOAL_AREA_WIDTH);
    addBoxOutline(group, mat, goalX, PENALTY_AREA_DEPTH, PENALTY_AREA_WIDTH);

    const spotX = goalX - sign * PENALTY_SPOT_DISTANCE;

    const spotGeom = new CircleGeometry(PENALTY_SPOT_RADIUS, 16);
    spotGeom.rotateX(-Math.PI / 2);
    const spot = new Mesh(spotGeom, mat);
    spot.position.set(spotX, MARKING_Y, 0);
    group.add(spot);

    // Arc opens toward midfield (away from the goal line).
    const thetaStart = sign > 0 ? Math.PI - alpha : -alpha;
    const arcGeom = new RingGeometry(
      PENALTY_ARC_RADIUS - LINE_WIDTH,
      PENALTY_ARC_RADIUS,
      48,
      1,
      thetaStart,
      2 * alpha,
    );
    arcGeom.rotateX(-Math.PI / 2);
    const arc = new Mesh(arcGeom, mat);
    arc.position.set(spotX, MARKING_Y, 0);
    group.add(arc);
  }
  return group;
}

export function createBoundaryLinesMesh() {
  const group = new Group();
  const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 });
  const halfL = PITCH_LENGTH * 0.5;
  const halfW = PITCH_WIDTH * 0.5;

  // Two touchlines (along x) at z = ±halfW
  const touchGeom = new PlaneGeometry(PITCH_LENGTH, LINE_WIDTH);
  touchGeom.rotateX(-Math.PI / 2);
  for (const z of [halfW, -halfW]) {
    const m = new Mesh(touchGeom, mat);
    m.position.set(0, MARKING_Y, z);
    group.add(m);
  }

  // Two goal lines (along z) at x = ±halfL
  const goalGeom = new PlaneGeometry(LINE_WIDTH, PITCH_WIDTH);
  goalGeom.rotateX(-Math.PI / 2);
  for (const x of [halfL, -halfL]) {
    const m = new Mesh(goalGeom, mat);
    m.position.set(x, MARKING_Y, 0);
    group.add(m);
  }
  return group;
}

export function createHalfwayLineMesh() {
  const geom = new PlaneGeometry(LINE_WIDTH, PITCH_WIDTH);
  geom.rotateX(-Math.PI / 2);
  const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 });
  const mesh = new Mesh(geom, mat);
  mesh.position.y = MARKING_Y;
  return mesh;
}

export function createCenterCircleMesh() {
  const geom = new RingGeometry(CENTER_CIRCLE_RADIUS - LINE_WIDTH, CENTER_CIRCLE_RADIUS, 64);
  geom.rotateX(-Math.PI / 2);
  const mat = new MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 });
  const mesh = new Mesh(geom, mat);
  mesh.position.y = MARKING_Y;
  return mesh;
}

// Stepped stadium stands: a ring of N tiers behind the perimeter walls.
// Each tier is taller than the one in front. Visual only — no collision.
export function createStandsMesh() {
  const group = new Group();
  const mat = new MeshStandardMaterial({ color: 0xb8b8c2, roughness: 0.85 });
  const outerX = PITCH_LENGTH * 0.5 + PITCH_PADDING + WALL_THICKNESS;
  const outerZ = PITCH_WIDTH  * 0.5 + PITCH_PADDING + WALL_THICKNESS;

  for (let i = 0; i < STAND_TIER_COUNT; i++) {
    const tierH = (i + 1) * STAND_TIER_RISE;
    const halfH = tierH * 0.5;
    const inset = i * STAND_TIER_DEPTH;       // inner edge offset of this tier
    const outset = (i + 1) * STAND_TIER_DEPTH; // outer edge offset
    const midOff = inset + STAND_TIER_DEPTH * 0.5;
    const nsLen = 2 * (outerX + outset);      // span the full outer x extent (corners filled)
    const ewLen = 2 * (outerZ + outset);

    const nsGeom = new BoxGeometry(nsLen, tierH, STAND_TIER_DEPTH);
    const n = new Mesh(nsGeom, mat); n.position.set(0, halfH, +(outerZ + midOff)); group.add(n);
    const s = new Mesh(nsGeom, mat); s.position.set(0, halfH, -(outerZ + midOff)); group.add(s);

    const ewGeom = new BoxGeometry(STAND_TIER_DEPTH, tierH, ewLen);
    const e = new Mesh(ewGeom, mat); e.position.set(+(outerX + midOff), halfH, 0); group.add(e);
    const w = new Mesh(ewGeom, mat); w.position.set(-(outerX + midOff), halfH, 0); group.add(w);
  }
  return group;
}

// Humanoid built from primitives: head sphere + torso, two arms, two legs (boxes).
// Mesh's local origin sits at the feet (y = 0), centered in x and z.
// Collision is still the surrounding box obstacle — this is visual only.
const TEAM_COLOR = { home: 0xc0392b, away: 0x2980b9 };
const SHOOTER_COLOR = 0xf1c40f;
const SKIN_COLOR = 0xf2c597;
const SHORTS_COLOR = 0x1a1a1f;

export function createPlayerMesh(team, isShooter = false) {
  const group = new Group();
  const jerseyColor = isShooter ? SHOOTER_COLOR : (TEAM_COLOR[team] ?? TEAM_COLOR.home);
  const jersey = new MeshStandardMaterial({ color: jerseyColor, roughness: 0.7 });
  const skin   = new MeshStandardMaterial({ color: SKIN_COLOR,   roughness: 0.6 });
  const shorts = new MeshStandardMaterial({ color: SHORTS_COLOR, roughness: 0.7 });

  // Head
  const head = new Mesh(new SphereGeometry(0.12, 16, 12), skin);
  head.position.y = 1.65;
  group.add(head);

  // Torso
  const torso = new Mesh(new BoxGeometry(0.36, 0.55, 0.22), jersey);
  torso.position.y = 1.25;
  group.add(torso);

  // Arms (left/right of torso)
  const armGeom = new BoxGeometry(0.12, 0.55, 0.12);
  for (const x of [-0.23, 0.23]) {
    const arm = new Mesh(armGeom, jersey);
    arm.position.set(x, 1.25, 0);
    group.add(arm);
  }

  // Legs (slightly apart left/right)
  const legGeom = new BoxGeometry(0.16, 0.9, 0.16);
  for (const x of [-0.1, 0.1]) {
    const leg = new Mesh(legGeom, shorts);
    leg.position.set(x, 0.45, 0);
    group.add(leg);
  }

  return group;
}

// Mesh for a sphere or box obstacle. Returns null for unsupported types
// (e.g. planes — the ground has its own dedicated mesh).
export function createObstacleMesh(obs) {
  if (obs.kind === 'player') {
    const mesh = createPlayerMesh(obs.team, obs.shooter);
    mesh.position.set(
      (obs.min.x + obs.max.x) * 0.5,
      obs.min.y,
      (obs.min.z + obs.max.z) * 0.5,
    );
    return mesh;
  }
  if (obs.type === 'sphere') {
    const geom = new SphereGeometry(obs.radius, 24, 16);
    const mat = new MeshStandardMaterial({ color: 0xc25e2a, roughness: 0.7 });
    const mesh = new Mesh(geom, mat);
    mesh.position.copy(obs.center);
    return mesh;
  }
  if (obs.type === 'box') {
    const sx = obs.max.x - obs.min.x;
    const sy = obs.max.y - obs.min.y;
    const sz = obs.max.z - obs.min.z;
    const geom = new BoxGeometry(sx, sy, sz);
    const mat = new MeshStandardMaterial({ color: obs.color ?? 0x6a6a8a, roughness: 0.7 });
    const mesh = new Mesh(geom, mat);
    mesh.position.set(
      (obs.min.x + obs.max.x) * 0.5,
      (obs.min.y + obs.max.y) * 0.5,
      (obs.min.z + obs.max.z) * 0.5,
    );
    return mesh;
  }
  return null;
}
