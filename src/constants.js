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
export const MU_ROLLING = 0.4;      // rolling resistance (linear decel = μ_r · g)

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

// Sphere volume:  V = SPHERE_VOLUME_COEF · π · R³  (= (4/3) π R³)
export const SPHERE_VOLUME_COEF = 4 / 3;
// Viscous torque on a sphere in still air:  τ_visc = −VISCOUS_TORQUE_COEF · π · μ_air · R³ · ω
export const VISCOUS_TORQUE_COEF = 8;

export const DEG_TO_RAD = Math.PI / 180;

// Phase 7 (polish)
export const TRAIL_MAX_POINTS = 240;       // ~4 s of trail at 60 fps
export const AIM_LENGTH = 3;               // m, aim indicator length from ball
export const CAMERA_FOLLOW_LERP = 0.08;    // per-frame interp factor toward ball
export const SQUASH_DURATION_MS = 120;     // ms, full squash envelope
export const SQUASH_AMOUNT = 0.2;          // max uniform scale reduction at envelope peak
export const SQUASH_SAT_VELOCITY = 5;      // m/s of impulse Δv at which the squash saturates

// Phase 8 (pitch geometry)
export const PITCH_LENGTH = 105;           // m, FIFA standard (along x)
export const PITCH_WIDTH = 68;             // m, FIFA standard (along z)
export const PITCH_PADDING = 5;            // m, run-off grass margin outside the playing area
export const LINE_WIDTH = 0.12;            // m, painted line width
export const CENTER_CIRCLE_RADIUS = 9.15;  // m, FIFA standard

// Phase 8 (pitch markings — goal / penalty areas)
export const GOAL_AREA_DEPTH = 5.5;        // m, perpendicular to goal line
export const GOAL_AREA_WIDTH = 18.32;      // m, parallel to goal line
export const PENALTY_AREA_DEPTH = 16.5;
export const PENALTY_AREA_WIDTH = 40.32;
export const PENALTY_SPOT_DISTANCE = 11;   // m, from goal line
export const PENALTY_SPOT_RADIUS = 0.11;   // m, painted spot radius
export const PENALTY_ARC_RADIUS = 9.15;    // m, around the penalty spot (= "9.15 m" rule)

// Phase 8 (intro camera animation)
export const INTRO_CAM_START = [-13.07, 64.88, 87.01];  // wide aerial
export const INTRO_CAM_END   = [5.67,   5.50, 14.59];   // play view
export const INTRO_DURATION_MS = 3000;

// Phase 9 (stadium walls + stands)
export const WALL_HEIGHT = 2;              // m
export const WALL_THICKNESS = 0.2;         // m
export const STAND_TIER_COUNT = 3;
export const STAND_TIER_DEPTH = 5;         // m, depth of each tier
export const STAND_TIER_RISE = 3;          // m, height step per tier

// Phase 10 (goal frame)
export const GOAL_WIDTH = 7.32;            // m, FIFA standard (along z)
export const GOAL_HEIGHT = 2.44;           // m, FIFA standard (crossbar bottom)
export const POST_THICKNESS = 0.12;        // m, FIFA limit (square cross-section)

// Phase 11 (static players)
export const PLAYER_HEIGHT = 1.8;          // m
export const PLAYER_WIDTH = 0.5;           // m, square footprint
