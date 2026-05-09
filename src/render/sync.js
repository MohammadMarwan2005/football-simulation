// Read-only: copy ball state to mesh transforms.
export function sync(ball, mesh) {
  mesh.position.copy(ball.r);
  mesh.quaternion.copy(ball.q);
}
