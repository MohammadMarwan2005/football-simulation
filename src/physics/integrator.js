import { gravity } from '../forces/gravity.js';

// Semi-implicit Euler. Phase 1: gravity only, no collisions, no rotation.
//   v ← v + (F/m)·dt
//   r ← r + v·dt
export function step(ball, world, dt) {
  const F = gravity(ball, world);
  ball.v.addScaledVector(F, dt / ball.m);
  ball.r.addScaledVector(ball.v, dt);
}
