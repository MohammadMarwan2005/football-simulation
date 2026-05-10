import { Vector3 } from '../../math.js';

// Sphere obstacle (center c, radius R_o) vs ball (r, R):
//   d = r − c,  dist = |d|
//   collision iff dist < R + R_o
//   n = d / dist,  depth = (R + R_o) − dist,  contact = c + R_o · n
export function detectSphere(ball, sphere) {
  const d = new Vector3().subVectors(ball.r, sphere.center);
  const dist = d.length();
  const sum = ball.R + sphere.radius;
  if (dist >= sum) return null;
  // Coincident centers: pick an arbitrary up-normal so the response is still well-defined.
  const n = dist > 0 ? d.divideScalar(dist) : new Vector3(0, 1, 0);
  return {
    n,
    depth: sum - dist,
    contact: sphere.center.clone().addScaledVector(n, sphere.radius),
  };
}
