import { ROLLING_RATIO } from '../constants.js';

// Post-bounce trigger: if the rebound is shallow (|v·n| / |v_t| < ROLLING_RATIO),
// switch to rolling. Only fires for ground-like horizontal planes (n̂.y ≈ 1).
//
// At the transition: zero the normal velocity and pick ω that satisfies no-slip
// at the contact (the bottom of the ball). Derivation for n̂ = (0,1,0), r_c = (0,−R,0):
//     v + ω × r_c = 0    ⇒    ω.x = v.z / R,   ω.z = −v.x / R,   ω.y unchanged.
export function maybeTransition(ball, contact) {
  if (ball.mode !== 'flying') return;
  if (contact.n.y < 1 - 0.01) return;            // not a horizontal plane

  const vnMag = Math.abs(ball.v.dot(contact.n));
  const vt = Math.sqrt(ball.v.x * ball.v.x + ball.v.z * ball.v.z);
  if (vt === 0) return;
  if (vnMag / vt >= ROLLING_RATIO) return;

  ball.v.y = 0;
  ball.r.y = ball.R;
  ball.omega.x = ball.v.z / ball.R;
  ball.omega.z = -ball.v.x / ball.R;
  ball.mode = 'rolling';
}

// Rolling integration: skip flight forces; apply linear deceleration μ_r·g·dt
// in the direction opposite v_t; keep ω locked to v via no-slip; sit on ground.
export function rollStep(ball, world, dt) {
  const vtMagSq = ball.v.x * ball.v.x + ball.v.z * ball.v.z;
  if (vtMagSq > 0) {
    const vtMag = Math.sqrt(vtMagSq);
    const decel = ball.mu_r * world.gravity * dt;
    if (decel >= vtMag) {
      ball.v.x = 0;
      ball.v.z = 0;
      ball.omega.x = 0;
      ball.omega.z = 0;
    } else {
      const factor = 1 - decel / vtMag;
      ball.v.x *= factor;
      ball.v.z *= factor;
      ball.omega.x = ball.v.z / ball.R;
      ball.omega.z = -ball.v.x / ball.R;
    }
  }
  ball.v.y = 0;
  ball.r.x += ball.v.x * dt;
  ball.r.z += ball.v.z * dt;
  ball.r.y = ball.R;
}
