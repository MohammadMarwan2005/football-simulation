import { Vector3 } from '../math.js';
import { G, RHO_AIR, MU_AIR } from '../constants.js';

export function initialWorld() {
  return {
    gravity: G,
    rho_air: RHO_AIR,
    mu_air: MU_AIR,
    v_wind: new Vector3(0, 0, 0),
    obstacles: [
      { type: 'plane', point: new Vector3(0, 0, 0), normal: new Vector3(0, 1, 0) },
    ],
  };
}
