import { Vector3 } from '../math.js';
import { INERTIA_FACTOR } from '../constants.js';
import { gravity } from '../forces/gravity.js';
import { drag } from '../forces/drag.js';
import { magnus } from '../forces/magnus.js';
import { buoyancy } from '../forces/buoyancy.js';
import { viscousTorque } from '../forces/viscousTorque.js';
import { updateOrientation } from './orientation.js';
import { rollStep, maybeTransition } from './stateMachine.js';
import { detectPlane } from '../collisions/detect/plane.js';
import { detectSphere } from '../collisions/detect/sphere.js';
import { detectBox } from '../collisions/detect/box.js';
import { respond } from '../collisions/respond.js';

// Semi-implicit Euler, branched on ball.mode:
//   flying  → F = F_g + F_d + F_M + F_b;  τ = τ_visc;  full v/r/ω/q update
//   rolling → skip flight forces; apply rolling resistance; ω locked to v via no-slip
// Then resolve collisions against world.obstacles. Plane bounces also call
// maybeTransition, which can flip flying → rolling when the rebound is shallow.
export function step(ball, world, dt) {
  if (ball.mode === 'rolling') {
    rollStep(ball, world, dt);
  } else {
    const F = new Vector3();
    F.add(gravity(ball, world));
    F.add(drag(ball, world));
    F.add(magnus(ball, world));
    F.add(buoyancy(ball, world));

    const tau = new Vector3();
    tau.add(viscousTorque(ball, world));

    ball.v.addScaledVector(F, dt / ball.m);
    ball.r.addScaledVector(ball.v, dt);

    const I = INERTIA_FACTOR * ball.m * ball.R * ball.R;
    ball.omega.addScaledVector(tau, dt / I);
  }
  updateOrientation(ball, dt);

  for (const obs of world.obstacles) {
    let contact = null;
    if      (obs.type === 'plane')  contact = detectPlane(ball, obs);
    else if (obs.type === 'sphere') contact = detectSphere(ball, obs);
    else if (obs.type === 'box')    contact = detectBox(ball, obs);
    if (contact) {
      respond(ball, contact);
      if (obs.type === 'plane') maybeTransition(ball, contact);
    }
  }
}
