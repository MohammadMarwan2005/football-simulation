import {
  Mesh, SphereGeometry, MeshStandardMaterial, PlaneGeometry,
} from 'three';

export function createBallMesh(ball) {
  const geom = new SphereGeometry(ball.R, 32, 16);
  const mat = new MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6 });
  return new Mesh(geom, mat);
}

export function createGroundMesh() {
  const geom = new PlaneGeometry(200, 200);
  geom.rotateX(-Math.PI / 2);
  const mat = new MeshStandardMaterial({ color: 0x2a6a2a, roughness: 1.0 });
  return new Mesh(geom, mat);
}
