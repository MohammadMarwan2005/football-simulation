import {
  Mesh, SphereGeometry, MeshStandardMaterial, PlaneGeometry, BoxGeometry,
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

// Mesh for a sphere or box obstacle. Returns null for unsupported types
// (e.g. planes — the ground has its own dedicated mesh).
export function createObstacleMesh(obs) {
  if (obs.type === 'sphere') {
    const geom = new SphereGeometry(obs.radius, 24, 16);
    const mat = new MeshStandardMaterial({ color: 0xc25e2a, roughness: 0.7 });
    const mesh = new Mesh(geom, mat);
    mesh.position.copy(obs.center);
    return mesh;
  }
  if (obs.type === 'box') {
    const sx = obs.max.x - obs.min.x;
    const sy = obs.max.y - obs.min.y;
    const sz = obs.max.z - obs.min.z;
    const geom = new BoxGeometry(sx, sy, sz);
    const mat = new MeshStandardMaterial({ color: 0x6a6a8a, roughness: 0.7 });
    const mesh = new Mesh(geom, mat);
    mesh.position.set(
      (obs.min.x + obs.max.x) * 0.5,
      (obs.min.y + obs.max.y) * 0.5,
      (obs.min.z + obs.max.z) * 0.5,
    );
    return mesh;
  }
  return null;
}
