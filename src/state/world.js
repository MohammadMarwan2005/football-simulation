import { Vector3 } from '../math.js';
import {
  G, RHO_AIR, MU_AIR,
  PITCH_LENGTH, PITCH_WIDTH, PITCH_PADDING, WALL_HEIGHT, WALL_THICKNESS,
  GOAL_WIDTH, GOAL_HEIGHT, POST_THICKNESS,
  PLAYER_HEIGHT, PLAYER_WIDTH,
} from '../constants.js';

export function initialWorld() {
  const hx = PITCH_LENGTH * 0.5 + PITCH_PADDING;
  const hz = PITCH_WIDTH * 0.5 + PITCH_PADDING;
  const halfL = PITCH_LENGTH * 0.5;
  const t = WALL_THICKNESS;
  const h = WALL_HEIGHT;
  const halfGW = GOAL_WIDTH * 0.5;
  const halfPt = POST_THICKNESS * 0.5;

  const halfPw = PLAYER_WIDTH * 0.5;
  const makePlayer = (x, z, team) => ({
    type: 'box',
    kind: 'player',
    team,
    min: new Vector3(x - halfPw, 0,             z - halfPw),
    max: new Vector3(x + halfPw, PLAYER_HEIGHT, z + halfPw),
  });

  // 4-4-2 formation for the home team (defending the -x goal); away team mirrors across midfield.
  // Layout: GK, then 4 defenders, 4 midfielders, then forwards added asymmetrically below.
  const homeFormation = [
    [-50,   0],
    [-35, -20], [-35,  -7], [-35,   7], [-35,  20],
    [-20, -20], [-20,  -7], [-20,   7], [-20,  20],
    [-5,   -5],
  ];
  const players = [];
  for (const [px, pz] of homeFormation) {
    players.push(makePlayer(px, pz, 'home'));
    players.push(makePlayer(-px, pz, 'away'));
  }
  // Asymmetric pair: home forward stands near the ball (centered at origin);
  // the away counterpart keeps its mirrored spot.
  players.push(makePlayer(-0.6, 0, 'home'));
  players.push(makePlayer(5,    5, 'away'));

  const goalFrames = [];
  for (const sign of [1, -1]) {
    const x = sign * halfL;
    // Two posts (at z = ±halfGW), centered on the goal line.
    for (const z of [+halfGW, -halfGW]) {
      goalFrames.push({
        type: 'box',
        min: new Vector3(x - halfPt, 0,           z - halfPt),
        max: new Vector3(x + halfPt, GOAL_HEIGHT, z + halfPt),
        color: 0xffffff,
      });
    }
    // Crossbar sitting on top of the posts (bottom edge at GOAL_HEIGHT).
    goalFrames.push({
      type: 'box',
      min: new Vector3(x - halfPt, GOAL_HEIGHT,                  -halfGW - halfPt),
      max: new Vector3(x + halfPt, GOAL_HEIGHT + POST_THICKNESS, +halfGW + halfPt),
      color: 0xffffff,
    });
  }

  return {
    gravity: G,
    rho_air: RHO_AIR,
    mu_air: MU_AIR,
    v_wind: new Vector3(0, 0, 0),
    obstacles: [
      { type: 'plane',  point: new Vector3(0, 0, 0), normal: new Vector3(0, 1, 0) },
      // Stadium perimeter walls enclosing the pitch + padding.
      { type: 'box', min: new Vector3(-hx,     0, +hz),     max: new Vector3(+hx,     h, +hz + t) },  // N
      { type: 'box', min: new Vector3(-hx,     0, -hz - t), max: new Vector3(+hx,     h, -hz)     },  // S
      { type: 'box', min: new Vector3(+hx,     0, -hz - t), max: new Vector3(+hx + t, h, +hz + t) },  // E
      { type: 'box', min: new Vector3(-hx - t, 0, -hz - t), max: new Vector3(-hx,     h, +hz + t) },  // W
      ...goalFrames,
      ...players,
    ],
  };
}
