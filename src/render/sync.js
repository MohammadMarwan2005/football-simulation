// Read-only: copy ball state to mesh transforms. Phase 1: position only.
export function sync(ball, mesh) {
  mesh.position.copy(ball.r);
}
