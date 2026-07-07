import { scenarios, applyScenario, removeScenarioObstacles } from '../scenarios.js';
import { startRecording, toCSV } from '../recorder.js';
import { createObstacleMesh } from '../render/meshes.js';
import { initialBall } from '../state/ball.js';
import { t, getLang, onLangChange } from '../i18n.js';

// Scenario panel: one button per validation scenario from the study (§8).
// Clicking a button resets the ball/world to that scenario's initial
// conditions, spawns its temporary obstacles, moves the camera, and starts
// the recorder so the run can be exported as CSV afterwards.
export function setupScenarioPanel({ ball, world, scene, camera, controls, recorder, onReset, cancelIntro }) {
  const list = document.getElementById('scenario-list');
  const status = document.getElementById('rec-status');
  const exportBtn = document.getElementById('export-csv');
  const freeBtn = document.getElementById('free-mode');

  // Obstacles/meshes belonging to the currently active scenario.
  let activeObstacles = [];
  let activeMeshes = [];
  let activeButton = null;

  function clearActive() {
    removeScenarioObstacles(world, activeObstacles);
    for (const mesh of activeMeshes) scene.remove(mesh);
    activeObstacles = [];
    activeMeshes = [];
    if (activeButton) activeButton.classList.remove('active');
    activeButton = null;
  }

  function runScenario(sc, button) {
    clearActive();
    activeObstacles = applyScenario(ball, world, sc);
    for (const obs of activeObstacles) {
      const mesh = createObstacleMesh(obs);
      if (mesh) {
        scene.add(mesh);
        activeMeshes.push(mesh);
      }
    }
    if (sc.cam) {
      cancelIntro();
      camera.position.set(...sc.cam.pos);
      controls.target.set(...sc.cam.target);
    }
    if (onReset) onReset();
    startRecording(recorder, sc.id, sc.duration);
    activeButton = button;
    button.classList.add('active');
  }

  const scenarioButtons = [];
  for (const sc of scenarios) {
    const button = document.createElement('button');
    button.addEventListener('click', () => runScenario(sc, button));
    list.appendChild(button);
    scenarioButtons.push([button, sc]);
  }

  function relabel() {
    const ar = getLang() === 'ar';
    for (const [button, sc] of scenarioButtons) {
      button.textContent = ar ? sc.nameAr : sc.nameEn;
      button.title = ar ? sc.nameEn : sc.nameAr;
    }
  }
  relabel();
  onLangChange(relabel);

  freeBtn.addEventListener('click', () => {
    clearActive();
    Object.assign(ball, initialBall());
    if (onReset) onReset();
  });

  exportBtn.addEventListener('click', () => {
    if (recorder.rows.length === 0) return;
    const blob = new Blob([toCSV(recorder)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${recorder.scenarioId ?? 'run'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // Lightweight status readout (polling keeps the recorder itself DOM-free).
  setInterval(() => {
    if (recorder.recording) {
      status.textContent = t('scen.recording', { t: recorder.t.toFixed(1) });
    } else if (recorder.rows.length > 0) {
      status.textContent = t('scen.ready', { id: recorder.scenarioId, n: recorder.rows.length });
    } else {
      status.textContent = t('scen.pick');
    }
  }, 250);
}
