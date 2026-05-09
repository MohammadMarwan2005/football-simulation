import { Quaternion } from '../math.js';

// Quaternion update from angular velocity (world frame):
//   q ← normalize( q + ½ · (ω_quat ⊗ q) · dt ),  ω_quat = (ω.x, ω.y, ω.z, 0)
const _wq = new Quaternion();

export function updateOrientation(ball, dt) {
  _wq.set(ball.omega.x, ball.omega.y, ball.omega.z, 0);
  _wq.multiply(ball.q);                        // _wq ← ω_quat ⊗ q
  ball.q.x += 0.5 * _wq.x * dt;
  ball.q.y += 0.5 * _wq.y * dt;
  ball.q.z += 0.5 * _wq.z * dt;
  ball.q.w += 0.5 * _wq.w * dt;
  ball.q.normalize();
}
