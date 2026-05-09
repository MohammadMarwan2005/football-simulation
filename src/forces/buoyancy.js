import { Vector3 } from '../math.js';
import { SPHERE_VOLUME_COEF } from '../constants.js';

// F_b = ρ_air · V · g · (0, +1, 0),  V = (4/3) π R³
// Tiny in air (~1.6% of gravity for a regulation ball) but nonzero.
export function buoyancy(ball, world) {
  const V = SPHERE_VOLUME_COEF * Math.PI * ball.R * ball.R * ball.R;
  return new Vector3(0, world.rho_air * V * world.gravity, 0);
}
