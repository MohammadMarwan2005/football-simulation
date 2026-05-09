import { Vector3 } from '../math.js';
import { INERTIA_FACTOR } from '../constants.js';
import { gravity } from '../forces/gravity.js';
import { drag } from '../forces/drag.js';
import { buoyancy } from '../forces/buoyancy.js';
import { viscousTorque } from '../forces/viscousTorque.js';
import { updateOrientation } from './orientation.js';
import { detectPlane } from '../collisions/detect/plane.js';
import { respond } from '../collisions/respond.js';

// Semi-implicit Euler.
//   F = F_g + F_d + F_b;          v ← v + (F/m)·dt;   r ← r + v·dt
//   τ = τ_visc;  α = τ/I;          ω ← ω + α·dt;       q ← integrate(ω, q, dt)
//   then resolve collisions against world.obstacles
export function step(ball, world, dt) {
  const F = new Vector3();
  F.add(gravity(ball, world));
  F.add(drag(ball, world));
  F.add(buoyancy(ball, world));

  const tau = new Vector3();
  tau.add(viscousTorque(ball, world));

  ball.v.addScaledVector(F, dt / ball.m);
  ball.r.addScaledVector(ball.v, dt);

  const I = INERTIA_FACTOR * ball.m * ball.R * ball.R;
  ball.omega.addScaledVector(tau, dt / I);
  updateOrientation(ball, dt);

  for (const obs of world.obstacles) {
    let contact = null;
    if (obs.type === 'plane') contact = detectPlane(ball, obs);
    if (contact) respond(ball, contact);
  }
}
