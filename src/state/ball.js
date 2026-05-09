import { Vector3, Quaternion } from '../math.js';
import {
  BALL_MASS, BALL_RADIUS, BALL_SPAWN_HEIGHT,
  CD, CL, RESTITUTION, MU_SLIDING, MU_ROLLING,
} from '../constants.js';

export function initialBall() {
  return {
    r: new Vector3(0, BALL_SPAWN_HEIGHT, 0),
    v: new Vector3(5, 5, 0),       // horizontal+upward shot — drag visibly shortens range
    omega: new Vector3(0, 0, 8),   // backspin around Z — visible rotation; viscous decay is slow
    q: new Quaternion(),
    mode: 'flying',
    m: BALL_MASS,
    R: BALL_RADIUS,
    Cd: CD,
    CL,
    e: RESTITUTION,
    mu: MU_SLIDING,
    mu_r: MU_ROLLING,
  };
}
