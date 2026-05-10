import { DT, MAX_FRAME_DT, CAMERA_FOLLOW_LERP } from './constants.js';
import { Vector3 } from './math.js';
import { initialBall } from './state/ball.js';
import { initialWorld } from './state/world.js';
import { step } from './physics/integrator.js';
import { createScene } from './render/scene.js';
import { createBallMesh, createGroundMesh, createObstacleMesh } from './render/meshes.js';
import { sync } from './render/sync.js';
import { createTrail, pushTrailPoint, resetTrail } from './render/trail.js';
import { createAim, updateAim } from './render/aim.js';
import { setupInput } from './input/shoot.js';

const ball = initialBall();
const world = initialWorld();
const { scene, camera, renderer, controls } = createScene();

const ballMesh = createBallMesh(ball);
const groundMesh = createGroundMesh();
scene.add(ballMesh, groundMesh);

for (const obs of world.obstacles) {
  const mesh = createObstacleMesh(obs);
  if (mesh) scene.add(mesh);
}

const trail = createTrail();
const aim = createAim();
scene.add(trail.line, aim.line);

setupInput(ball, camera, document.querySelector('#app'), () => resetTrail(trail));

const followCheck = document.getElementById('follow');
const _shift = new Vector3();
const _oldTarget = new Vector3();

// Fixed-timestep accumulator: physics runs at exactly DT regardless of frame rate.
let lastTime = performance.now();
let accumulator = 0;

// Periodic state logging — once per simulated second.
let simTime = 0;
let nextLog = 0;

function frame(now) {
  let elapsed = (now - lastTime) / 1000;
  lastTime = now;
  if (elapsed > MAX_FRAME_DT) elapsed = MAX_FRAME_DT;
  accumulator += elapsed;

  while (accumulator >= DT) {
    step(ball, world, DT);
    simTime += DT;
    if (simTime >= nextLog) {
      console.log(
        `t=${simTime.toFixed(1)}s`,
        `mode=${ball.mode}`,
        `r=(${ball.r.x.toFixed(2)}, ${ball.r.y.toFixed(2)}, ${ball.r.z.toFixed(2)})`,
        `|v|=${ball.v.length().toFixed(2)}`,
        `|ω|=${ball.omega.length().toFixed(4)}`,
        `|q|=${ball.q.length().toFixed(6)}`,
      );
      nextLog += 1;
    }
    accumulator -= DT;
  }

  sync(ball, ballMesh);
  pushTrailPoint(trail, ball.r);
  updateAim(aim, ball, camera);
  aim.line.visible = ball.v.length() < 0.5;

  if (followCheck.checked) {
    _oldTarget.copy(controls.target);
    controls.target.lerp(ball.r, CAMERA_FOLLOW_LERP);
    _shift.subVectors(controls.target, _oldTarget);
    camera.position.add(_shift);
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// Expose for live inspection in DevTools.
window.sim = { ball, world };

requestAnimationFrame(frame);
