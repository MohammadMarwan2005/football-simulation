import { Vector3 } from '../math.js';

// F_g = m · g · (0, −1, 0)
export function gravity(ball, world) {
  return new Vector3(0, -ball.m * world.gravity, 0);
}
