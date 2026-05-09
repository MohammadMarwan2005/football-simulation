import { Vector3 } from '../math.js';

// F_d = −½ · ρ_air · C_d · A · |v_rel| · v_rel
//   v_rel = v − v_wind,  A = π R²
export function drag(ball, world) {
  const vrel = new Vector3().subVectors(ball.v, world.v_wind);
  const speed = vrel.length();
  if (speed === 0) return new Vector3(0, 0, 0);
  const A = Math.PI * ball.R * ball.R;
  const k = -0.5 * world.rho_air * ball.Cd * A * speed;
  return vrel.multiplyScalar(k);
}
