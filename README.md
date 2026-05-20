# Football Motion Simulation

A 3D soccer ball physics simulation built with Three.js for a university physics course.

**Live demo:** https://football-sim.duckdns.org/

## What it simulates

The ball is subject to real physical forces on every frame:

- **Gravity** and **buoyancy**
- **Aerodynamic drag** (relative to a configurable wind vector)
- **Magnus effect** — topspin drops the ball faster, backspin lifts it, sidespin curves it left/right
- **Viscous torque** — angular velocity decays naturally in air
- **Impulse-based collision response** — handles planes, spheres, and axis-aligned boxes with proper spin–translation coupling at impact
- **Rolling state** — ball transitions from flight to rolling when bounce energy dies down, then decelerates via rolling friction

The scene is a FIFA-standard 105 × 68 m pitch with markings, goals, stands, and a 4-4-2 formation of 22 humanoid players (11 v 11) that the ball can bounce off.

## Controls

| Key / Action | Effect |
|---|---|
| Click or Space | Shoot the ball |
| Arrow keys | Orbit camera |
| WASD | Pan camera |
| Q / E | Zoom in / out |
| R | Reset ball to shooter's feet |

## Tech stack

- [Three.js](https://threejs.org/) — 3D rendering
- [Vite](https://vitejs.dev/) — dev server and bundler
- Vanilla JavaScript, ES modules — no framework, no external physics engine

All physics (forces, integrator, collision detection, rolling) is implemented from first principles to match the course derivations.

## Run locally

```bash
npm install
npm run dev
```

## Physics notes

Uses a semi-implicit Euler integrator at a fixed 1/60 s timestep with a real-time accumulator, so behavior is frame-rate independent. The collision response is a single shape-agnostic impulse function — the same code handles the ground, goal posts, and players.
