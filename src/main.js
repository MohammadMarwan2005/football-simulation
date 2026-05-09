import { DT, MAX_FRAME_DT } from './constants.js';
import { initialBall } from './state/ball.js';
import { initialWorld } from './state/world.js';
import { step } from './physics/integrator.js';
import { createScene } from './render/scene.js';
import { createBallMesh, createGroundMesh } from './render/meshes.js';
import { sync } from './render/sync.js';

const ball = initialBall();
const world = initialWorld();
const { scene, camera, renderer } = createScene();

const ballMesh = createBallMesh(ball);
const groundMesh = createGroundMesh();
scene.add(ballMesh);
scene.add(groundMesh);

// Fixed-timestep accumulator: physics runs at exactly DT regardless of frame rate.
let lastTime = performance.now();
let accumulator = 0;

// Phase 2 verification: log peak height after each bounce. A peak occurs
// when v.y crosses from positive to non-positive. Each peak should be
// ≈ e² × the previous (≈ 0.49 with e = 0.7).
let lastVy = ball.v.y;
console.log('spawn height:', ball.r.y.toFixed(3), 'm');

function frame(now) {
  let elapsed = (now - lastTime) / 1000;
  lastTime = now;
  if (elapsed > MAX_FRAME_DT) elapsed = MAX_FRAME_DT;
  accumulator += elapsed;

  while (accumulator >= DT) {
    step(ball, world, DT);
    if (lastVy > 0 && ball.v.y <= 0) {
      console.log('peak:', ball.r.y.toFixed(3), 'm');
    }
    lastVy = ball.v.y;
    accumulator -= DT;
  }

  sync(ball, ballMesh);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
