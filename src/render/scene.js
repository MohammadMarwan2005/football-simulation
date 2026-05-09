import {
  Scene, PerspectiveCamera, WebGLRenderer,
  AmbientLight, DirectionalLight, Color, GridHelper,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene() {
  const canvas = document.querySelector('#app');

  const scene = new Scene();
  scene.background = new Color(0x0a0a0a);

  const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(8, 6, 14);
  camera.lookAt(4, 2, 0);

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(4, 2, 0);
  controls.enableDamping = true;
  controls.update();

  scene.add(new AmbientLight(0xffffff, 0.4));
  const sun = new DirectionalLight(0xffffff, 0.9);
  sun.position.set(5, 10, 5);
  scene.add(sun);

  // 1 m grid on the ground plane — spatial reference for the trajectory.
  const grid = new GridHelper(200, 200, 0x444444, 0x222222);
  scene.add(grid);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, controls };
}
