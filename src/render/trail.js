import { BufferGeometry, BufferAttribute, Line, LineBasicMaterial } from 'three';
import { TRAIL_MAX_POINTS } from '../constants.js';

// Rolling buffer of the last TRAIL_MAX_POINTS ball positions, rendered as a Line.
export function createTrail() {
  const positions = new Float32Array(TRAIL_MAX_POINTS * 3);
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(positions, 3));
  geom.setDrawRange(0, 0);
  const mat = new LineBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.7 });
  return { line: new Line(geom, mat), positions, count: 0 };
}

export function pushTrailPoint(trail, p) {
  if (trail.count < TRAIL_MAX_POINTS) {
    const i = trail.count * 3;
    trail.positions[i]     = p.x;
    trail.positions[i + 1] = p.y;
    trail.positions[i + 2] = p.z;
    trail.count++;
  } else {
    // Rolling buffer: drop the oldest point, append the newest.
    trail.positions.copyWithin(0, 3);
    const i = (TRAIL_MAX_POINTS - 1) * 3;
    trail.positions[i]     = p.x;
    trail.positions[i + 1] = p.y;
    trail.positions[i + 2] = p.z;
  }
  trail.line.geometry.setDrawRange(0, trail.count);
  trail.line.geometry.attributes.position.needsUpdate = true;
}

export function resetTrail(trail) {
  trail.count = 0;
  trail.line.geometry.setDrawRange(0, 0);
}
