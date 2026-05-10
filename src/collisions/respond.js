import { Vector3 } from '../math.js';
import { INERTIA_FACTOR, TANGENTIAL_STICK_FACTOR } from '../constants.js';

// Impulse-based response — shape-agnostic.
// Inputs: ball, contact = { n, depth, contact }. Uses ball.{e, mu, m, R}.
//
//   r_c   = −R · n̂                                  (center → contact)
//   v_c   = v + ω × r_c                              (velocity at contact)
//   v_cn  = v_c · n̂,  v_ct = v_c − v_cn · n̂
//   J_n   = −(1+e) · m · v_cn · n̂                    (normal impulse)
//   J_t   = − min((2/7)·m·|v_ct|, μ·|J_n|) · t̂       (Coulomb stick/slip)
//   v ← v + (J_n + J_t) / m
//   ω ← ω + (r_c × J_t) / I                          (J_n is along r_c → no torque)
//   r ← r + n̂ · depth                                (push out of penetration)
export function respond(ball, contact) {
  const { n, depth } = contact;
  const I = INERTIA_FACTOR * ball.m * ball.R * ball.R;

  const rc = n.clone().multiplyScalar(-ball.R);
  const vc = new Vector3().crossVectors(ball.omega, rc).add(ball.v);
  const vcn = vc.dot(n);

  // Already separating (e.g. residual contact after a previous resolve) — just push out.
  if (vcn >= 0) {
    ball.r.addScaledVector(n, depth);
    return;
  }

  const vct = vc.clone().addScaledVector(n, -vcn);
  const vctMag = vct.length();

  const Jn_mag = -(1 + ball.e) * ball.m * vcn;     // > 0

  const Jt = new Vector3();
  if (vctMag > 0) {
    const Jstick = TANGENTIAL_STICK_FACTOR * ball.m * vctMag;
    const Jt_mag = Math.min(Jstick, ball.mu * Jn_mag);
    Jt.copy(vct).multiplyScalar(-Jt_mag / vctMag);
  }

  ball.v.addScaledVector(n, Jn_mag / ball.m);
  ball.v.addScaledVector(Jt, 1 / ball.m);

  const angImpulse = new Vector3().crossVectors(rc, Jt);
  ball.omega.addScaledVector(angImpulse, 1 / I);

  ball.r.addScaledVector(n, depth);

  // Render-side hook: record the impulse-induced velocity change for squash on impact.
  ball._lastImpact = { time: performance.now(), magnitude: Jn_mag / ball.m };
}
