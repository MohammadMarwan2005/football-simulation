// Physical constants and default ball/world parameters.
// Sources: standard FIFA size 5 ball; sea-level air at 15 °C.

export const G = 9.81;              // m/s^2
export const RHO_AIR = 1.225;       // kg/m^3
export const MU_AIR = 1.85e-5;      // Pa·s

export const BALL_MASS = 0.43;      // kg
export const BALL_RADIUS = 0.11;    // m
export const CD = 0.25;             // drag coefficient
export const CL = 0.20;             // Magnus / lift coefficient
export const RESTITUTION = 0.7;
export const MU_SLIDING = 0.4;      // Coulomb friction at contact
export const MU_ROLLING = 0.05;

export const DT = 1 / 60;           // s, fixed physics timestep
export const MAX_FRAME_DT = 0.25;   // s, clamp on real-time elapsed to avoid spiral-of-death after a tab pause

export const BALL_SPAWN_HEIGHT = 5; // m, default initial r.y

// Rolling-mode trigger: |v·n| / |v_t| below this ⇒ ball is rolling.
export const ROLLING_RATIO = 0.17;

// Solid uniform sphere — moment of inertia I = INERTIA_FACTOR · m · R².
export const INERTIA_FACTOR = 2 / 5;
// Tangential stick impulse magnitude needed to zero v_ct on a solid sphere:
//   J_stick = TANGENTIAL_STICK_FACTOR · m · |v_ct|
// The 2/7 = 1/(1 + m·R²/I) coupling factor accounts for the linked
// translation/rotation update of a uniform sphere at a contact point.
export const TANGENTIAL_STICK_FACTOR = 2 / 7;
