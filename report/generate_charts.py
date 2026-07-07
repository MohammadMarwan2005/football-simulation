#!/usr/bin/env python3
"""Generate the report figures from the scenario CSVs in report/data/.

Run `node report/run_scenarios.mjs` first, then:

    python3 report/generate_charts.py

PNGs are written to report/figures/, and a summary of measured-vs-theory
numbers is written to report/data/summary.json (consumed by build_report.py).
"""

import csv
import json
import math
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle

HERE = Path(__file__).parent
DATA = HERE / "data"
FIGS = HERE / "figures"
FIGS.mkdir(exist_ok=True)

# Physical parameters (mirror src/constants.js)
G = 9.81
M = 0.43
R = 0.11
E = 0.7
MU_R = 0.05
MU_AIR = 1.85e-5
I = 2 / 5 * M * R * R

plt.rcParams.update({
    "figure.dpi": 150,
    "font.size": 9,
    "axes.grid": True,
    "grid.alpha": 0.3,
    "lines.linewidth": 1.4,
})

summary = {}


def load(run_id):
    rows = []
    with open(DATA / f"{run_id}.csv") as f:
        for row in csv.DictReader(f):
            rows.append({k: (v if k == "mode" else float(v)) for k, v in row.items()})
    return rows


def col(rows, key):
    return [r[key] for r in rows]


def bounce_peaks(rows):
    """Local maxima of y above the resting height."""
    peaks = []
    for i in range(1, len(rows) - 1):
        y0, y1, y2 = rows[i - 1]["y"], rows[i]["y"], rows[i + 1]["y"]
        if y1 >= y0 and y1 > y2 and y1 > R + 0.02:
            peaks.append((rows[i]["t"], y1))
    return peaks


