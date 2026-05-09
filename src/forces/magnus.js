import { Vector3 } from '../math.js';

// F_M = ½ · ρ_air · C_L · A · R · (ω × v),  A = π R²
//   Direction follows the right-hand cross of spin and motion (curl).
export function magnus(ball, world) {
  const A = Math.PI * ball.R * ball.R;
  const k = 0.5 * world.rho_air * ball.CL * A * ball.R;
  return new Vector3().crossVectors(ball.omega, ball.v).multiplyScalar(k);
}
