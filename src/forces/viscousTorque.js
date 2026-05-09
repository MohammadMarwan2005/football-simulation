import { Vector3 } from '../math.js';
import { VISCOUS_TORQUE_COEF } from '../constants.js';

// τ_visc = −8 π μ_air R³ ω
// Realistic μ_air gives a very slow decay (time constant ≈ 56 min for a regulation ball).
// The rotation update is mathematically correct; it just isn't visible on a few-second scale.
export function viscousTorque(ball, world) {
  const k = -VISCOUS_TORQUE_COEF * Math.PI * world.mu_air * ball.R * ball.R * ball.R;
  return ball.omega.clone().multiplyScalar(k);
}
