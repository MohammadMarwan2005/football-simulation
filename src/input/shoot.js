import { Vector3 } from '../math.js';
import { DEG_TO_RAD } from '../constants.js';
import { initialBall } from '../state/ball.js';

// Reads slider value as a number.
function val(id) {
  return parseFloat(document.getElementById(id).value);
}

// Wires a slider to its readout span (input id → readout id).
function bind(id, readoutId) {
  const slider = document.getElementById(id);
  const readout = document.getElementById(readoutId);
  readout.textContent = slider.value;
  slider.addEventListener('input', () => { readout.textContent = slider.value; });
}

// Click on the canvas to fire the ball:
//   v₀ = power · (cos(elev) · forward_xz + sin(elev) · ŷ)   forward_xz = camera-forward, flattened
//   ω  = (ωx, ωy, ωz) from the sliders
// 'R' key resets the ball to initialBall() without firing.
// Reset is via Object.assign so other modules keep the same ball reference.
// onReset (optional) runs on every reset (shoot or R) — used to clear the trail.
export function setupInput(ball, camera, canvas, onReset) {
  bind('ox',  'ox-val');
  bind('oy',  'oy-val');
  bind('oz',  'oz-val');
  bind('pow', 'pow-val');
  bind('el',  'el-val');

  function reset() {
    Object.assign(ball, initialBall());
    if (onReset) onReset();
  }

  function shoot() {
    reset();

    const forward = new Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const elRad = val('el') * DEG_TO_RAD;
    const power = val('pow');

    ball.v.copy(forward).multiplyScalar(Math.cos(elRad) * power);
    ball.v.y = Math.sin(elRad) * power;

    ball.omega.set(val('ox'), val('oy'), val('oz'));
  }

  canvas.addEventListener('click', shoot);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') reset();
  });
}
