# Football Motion Simulation — Project Plan

## Overview

A 3D simulation of a soccer ball in flight under gravity, drag, Magnus, and viscous spin decay. The ball collides with planes, spheres, and axis-aligned boxes via a single **impulse-based response** that updates both linear and angular velocity simultaneously, so spin–translation coupling at impact emerges from physics, not from magic numbers. When bouncing energy dies down, the ball transitions to a **rolling state**. Rendering is Three.js.

The architecture is intentionally simple: pure-function physics, a single source of truth for state, render layer decoupled and read-only.

---

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

---

## Tech Stack

- **Three.js** (latest, via npm)
- **Vite** (vanilla JS template — `npm create vite@latest`)
- **ES modules**, plain JavaScript (no TypeScript for v1)
- **No external physics engine** — custom physics for clarity and to match the report's derivations

---

## Architecture Principles

These are the rules. Re-check against them before adding anything.

1. **Pure functions for physics.** Forces and detectors are `(state, env) → result`. They do not mutate inputs. They do not read or write hidden state.
2. **Single source of truth.** One `ball` state object passes through the loop. No parallel mirrors of physics state in render code or UI code.
3. **Decouple physics from rendering.** Files under `src/physics/`, `src/forces/`, `src/collisions/` **must not import `three`**. They use plain math (we re-export `Vector3`/`Quaternion` from a `math.js` shim that wraps `three`'s math classes — see Phase 0).
4. **Fixed timestep with accumulator.** `dt = 1/60 s`. Accumulate real elapsed time, step physics in fixed increments, render at any rate. Behavior is independent of frame rate.
5. **Constants in one place.** `src/constants.js` holds every physical constant and default parameter. No magic numbers in logic files. The only literals allowed elsewhere are `0`, `1`, `2`, `0.5`, `Math.PI`.
6. **No premature abstraction.** Do not create a `Force` interface, a `Collidable` base class, or a DI container. Inline first; extract a helper only when the same code appears in three places.
7. **Small files, one concern.** Aim for under ~150 lines per file. If a file does two jobs, split it.
8. **Comments explain *why*, not *what*.** The code already shows what; comments add reasoning, units, citations.
9. **Reset by `Object.assign(ball, initialBall())`** — never reassign the binding. Other modules hold the same reference.
10. **No new dependencies** beyond Three.js and Vite without explicit reason.

---

## Folder Structure

```
src/
├── main.js                    — entry: scene setup, animation loop wiring
├── constants.js               — every constant and default parameter
├── math.js                    — re-exports Vector3, Quaternion from three (physics shim)
├── state/
│   ├── ball.js                — initialBall(), createBall(opts)
│   └── world.js               — initialWorld() with default obstacles
├── forces/
│   ├── gravity.js             — F_g
│   ├── drag.js                — F_d (uses v_rel = v - v_wind)
│   ├── magnus.js              — F_M
│   ├── buoyancy.js            — F_b
│   └── viscousTorque.js       — τ_visc
├── physics/
│   ├── integrator.js          — semi-implicit Euler step
│   ├── orientation.js         — quaternion update + normalize
│   └── stateMachine.js        — FLYING ↔ ROLLING transitions
├── collisions/
│   ├── detect/
│   │   ├── plane.js           — (ball, plane) → ContactInfo | null
│   │   ├── sphere.js          — (ball, sphereObs) → ContactInfo | null
│   │   └── box.js             — (ball, boxObs) → ContactInfo | null
│   └── respond.js             — impulse-based response, shape-agnostic
├── input/
│   └── shoot.js               — click → initial v, ω
└── render/
    ├── scene.js               — scene, camera, lights, renderer
    ├── meshes.js              — mesh creation per obstacle type
    └── sync.js                — readonly: ball state → mesh transforms

index.html
vite.config.js
package.json
```

**Note on `math.js`:** It is a one-liner that re-exports `Vector3` and `Quaternion` from `three`. This keeps physics modules from importing `three` directly, so we can later swap math libraries without touching physics code. Do not put any logic in `math.js`.

---

## Data Shapes

### Ball state

```js
{
  r:    Vector3,        // position (m)
  v:    Vector3,        // linear velocity (m/s)
  ω:    Vector3,        // angular velocity (rad/s) — name it `omega` in code if Unicode is awkward
  q:    Quaternion,     // orientation
  mode: 'flying' | 'rolling',
  m:    number,         // mass (kg)
  R:    number,         // radius (m)
  Cd:   number,
  CL:   number,
  e:    number,         // restitution
  mu:   number,         // sliding friction (Coulomb)
  mu_r: number,         // rolling friction
}
```

`A = π R²` and `I = (2/5) m R²` are derived; compute as needed (or memoize on the ball object once).

### World

```js
{
  gravity:   number,     // 9.81
  rho_air:   number,     // 1.225
  mu_air:    number,     // 1.85e-5
  v_wind:    Vector3,
  obstacles: Obstacle[],
}
```

### Obstacle

```js
{ type: 'plane', point: Vector3, normal: Vector3 }
{ type: 'sphere', center: Vector3, radius: number }
{ type: 'box', min: Vector3, max: Vector3 }
```

### ContactInfo (returned by detectors)

```js
{ n: Vector3, depth: number, contact: Vector3 } | null
```

`n` always points **from the obstacle outward toward the ball center**.

---

## Physics Reference

### Constants and defaults

| Symbol | Name | Value |
|--------|------|-------|
| `g` | gravity | 9.81 m/s² |
| `ρ_air` | air density | 1.225 kg/m³ |
| `μ_air` | air dynamic viscosity | 1.85 × 10⁻⁵ Pa·s |
| `m` | ball mass | 0.43 kg |
| `R` | ball radius | 0.11 m |
| `C_d` | drag coefficient | 0.25 |
| `C_L` | lift coefficient (Magnus) | 0.20 |
| `e` | restitution | 0.7 |
| `μ` | sliding friction (Coulomb) | 0.4 |
| `μ_r` | rolling friction | 0.05 |
| `dt` | fixed timestep | 1/60 s |

### Forces in flight

```
F_g = m g (0, −1, 0)

v_rel = v − v_wind
F_d   = −½ ρ_air C_d A |v_rel| v_rel

F_M   = ½ ρ_air C_L A R (ω × v)

F_b   = ρ_air V g (0, +1, 0),   V = (4/3) π R³
```

Total: `F = F_g + F_d + F_M + F_b`. Acceleration: `a = F / m`.

### Torques in flight

```
τ_visc = −8 π μ_air R³ ω
```

Angular acceleration: `α = τ / I` for a solid uniform sphere about its center.

### Integrator (semi-implicit Euler)

```
v ← v + a · dt
r ← r + v · dt
ω ← ω + α · dt
q ← normalize(q + ½ (ω_quat · q) · dt)
```

where `ω_quat = (ω.x, ω.y, ω.z, 0)` and `·` is quaternion multiplication.

### Collision detection — return `{ n, depth, contact }`

**Plane** (point `p₀`, normal `n̂_p`, ball at `r`, radius `R`):
```
signed_dist = (r − p₀) · n̂_p
if signed_dist < R:
  n     = n̂_p
  depth = R − signed_dist
  contact = r − R · n̂_p
```

**Sphere obstacle** (center `c`, radius `R_o`):
```
d = r − c;  dist = |d|
if dist < R + R_o:
  n     = d / dist
  depth = (R + R_o) − dist
  contact = c + R_o · n
```

**Axis-aligned box** (min `b_min`, max `b_max`):
```
p_i = clamp(r_i, b_min_i, b_max_i)   for i ∈ {x, y, z}
d   = r − p
dist = |d|
if dist < R:
  n     = d / dist                    (handle dist == 0 edge case: pick separating-axis normal)
  depth = R − dist
  contact = p
```

### Collision response (impulse-based, shape-agnostic)

This is the **single function** used for all shapes. Inputs: `ball`, `contact = { n, depth, contact }`, `params = { e, μ }`.

```
1. r_c = −R · n̂                                 // ball center to contact
2. v_c = v + ω × r_c                             // velocity at contact point
3. v_cn = (v_c · n̂)                              // scalar
   v_ct = v_c − v_cn · n̂                         // tangential vector

4. // Normal impulse
   J_n_mag = −(1 + e) · m · v_cn
   J_n     = J_n_mag · n̂

5. // Tangential impulse (Coulomb stick/slip for a solid sphere)
   // Stick impulse magnitude needed to zero v_ct:
   //   J_stick = (2/7) · m · |v_ct|
   //   (the 2/7 factor accounts for the linked translation/rotation update of a uniform sphere)
   if |v_ct| == 0:
     J_t = 0
   else:
     t̂ = v_ct / |v_ct|
     J_stick = (2/7) · m · |v_ct|
     if J_stick ≤ μ · |J_n_mag|:
       J_t = −J_stick · t̂                       // stick
     else:
       J_t = −μ · |J_n_mag| · t̂                 // slip

6. // Apply
   J = J_n + J_t
   v ← v + J / m
   ω ← ω + (r_c × J_t) / I                       // only J_t produces torque (J_n is along r_c)

7. // Push out of penetration
   r ← r + n̂ · depth
```

### Rolling state

**Trigger** (after a bounce, with `v_t = horizontal projection of v` and `n̂ = ground normal`):
```
if |v · n̂| / |v_t| < 0.17:
  mode ← 'rolling'
  v ← v − (v · n̂) · n̂                            // zero normal component
  // enforce no-slip: ω such that ω × (R · n̂) = −v
  // for ground n̂ = (0,1,0): ω.x = v.z / R, ω.z = −v.x / R, keep ω.y
```

**While rolling**:
- Skip the in-flight force computation; instead apply rolling resistance directly.
- `τ_roll = −μ_r · m · g · R · v̂_t` (in physics; equivalent linear deceleration is `μ_r g`).
- Linear update: `v ← v · (1 − μ_r · g · dt / |v_t|)` (clamped to zero when sign flips).
- ω stays consistent with `v` via the no-slip relation.

**Exit**: only on reset for v1.

---

## Phases

Each phase ends with a runnable, visually-verifiable result. Do **not** advance until acceptance criteria are met.

### Phase 0 — Project setup `[ ]`

- [ ] `npm create vite@latest` → vanilla JS template
- [ ] `npm install three`
- [ ] Set up the folder structure above with empty files
- [ ] Create `src/math.js` re-exporting `Vector3, Quaternion` from `three`
- [ ] Create `src/constants.js` with the values from the table above
- [ ] Create `index.html` with a `<canvas>` container

**Acceptance:** `npm run dev` shows a blank dark canvas without errors.

---

### Phase 1 — Scene + falling ball `[ ]`

- [ ] `src/render/scene.js`: create `Scene`, `PerspectiveCamera`, `WebGLRenderer`, ambient + directional lights
- [ ] `src/render/meshes.js`: factory functions for ball mesh and ground plane mesh
- [ ] `src/state/ball.js`: `initialBall()` returning the data shape above
- [ ] `src/state/world.js`: `initialWorld()` with one ground plane at `y = 0`
- [ ] `src/forces/gravity.js`: `gravity(ball, world) → Vector3`
- [ ] `src/physics/integrator.js`: `step(ball, world, dt)` applying gravity only
- [ ] `src/render/sync.js`: `sync(ball, mesh)` — copies position to mesh
- [ ] `src/main.js`: animation loop with fixed-timestep accumulator

**Acceptance:** ball spawns above ground, falls, sinks through it (no collision yet). Frame rate independent (try throttling).

---

### Phase 2 — Plane collision (no spin yet) `[ ]`

- [ ] `src/collisions/detect/plane.js`: returns `{ n, depth, contact }` per the formula
- [ ] `src/collisions/respond.js`: implement the full impulse-based response (with ω = 0 it reduces to standard reflection)
- [ ] Wire `integrator.js` to detect against world.obstacles each step and call respond
- [ ] Add restitution to the ball's params; default `e = 0.7`

**Acceptance:** dropped ball bounces, each peak is `e²` times the previous (≈ 49% of last). Visually confirm and verify with `console.log` of peak heights.

---

### Phase 3 — Drag, wind, buoyancy, viscous torque `[ ]`

- [ ] `src/forces/drag.js`: uses `v_rel = v − v_wind`
- [ ] `src/forces/buoyancy.js`: tiny constant upward force
- [ ] `src/forces/viscousTorque.js`: `−8πμR³ω`
- [ ] `src/physics/orientation.js`: quaternion update with `q.normalize()` every step
- [ ] Add ω to integrator: compute α = τ/I, update ω, update q
- [ ] Render: also `mesh.quaternion.copy(ball.q)`

**Acceptance:**
- Horizontal shot: trajectory shortens with drag vs without (toggle `Cd = 0` to compare).
- Spinning ball with no other forces: ω visibly decays over a few seconds; q stays unit length.
- Constant wind: stationary ball drifts in the wind direction.

---

### Phase 4 — Magnus + shooting `[ ]`

- [ ] `src/forces/magnus.js`: `F_M = ½ ρ C_L A R (ω × v)`
- [ ] `src/input/shoot.js`: click handler — compute `v₀` from camera direction + elevation angle + power; set ω based on UI (top-spin / back-spin / side-spin selector or sliders)
- [ ] Add a simple HTML overlay (just a few `<input type="range">` sliders) bound to ω.x, ω.y, ω.z

**Acceptance:**
- Shot with ω = 0: clean parabola.
- Top-spin (ω.x > 0): trajectory drops faster than no-spin.
- Side-spin (ω.y ≠ 0): trajectory curves left/right.
- Toggling each component visibly produces the expected curl direction.

---

### Phase 5 — Sphere and box obstacles `[ ]`

- [ ] `src/collisions/detect/sphere.js`
- [ ] `src/collisions/detect/box.js`
- [ ] `src/render/meshes.js`: add sphere and box obstacle meshes
- [ ] `src/state/world.js`: add a sphere and a box to default obstacles
- [ ] No new respond code needed — same `respond()` consumes any ContactInfo

**Acceptance:**
- Shot at a sphere off-center: ball bounces at an angle equal to twice the angle between v and the radial line at impact.
- Shot at a box face: bounces normally.
- Shot near a box edge: ball bounces in a direction between the two adjacent faces (smooth, not jittery).
- A topspin shot at a wall **bounces forward** along the wall; backspin **bounces back** — this validates the impulse-based spin coupling.

---

### Phase 6 — Rolling state `[ ]`

- [ ] `src/physics/stateMachine.js`: `maybeTransition(ball)` checking the post-bounce trigger condition
- [ ] In the integrator, branch on `ball.mode`:
  - `flying` → full force model
  - `rolling` → skip flight forces, apply rolling resistance, enforce no-slip
- [ ] After each plane collision, call `maybeTransition`

**Acceptance:**
- A shallow-angle shot eventually stops bouncing and rolls visibly (the ball spins as it moves).
- The roll decelerates and stops within a few seconds.
- Rolling ball doesn't tunnel through the ground or jitter at the transition.

---

### Phase 7 — Polish (optional) `[ ]`

- [ ] Trail line behind the ball (rolling buffer of last N positions)
- [ ] Aim indicator (line from ball in shot direction) before firing
- [ ] Reset key (`R`)
- [ ] Camera follow with smoothing (`lerp` toward ball each frame)
- [ ] Subtle squash on impact (transient mesh scale along `n̂`)

**Acceptance:** project feels good to use; no acceptance test, judgement call.

---

### Phase 8 — Pitch dimensions & markings `[x]`

- [x] Add `PITCH_LENGTH = 105` and `PITCH_WIDTH = 68` (m, FIFA standard) to `constants.js`
- [x] Resize the ground plane mesh in `render/meshes.js` to cover the pitch and tint it green
- [x] Add a halfway line (single white line geometry across the midfield)
- [x] Add a center circle (white ring geometry, radius `9.15` m — add `CENTER_CIRCLE_RADIUS` to `constants.js`)
- [x] Add `PITCH_PADDING` grass margin around the playing area
- [x] Add boundary lines (touchlines + goal lines) at the pitch edges
- [x] Add goal-area + penalty-area outlines, penalty spot, and penalty arc at each end
- [x] Intro camera animation easing from a wide aerial down to the play view

**Acceptance:** the ball falls onto a green 105×68 m pitch with halfway line, center circle, boundary lines, and goal/penalty markings. Lines are purely visual (no collision). On load, the camera eases from a wide aerial into the play view.

---

### Phase 9 — Stadium walls, stands, skybox `[x]`

- [x] Add `WALL_HEIGHT = 2` and `WALL_THICKNESS = 0.2` to `constants.js`
- [x] In `state/world.js`, add 4 box obstacles forming a closed perimeter around the pitch (these are the collision walls)
- [x] Add simple stand meshes around the outside of the walls (visual only — a few stepped boxes will do; no collision)
- [x] Set a sky-blue scene background (or a basic Three.js sky) in `render/scene.js`

**Acceptance:** the ball cannot leave the pitch and bounces cleanly off all four walls. Stands and sky are visible around/above the pitch.

---

### Phase 10 — Goals (posts + crossbar) `[x]`

- [x] Add `GOAL_WIDTH = 7.32`, `GOAL_HEIGHT = 2.44`, `POST_THICKNESS = 0.12` to `constants.js`
- [x] For each end of the pitch, add 2 posts + 1 crossbar as thin box obstacles in `state/world.js` (6 boxes total)
- [x] `createObstacleMesh` honors an optional `color` field so goal frames render white

**Acceptance:** the ball bounces off posts and crossbar and passes through the goal opening unobstructed. No back wall, no net.

---

### Phase 11 — Static players `[ ]`

- [ ] Add `PLAYER_HEIGHT = 1.8` and `PLAYER_WIDTH = 0.5` to `constants.js`
- [ ] Add a fixed set of player box obstacles at chosen positions in `state/world.js`
- [ ] Existing box rendering handles them — no new render code

**Acceptance:** players are visible on the pitch and the ball bounces off them. Static, no motion.

---

### Phase 12 — Shooter spawn `[ ]`

- [ ] Designate one player as the "shooter" (a distinct color is enough)
- [ ] Update `initialBall()` so the ball spawns on the ground next to the shooter, not high above the center
- [ ] The existing `R` reset key returns the ball to that spawn point

**Acceptance:** on load and after pressing `R`, the ball sits at the shooter's feet; click-and-drag aim + shoot still works.

---

## Working Style for Claude Code

- Implement one phase at a time. Do not touch files outside the phase's checklist.
- After each phase, run `npm run dev` and verify the acceptance criteria *before* checking the boxes.
- If a bug appears, fix it in the file that owns the concern — do not patch around it elsewhere.
- When unsure between two reasonable implementations, prefer the one with fewer lines and no new abstractions.
- If the user asks for a feature mid-phase, ask whether to defer until the current phase is complete.
- Commit at the end of each phase with message `phase N: <one-line summary>`.

## Out of Scope (do not add)

- TypeScript
- A unit test framework (the acceptance criteria are the tests)
- A scene editor / UI framework (React, etc.)
- Networking / multiplayer
- Sound, unless the user asks
- Triangle-mesh collision (only plane / sphere / AABB for v1)
- Variable `ω` during collision beyond what the impulse formula provides
