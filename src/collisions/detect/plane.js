import { Vector3 } from '../../math.js';

// Plane (point p₀, unit normal n̂_p) vs. ball (center r, radius R):
//   signed_dist = (r − p₀) · n̂_p
//   collision iff signed_dist < R
//   n = n̂_p,  depth = R − signed_dist,  contact = r − R · n̂_p
export function detectPlane(ball, plane) {
  const diff = new Vector3().subVectors(ball.r, plane.point);
  const signed = diff.dot(plane.normal);
  if (signed >= ball.R) return null;
  return {
    n: plane.normal.clone(),
    depth: ball.R - signed,
    contact: ball.r.clone().addScaledVector(plane.normal, -ball.R),
  };
}
