import { Vector3 } from '../../math.js';

// AABB [min, max] vs ball (r, R):
//   p = clamp(r, min, max)            (closest point on the box to r)
//   d = r − p,  dist = |d|
//   collision iff dist < R
//   n = d / dist,  depth = R − dist,  contact = p
//
// Edge case: if r is inside the box, dist = 0. We pick the face closest to r,
// take its outward normal, and push the ball out by R + (distance to that face).
export function detectBox(ball, box) {
  const r = ball.r;
  const p = new Vector3(
    Math.max(box.min.x, Math.min(r.x, box.max.x)),
    Math.max(box.min.y, Math.min(r.y, box.max.y)),
    Math.max(box.min.z, Math.min(r.z, box.max.z)),
  );
  const d = new Vector3().subVectors(r, p);
  const dist = d.length();

  if (dist > 0) {
    if (dist >= ball.R) return null;
    return {
      n: d.divideScalar(dist),
      depth: ball.R - dist,
      contact: p,
    };
  }

  // r inside the box — pick the nearest face's outward normal.
  const dxMin = r.x - box.min.x, dxMax = box.max.x - r.x;
  const dyMin = r.y - box.min.y, dyMax = box.max.y - r.y;
  const dzMin = r.z - box.min.z, dzMax = box.max.z - r.z;
  const dx = Math.min(dxMin, dxMax);
  const dy = Math.min(dyMin, dyMax);
  const dz = Math.min(dzMin, dzMax);

  let n, faceDist;
  if (dx <= dy && dx <= dz) {
    n = new Vector3(dxMin < dxMax ? -1 : 1, 0, 0);
    faceDist = dx;
  } else if (dy <= dz) {
    n = new Vector3(0, dyMin < dyMax ? -1 : 1, 0);
    faceDist = dy;
  } else {
    n = new Vector3(0, 0, dzMin < dzMax ? -1 : 1);
    faceDist = dz;
  }
  return { n, depth: ball.R + faceDist, contact: p };
}
