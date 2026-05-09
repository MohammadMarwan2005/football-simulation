import { DT, MAX_FRAME_DT } from './constants.js';
import { initialBall } from './state/ball.js';
import { initialWorld } from './state/world.js';
import { step } from './physics/integrator.js';
import { createScene } from './render/scene.js';
import { createBallMesh, createGroundMesh } from './render/meshes.js';
import { sync } from './render/sync.js';
import { setupInput } from './input/shoot.js';

const ball = initialBall();
const world = initialWorld();
const { scene, camera, renderer, controls } = createScene();

setupInput(ball, camera, document.querySelector('#app'));

const ballMesh = createBallMesh(ball);
const groundMesh = createGroundMesh();
scene.add(ballMesh);
scene.add(groundMesh);

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
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// Expose for live inspection in DevTools.
window.sim = { ball, world };

requestAnimationFrame(frame);
