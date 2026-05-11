import { Vector3, Spherical } from 'three';
import {
  CAM_ORBIT_SPEED, CAM_PAN_SPEED, CAM_ZOOM_SPEED,
} from '../constants.js';

// Keys we own; we preventDefault on these so arrow keys don't scroll the page
// and don't fight with focused form elements (sliders, etc.).
const HANDLED_KEYS = new Set([
  'arrowleft', 'arrowright', 'arrowup', 'arrowdown',
  'w', 'a', 's', 'd', 'q', 'e',
]);

const pressed = new Set();

export function setupCameraControls() {
  window.addEventListener('keydown', (e) => {
    if (e.target.matches?.('input, textarea, select')) return;
    const key = e.key.toLowerCase();
    if (HANDLED_KEYS.has(key)) {
      e.preventDefault();
      pressed.add(key);
    }
  });
  window.addEventListener('keyup', (e) => {
    pressed.delete(e.key.toLowerCase());
  });
  window.addEventListener('blur', () => pressed.clear());
}

// Pre-allocated scratch vectors so the per-frame loop allocates nothing.
const _offset = new Vector3();
const _spherical = new Spherical();
const _forward = new Vector3();
const _right = new Vector3();
const _delta = new Vector3();
const _tmp = new Vector3();

export function updateCameraControls(camera, controls, dt) {
  if (!controls.enabled) return;

  let dTheta = 0, dPhi = 0, dDist = 0;
  let dForward = 0, dRight = 0;

  if (pressed.has('arrowleft'))  dTheta += CAM_ORBIT_SPEED * dt;
  if (pressed.has('arrowright')) dTheta -= CAM_ORBIT_SPEED * dt;
  if (pressed.has('arrowup'))    dPhi   -= CAM_ORBIT_SPEED * dt;
  if (pressed.has('arrowdown'))  dPhi   += CAM_ORBIT_SPEED * dt;

  if (pressed.has('q')) dDist += CAM_ZOOM_SPEED * dt;
  if (pressed.has('e')) dDist -= CAM_ZOOM_SPEED * dt;

  if (pressed.has('w')) dForward += CAM_PAN_SPEED * dt;
  if (pressed.has('s')) dForward -= CAM_PAN_SPEED * dt;
  if (pressed.has('d')) dRight   += CAM_PAN_SPEED * dt;
  if (pressed.has('a')) dRight   -= CAM_PAN_SPEED * dt;

  // Orbit + zoom: rotate camera around target via spherical coords.
  if (dTheta || dPhi || dDist) {
    _offset.copy(camera.position).sub(controls.target);
    _spherical.setFromVector3(_offset);
    _spherical.theta += dTheta;
    _spherical.phi += dPhi;
    _spherical.radius = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, _spherical.radius + dDist),
    );
    _spherical.makeSafe();
    _offset.setFromSpherical(_spherical);
    camera.position.copy(controls.target).add(_offset);
  }

  // Pan: shift both target and camera by the view-relative forward/right.
  if (dForward || dRight) {
    camera.getWorldDirection(_forward);
    _forward.y = 0;
    _forward.normalize();
    // World-right when looking along _forward in the XZ plane: rotate 90° clockwise (viewed from above).
    _right.set(-_forward.z, 0, _forward.x);

    _delta.copy(_forward).multiplyScalar(dForward);
    _tmp.copy(_right).multiplyScalar(dRight);
    _delta.add(_tmp);

    controls.target.add(_delta);
    camera.position.add(_delta);
  }
}
