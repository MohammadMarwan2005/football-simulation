import {
  Scene, PerspectiveCamera, WebGLRenderer,
  AmbientLight, DirectionalLight, Color,
} from 'three';

export function createScene() {
  const canvas = document.querySelector('#app');

  const scene = new Scene();
  scene.background = new Color(0x0a0a0a);

  const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(4, 3, 6);
  camera.lookAt(0, 1, 0);

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene.add(new AmbientLight(0xffffff, 0.4));
  const sun = new DirectionalLight(0xffffff, 0.9);
  sun.position.set(5, 10, 5);
  scene.add(sun);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}
