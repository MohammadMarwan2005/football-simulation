import {
  DT, MAX_FRAME_DT, CAMERA_FOLLOW_LERP,
  INTRO_CAM_START, INTRO_CAM_END, INTRO_DURATION_MS,
} from './constants.js';
import { Vector3 } from './math.js';
import { initialBall } from './state/ball.js';
import { initialWorld } from './state/world.js';
import { step } from './physics/integrator.js';
import { createScene } from './render/scene.js';
import {
  createBallMesh, createGroundMesh, createObstacleMesh,
  createHalfwayLineMesh, createCenterCircleMesh, createBoundaryLinesMesh,
  createPenaltyMarkingsMesh, createStandsMesh,
} from './render/meshes.js';
import { sync } from './render/sync.js';
import { createTrail, pushTrailPoint, resetTrail } from './render/trail.js';
import { createAim, updateAim } from './render/aim.js';
import { setupInput } from './input/shoot.js';
import { setupCameraControls, updateCameraControls } from './input/cameraControls.js';
import { setupScenarioPanel } from './input/scenarioPanel.js';
import { createRecorder, recordStep } from './recorder.js';
import { trackSession } from './sessionTracker.js';

trackSession();

const ball = initialBall();
const world = initialWorld();
const { scene, camera, renderer, controls } = createScene();

// Intro camera animation: lerp from a wide aerial down to the play view.
const introFrom = new Vector3(...INTRO_CAM_START);
const introTo = new Vector3(...INTRO_CAM_END);
const introStartTime = performance.now();
let introActive = true;
camera.position.copy(introFrom);
controls.enabled = false;

// Scenario buttons skip straight to their own camera view.
function cancelIntro() {
  introActive = false;
  controls.enabled = true;
}

// Log the camera config whenever the user finishes dragging — handy for picking new defaults.
controls.addEventListener('end', () => {
  const p = camera.position;
  const t = controls.target;
  console.log(
    `CAM pos=(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`,
    `target=(${t.x.toFixed(2)}, ${t.y.toFixed(2)}, ${t.z.toFixed(2)})`,
  );
});

const ballMesh = createBallMesh(ball);
const groundMesh = createGroundMesh();
const halfwayLineMesh = createHalfwayLineMesh();
const centerCircleMesh = createCenterCircleMesh();
const boundaryLinesMesh = createBoundaryLinesMesh();
const penaltyMarkingsMesh = createPenaltyMarkingsMesh();
const standsMesh = createStandsMesh();
scene.add(ballMesh, groundMesh, halfwayLineMesh, centerCircleMesh, boundaryLinesMesh, penaltyMarkingsMesh, standsMesh);

for (const obs of world.obstacles) {
  const mesh = createObstacleMesh(obs);
  if (mesh) scene.add(mesh);
}

const trail = createTrail();
const aim = createAim();
scene.add(trail.line, aim.line);

setupInput(ball, camera, document.querySelector('#app'), () => resetTrail(trail));
setupCameraControls();

const recorder = createRecorder();
setupScenarioPanel({
  ball, world, scene, camera, controls, recorder,
  onReset: () => resetTrail(trail),
  cancelIntro,
});

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
    recordStep(recorder, ball, DT);
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

  if (introActive) {
    const t = Math.min(1, (now - introStartTime) / INTRO_DURATION_MS);
    const eased = 1 - (1 - t) * (1 - t);  // quadratic ease-out
    camera.position.lerpVectors(introFrom, introTo, eased);
    if (t >= 1) {
      introActive = false;
      controls.enabled = true;
    }
  } else {
    if (followCheck.checked) {
      _oldTarget.copy(controls.target);
      controls.target.lerp(ball.r, CAMERA_FOLLOW_LERP);
      _shift.subVectors(controls.target, _oldTarget);
      camera.position.add(_shift);
    }
    updateCameraControls(camera, controls, elapsed);
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// Expose for live inspection in DevTools.
window.sim = { ball, world, recorder, scene, camera, renderer };

requestAnimationFrame(frame);