def save(fig, name):
    fig.savefig(FIGS / name, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote figures/{name}")


# ---------------------------------------------------------------- S1 + S9: bounce decay
s1 = load("s1")
s1i = load("s1_ideal")

fig, ax = plt.subplots(figsize=(8, 4))
ax.plot(col(s1, "t"), col(s1, "y"), label="simulation (with air)")
ax.plot(col(s1i, "t"), col(s1i, "y"), "--", label="simulation (no air)", alpha=0.8)
peaks_i = bounce_peaks(s1i)
h0 = 5.0
theo = [h0 * E ** (2 * (n + 1)) for n in range(len(peaks_i))]
ax.plot([t for t, _ in peaks_i], theo, "kx", markersize=7, label=r"theory  $h_n = h_0\,e^{2n}$")
ax.set_xlabel("t (s)")
ax.set_ylabel("y (m)")
ax.set_title("Scenario 1 — Free fall from 5 m: bounce height decay")
ax.legend()
save(fig, "s1_bounce.png")

ratios = [peaks_i[i + 1][1] / peaks_i[i][1] for i in range(min(3, len(peaks_i) - 1))]
summary["s1"] = {
    "first_peak_ideal": peaks_i[0][1],
    "first_peak_theory": h0 * E * E,
    "peak_ratios_ideal": ratios,
    "e_squared": E * E,
    "peaks_with_air": [y for _, y in bounce_peaks(s1)][:4],
}

# S1 energy
fig, ax = plt.subplots(figsize=(8, 4))
ax.plot(col(s1, "t"), col(s1, "pe"), label="potential  $mgy$")
ax.plot(col(s1, "t"), col(s1, "ke_trans"), label=r"kinetic  $\frac{1}{2}m|v|^2$")
ax.plot(col(s1, "t"), col(s1, "e_total"), "k", label="total")
ax.set_xlabel("t (s)")
ax.set_ylabel("E (J)")
ax.set_title("Scenario 1 — Energy: loss concentrated at impacts")
ax.legend()
save(fig, "s1_energy.png")

# S9 restitution sweep
fig, ax = plt.subplots(figsize=(8, 4))
for run_id, e_val, color in (("s9a", 0.4, "tab:red"), ("s9b", 0.7, "tab:blue"), ("s9c", 0.9, "tab:green")):
    rows = load(run_id)
    ax.plot(col(rows, "t"), col(rows, "y"), color=color, label=f"e = {e_val}")
ax.set_xlabel("t (s)")
ax.set_ylabel("y (m)")
ax.set_title("Scenario 9 — Restitution sweep: bounce lifetime vs e")
ax.legend()
save(fig, "s9_restitution.png")

summary["s9"] = {}
for run_id, e_val in (("s9a", 0.4), ("s9b", 0.7), ("s9c", 0.9)):
    peaks = bounce_peaks(load(run_id))
    summary["s9"][run_id] = {
        "e": e_val,
        "first_peak": peaks[0][1] if peaks else None,
        "first_peak_theory_no_air": 5.0 * e_val ** 2,
        "n_bounces_recorded": len(peaks),
    }

# ---------------------------------------------------------------- S2: 45° launch
s2 = load("s2")
s2i = load("s2_ideal")

# analytic no-air parabola for the first arc
v0, theta = 15.0, math.radians(45)
xs = [x * 0.1 for x in range(0, 240)]
ys = [R + x * math.tan(theta) - G * x * x / (2 * v0 * v0 * math.cos(theta) ** 2) for x in xs]
xs, ys = zip(*[(x, y) for x, y in zip(xs, ys) if y >= 0])

first_arc = [r for r in s2 if r["t"] < 2.5]
first_arc_i = [r for r in s2i if r["t"] < 2.5]

fig, ax = plt.subplots(figsize=(8, 4))
ax.plot(col(first_arc, "x"), col(first_arc, "y"), label="simulation (with drag)")
ax.plot(col(first_arc_i, "x"), col(first_arc_i, "y"), "--", label="simulation (no air)")
ax.plot(xs, ys, "k:", label="analytic parabola (no air)")
ax.set_xlabel("x (m)")
ax.set_ylabel("y (m)")
ax.set_title("Scenario 2 — 45° launch at 15 m/s: drag shortens the range")
ax.set_aspect("equal", adjustable="box")
ax.legend()
save(fig, "s2_trajectory.png")

def first_landing_x(rows):
    for i in range(1, len(rows)):
        if rows[i]["y"] <= R + 1e-4 and rows[i - 1]["y"] > R + 1e-4:
            return rows[i]["x"]
    return None

range_analytic = v0 * v0 * math.sin(2 * theta) / G
summary["s2"] = {
    "range_with_drag": first_landing_x(s2),
    "range_no_air_sim": first_landing_x(s2i),
    "range_analytic": range_analytic,
}

# ---------------------------------------------------------------- S3/S4: Magnus
s3, s3n = load("s3"), load("s3_nospin")
fig, ax = plt.subplots(figsize=(8, 4))
arc = [r for r in s3 if r["t"] < 2.5]
arc_n = [r for r in s3n if r["t"] < 2.5]
ax.plot(col(arc, "z"), col(arc, "y"), label=r"top-spin  $\omega_x = +10$ rad/s")
ax.plot(col(arc_n, "z"), col(arc_n, "y"), "--", label="no spin")
ax.set_xlabel("z (m)")
ax.set_ylabel("y (m)")
ax.set_title("Scenario 3 — Top-spin: Magnus force pushes the ball down")
ax.legend()
save(fig, "s3_topspin.png")

s4, s4n = load("s4"), load("s4_nospin")
fig, ax = plt.subplots(figsize=(8, 4))
arc = [r for r in s4 if r["t"] < 2.5]
arc_n = [r for r in s4n if r["t"] < 2.5]
ax.plot(col(arc, "z"), col(arc, "x"), label=r"side-spin  $\omega_y = +10$ rad/s")
ax.plot(col(arc_n, "z"), col(arc_n, "x"), "--", label="no spin")
ax.set_xlabel("z (m)")
ax.set_ylabel("x (m)")
ax.set_title("Scenario 4 — Side-spin: lateral curve (top view)")
ax.legend()
save(fig, "s4_sidespin.png")

def landing_offset(rows):
    for i in range(1, len(rows)):
        if rows[i]["y"] <= R + 1e-4 and rows[i - 1]["y"] > R + 1e-4:
            return rows[i]["x"], rows[i]["z"]
    return None, None

x_spin, z_spin = landing_offset(s4)
x_nospin, z_nospin = landing_offset(s4n)
summary["s4"] = {"lateral_deflection_at_landing": x_spin - (x_nospin or 0), "z_landing": z_spin}

apex3 = max(col(s3, "y"))
apex3n = max(col(s3n, "y"))
_, z3 = landing_offset(s3)
_, z3n = landing_offset(s3n)
summary["s3"] = {"apex_spin": apex3, "apex_nospin": apex3n, "range_spin": z3, "range_nospin": z3n}

# ω decay in flight (viscous torque is real but tiny — honest chart)
fig, ax = plt.subplots(figsize=(8, 4))
w3 = [math.sqrt(r["wx"] ** 2 + r["wy"] ** 2 + r["wz"] ** 2) for r in s3]
ax.plot(col(s3, "t"), w3, label=r"$|\omega|(t)$ — top-spin run")
tau_visc = I / (8 * math.pi * MU_AIR * R ** 3)
ax.set_xlabel("t (s)")
ax.set_ylabel(r"$|\omega|$ (rad/s)")
ax.set_title(
    f"Angular speed: viscous decay is negligible in flight (τ ≈ {tau_visc:,.0f} s) —\n"
    "the jumps come from friction impulses at bounces"
)
ax.legend()
save(fig, "s3_omega.png")
summary["viscous_tau_seconds"] = tau_visc

# ---------------------------------------------------------------- S5: sphere obstacle
s5 = load("s5")
fig, axes = plt.subplots(1, 2, figsize=(9.5, 4))
arc = [r for r in s5 if r["t"] < 2.0]
axes[0].plot(col(arc, "z"), col(arc, "y"))
axes[0].add_patch(Circle((7, 0.8), 0.8, fill=False, color="tab:red", lw=1.5))
axes[0].set_xlabel("z (m)")
axes[0].set_ylabel("y (m)")
axes[0].set_title("side view (z–y)")
axes[1].plot(col(arc, "z"), col(arc, "x"))
axes[1].add_patch(Circle((7, 0), 0.8, fill=False, color="tab:red", lw=1.5))
axes[1].set_xlabel("z (m)")
axes[1].set_ylabel("x (m)")
axes[1].set_title("top view (z–x)")
for a in axes:
    a.set_aspect("equal", adjustable="box")
fig.suptitle("Scenario 5 — Off-center hit on a sphere obstacle: radial-normal deflection")
save(fig, "s5_sphere.png")

# ---------------------------------------------------------------- S6: box face/edge/corner
fig, ax = plt.subplots(figsize=(8, 4.5))
for run_id, label, color in (
    ("s6a", "face hit", "tab:blue"),
    ("s6b", "edge hit", "tab:orange"),
    ("s6c", "corner hit", "tab:green"),
):
    rows = [r for r in load(run_id) if r["t"] < 2.2]
    ax.plot(col(rows, "z"), col(rows, "y"), color=color, label=label)
ax.add_patch(Rectangle((8, 0), 2, 2, fill=True, alpha=0.15, color="k", lw=1.5, ec="k"))
ax.set_xlabel("z (m)")
ax.set_ylabel("y (m)")
ax.set_title("Scenario 6 — AABB box: one clamp formula handles face, edge and corner")
ax.set_aspect("equal", adjustable="box")
ax.legend()
save(fig, "s6_box.png")

# ---------------------------------------------------------------- S7: top-spin on the wall
s7, s7n = load("s7"), load("s7_nospin")

def wall_impact_dv(rows):
    """v_y just before/after the step where v_z flips sign (wall bounce)."""
    for i in range(1, len(rows)):
        if rows[i - 1]["vz"] > 0 and rows[i]["vz"] < 0:
            return rows[i - 1]["vy"], rows[i]["vy"]
    return None, None

vy_b, vy_a = wall_impact_dv(s7)
vy_bn, vy_an = wall_impact_dv(s7n)
summary["s7"] = {
    "vy_before_spin": vy_b, "vy_after_spin": vy_a, "dvy_spin": vy_a - vy_b,
    "vy_before_nospin": vy_bn, "vy_after_nospin": vy_an, "dvy_nospin": vy_an - vy_bn,
}

fig, axes = plt.subplots(1, 2, figsize=(9.5, 4))
for rows, label, color in ((s7, r"top-spin $\omega_x=+20$", "tab:blue"), (s7n, "no spin", "tab:gray")):
    seg = [r for r in rows if r["t"] < 2.2]
    axes[0].plot(col(seg, "z"), col(seg, "y"), color=color, label=label)
    axes[1].plot(col(seg, "t"), col(seg, "vy"), color=color, label=label)
axes[0].axvline(39, color="k", lw=2)
axes[0].annotate("wall", (39, 1.6), xytext=(37.4, 1.7))
axes[0].set_xlabel("z (m)")
axes[0].set_ylabel("y (m)")
axes[0].set_title("trajectory near the wall")
axes[1].set_xlabel("t (s)")
axes[1].set_ylabel(r"$v_y$ (m/s)")
axes[1].set_title(r"$v_y(t)$: friction impulse kicks the spinning ball up")
axes[1].legend()
fig.suptitle(r"Scenario 7 — Top-spin wall bounce: velocity shift along $\omega \times \hat{n}$")
save(fig, "s7_wall.png")

# ---------------------------------------------------------------- S8: rolling
s8 = load("s8")
t_roll = next(r["t"] for r in s8 if r["mode"] == "rolling")
speed = [math.sqrt(r["vx"] ** 2 + r["vz"] ** 2) for r in s8]

fig, ax = plt.subplots(figsize=(8, 4))
ax.plot(col(s8, "t"), speed, label="simulation |v_t|(t)")
roll0 = next(r for r in s8 if r["mode"] == "rolling")
v_roll0 = math.sqrt(roll0["vx"] ** 2 + roll0["vz"] ** 2)
ts = [roll0["t"] + i * 0.1 for i in range(int((v_roll0 / (MU_R * G)) * 10) + 1)]
ax.plot(ts, [max(0, v_roll0 - MU_R * G * (t - roll0["t"])) for t in ts], "k--",
        label=rf"theory: slope $-\mu_r g = -{MU_R * G:.3f}$ m/s²")
ax.axvline(t_roll, color="tab:red", lw=1, ls=":")
ax.annotate("FLYING → ROLLING", (t_roll, max(speed) * 0.75), xytext=(t_roll + 0.4, max(speed) * 0.8),
            color="tab:red")
ax.set_xlabel("t (s)")
ax.set_ylabel(r"$|v_t|$ (m/s)")
ax.set_title("Scenario 8 — Shallow launch: transition to rolling, then linear deceleration")
ax.legend()
save(fig, "s8_rolling.png")

# measured deceleration slope during rolling
roll_rows = [r for r in s8 if r["mode"] == "rolling"]
if len(roll_rows) > 20:
    v_start = math.sqrt(roll_rows[0]["vx"] ** 2 + roll_rows[0]["vz"] ** 2)
    idx = min(len(roll_rows) - 1, len(roll_rows) // 2)
    v_mid = math.sqrt(roll_rows[idx]["vx"] ** 2 + roll_rows[idx]["vz"] ** 2)
    slope = (v_mid - v_start) / (roll_rows[idx]["t"] - roll_rows[0]["t"])
    summary["s8"] = {
        "t_rolling_start": t_roll,
        "measured_decel": -slope,
        "theory_decel": MU_R * G,
        "stop_position_x": s8[-1]["x"],
    }

with open(DATA / "summary.json", "w") as f:
    json.dump(summary, f, indent=2)
print("wrote data/summary.json")
print(json.dumps(summary, indent=2))
