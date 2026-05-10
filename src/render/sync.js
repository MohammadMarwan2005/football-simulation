import { SQUASH_DURATION_MS, SQUASH_AMOUNT, SQUASH_SAT_VELOCITY } from '../constants.js';

// Read-only: copy ball state to mesh transforms.
// On impact, briefly compress the mesh (uniform pulse) for visual contact feedback.
// _lastImpact is written by collisions/respond.js; we only read it here.
export function sync(ball, mesh) {
  mesh.position.copy(ball.r);
  mesh.quaternion.copy(ball.q);

  let scale = 1;
  if (ball._lastImpact) {
    const elapsed = performance.now() - ball._lastImpact.time;
    if (elapsed < SQUASH_DURATION_MS) {
      // Triangular envelope: 0 → 1 → 0 over the duration.
      const t = elapsed / SQUASH_DURATION_MS;
      const env = 1 - Math.abs(2 * t - 1);
      const intensity = env * Math.min(ball._lastImpact.magnitude / SQUASH_SAT_VELOCITY, 1);
      scale = 1 - SQUASH_AMOUNT * intensity;
    }
  }
  mesh.scale.setScalar(scale);
}
