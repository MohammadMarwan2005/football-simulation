import { gravity } from '../forces/gravity.js';
import { detectPlane } from '../collisions/detect/plane.js';
import { respond } from '../collisions/respond.js';

// Semi-implicit Euler with collision resolution.
//   v ← v + (F/m)·dt
//   r ← r + v·dt
//   for each obstacle: detect; if hit, respond
export function step(ball, world, dt) {
  const F = gravity(ball, world);
  ball.v.addScaledVector(F, dt / ball.m);
  ball.r.addScaledVector(ball.v, dt);

  for (const obs of world.obstacles) {
    let contact = null;
    if (obs.type === 'plane') contact = detectPlane(ball, obs);
    if (contact) respond(ball, contact);
  }
}
