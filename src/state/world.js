import { Vector3 } from '../math.js';
import {
  G, RHO_AIR, MU_AIR,
  PITCH_LENGTH, PITCH_WIDTH, PITCH_PADDING, WALL_HEIGHT, WALL_THICKNESS,
} from '../constants.js';

export function initialWorld() {
  const hx = PITCH_LENGTH * 0.5 + PITCH_PADDING;
  const hz = PITCH_WIDTH * 0.5 + PITCH_PADDING;
  const t = WALL_THICKNESS;
  const h = WALL_HEIGHT;
  return {
    gravity: G,
    rho_air: RHO_AIR,
    mu_air: MU_AIR,
    v_wind: new Vector3(0, 0, 0),
    obstacles: [
      { type: 'plane',  point:  new Vector3(0, 0, 0), normal: new Vector3(0, 1, 0) },
      { type: 'sphere', center: new Vector3(0, 1, -8), radius: 1 },
      { type: 'box',    min:    new Vector3(-3, 0, -11), max: new Vector3(-1, 2, -9) },
      // Stadium perimeter walls enclosing the pitch + padding.
      { type: 'box', min: new Vector3(-hx,     0, +hz),     max: new Vector3(+hx,     h, +hz + t) },  // N
      { type: 'box', min: new Vector3(-hx,     0, -hz - t), max: new Vector3(+hx,     h, -hz)     },  // S
      { type: 'box', min: new Vector3(+hx,     0, -hz - t), max: new Vector3(+hx + t, h, +hz + t) },  // E
      { type: 'box', min: new Vector3(-hx - t, 0, -hz - t), max: new Vector3(-hx,     h, +hz + t) },  // W
    ],
  };
}
