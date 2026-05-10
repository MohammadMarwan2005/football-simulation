import { Vector3 } from '../math.js';
import { BufferGeometry, BufferAttribute, Line, LineBasicMaterial } from 'three';
import { AIM_LENGTH, DEG_TO_RAD } from '../constants.js';

// Two-vertex line from the ball, pointing along the current shot direction
// (camera forward × cos(el) + ŷ × sin(el)). Read the elevation slider live.
export function createAim() {
  const positions = new Float32Array(2 * 3);
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(positions, 3));
  const mat = new LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.6 });
  return { line: new Line(geom, mat), positions };
}

const _fwd = new Vector3();

export function updateAim(aim, ball, camera) {
  camera.getWorldDirection(_fwd);
  _fwd.y = 0;
  _fwd.normalize();
  const elRad = parseFloat(document.getElementById('el').value) * DEG_TO_RAD;
  const c = Math.cos(elRad), s = Math.sin(elRad);
  const p = aim.positions;
  p[0] = ball.r.x;                          p[1] = ball.r.y;                  p[2] = ball.r.z;
  p[3] = ball.r.x + _fwd.x * c * AIM_LENGTH; p[4] = ball.r.y + s * AIM_LENGTH; p[5] = ball.r.z + _fwd.z * c * AIM_LENGTH;
  aim.line.geometry.attributes.position.needsUpdate = true;
}
