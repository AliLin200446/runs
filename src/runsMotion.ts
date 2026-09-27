/** Shared normalized state: every photographic plane survives every transition. */
export type Motion = {
  expand: number;
  field: number;
  angle: number;
  compare: number;
  reveal: number;
};
export const runs = [
  {
    id: "R01",
    seed: 2938,
    framing: 0.08,
    scale: 0.04,
    centroid: 0.06,
    dx: -0.8,
    dy: 0.4,
    zoom: 1.012,
    exposure: 1.01,
  },
  {
    id: "R02",
    seed: 2939,
    framing: 0.13,
    scale: 0.09,
    centroid: 0.11,
    dx: 1.3,
    dy: -0.7,
    zoom: 1.026,
    exposure: 0.97,
  },
  {
    id: "R03",
    seed: 2940,
    framing: 0.03,
    scale: 0.02,
    centroid: 0.04,
    dx: -0.3,
    dy: 0.2,
    zoom: 1.006,
    exposure: 1,
  },
  {
    id: "R04",
    seed: 2941,
    framing: 0.31,
    scale: 0.22,
    centroid: 0.27,
    dx: 3.2,
    dy: -3,
    zoom: 1.058,
    exposure: 1.045,
  },
  {
    id: "R05",
    seed: 2942,
    framing: 0.19,
    scale: 0.14,
    centroid: 0.17,
    dx: -1.9,
    dy: 1.4,
    zoom: 1.039,
    exposure: 0.98,
  },
];
export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.max(lo, Math.min(hi, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
export const deviation = (i: number) => {
  const r = runs[i];
  return (r.framing + r.scale + r.centroid) / 3;
};
export const runAngle = (i: number) => (i - 2) * 0.59;
export const frontRun = (angle: number) =>
  runs.reduce(
    (best, _, i) =>
      Math.abs(runAngle(i) + angle) < Math.abs(runAngle(best) + angle)
        ? i
        : best,
    0,
  );
export const initialMotion = (): Motion => ({
  expand: 0,
  field: 0,
  angle: 0,
  compare: 0,
  reveal: 0,
});
export function sample(t: number): Motion {
  return {
    expand: smooth((t - 1) / 0.65),
    field: smooth((t - 3.2) / 1.6),
    angle: mix(0.5, -runAngle(3), smooth((t - 4.6) / 1.4)),
    compare: smooth(t - 6),
    reveal: smooth((t - 8) / 0.7),
  };
}
export const inspectionAnchor = (angle: number) =>
  mix(55, 240, smooth((clamp(2 - angle / 0.59, 0, 4) - 2) / 2));
/** Cubic-bezier(.65, 0, .20, 1), with deterministic inversion. */
export function scanEase(t: number) {
  const x = clamp(t);
  if (x === 0 || x === 1) return x;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 16; i++) {
    const u = (lo + hi) / 2;
    const bx =
      3 * (1 - u) * (1 - u) * u * 0.65 + 3 * (1 - u) * u * u * 0.2 + u * u * u;
    if (bx < x) lo = u;
    else hi = u;
  }
  return smooth((lo + hi) / 2);
}
export function pose(i: number, s: Motion, selected: number, flat = false) {
  const d = deviation(i),
    e = s.expand,
    f = s.field,
    c = s.compare;
  const fanIndex = i - 2;
  const fanX = fanIndex * 102 + runs[i].dx * 2;
  const fanY = Math.abs(fanIndex) * 12 + runs[i].dy * 3;
  const a = runAngle(i) + s.angle;
  // A scan coordinate, not an orbit. The aperture crops a full-size image;
  // it never compresses a face to simulate an edge-on photograph.
  const distances = runs.map((_, j) =>
    Math.abs((runAngle(j) + s.angle) / 0.59),
  );
  const apertureFor = (index: number) => {
    const distance = distances[index];
    // Both apertures move from the first drag pixel. The midpoint is two
    // 20px crops, never two squashed portraits.
    const line = mix(2, 1.5, smooth(distance - 1)) / 1.392;
    if (distance <= 0.5) return mix(270, 20, smooth(distance / 0.5));
    return mix(20, line, smooth((distance - 0.5) / 0.5));
  };
  const apertures = runs.map((_, index) => apertureFor(index));
  const weights = apertures.map((width) => smooth((width - 20) / 250));
  const centers = [0];
  for (let j = 1; j < runs.length; j++)
    centers[j] =
      centers[j - 1] +
      ((apertures[j - 1] + apertures[j]) * 1.392) / 2 +
      100 +
      (deviation(j) + deviation(j - 1)) * 12;
  const scan = clamp(2 - s.angle / 0.59, 0, 4);
  const left = Math.floor(scan),
    right = Math.min(4, left + 1);
  const origin = mix(centers[left], centers[right], smooth(scan - left));
  const fieldX = centers[i] - origin + inspectionAnchor(s.angle);
  const weight = weights[i];
  let x = mix(fanX, fieldX, f) * e;
  let y = fanY * (1 - f) * e;
  let z = mix(-i * 0.6, -Math.abs(fanIndex) * 13 * (1 - f), e);
  let rz = (fanIndex * 6.2 + runs[i].dx * 0.5) * (1 - f) * e;
  let ry = 0;
  const optical = f * (1 - c);
  const aperture = mix(270, apertures[i], optical);
  const cropShift = (1 - smooth((apertures[i] - 20) / 180)) * 105 * optical;
  // The photograph never scales down during compression. Only the slit's
  // final vertical crop shortens, to 82–86% height, according to deviation.
  const planeScale = mix(1, 1.392, optical);
  const closed = smooth((20 - apertures[i]) / 18);
  const visibleHeight = mix(
    364,
    364 * (1 - (0.18 - d * 0.15) * closed),
    optical,
  );
  const lineOpacity = mix(0.55, 0.35, smooth(distances[i] - 1));
  const active = i === selected;
  x = mix(x, active ? runs[i].dx * 2.5 : x * 0.7, c);
  y = mix(y, active ? runs[i].dy * 1.5 : y * 0.7, c);
  z = mix(z, active ? 18 : -450 - d * 350, c);
  ry = mix(ry, active ? 0 : Math.sign(a || 1) * 86, c);
  rz = mix(rz, active ? 0.45 : 0, c);
  return {
    x,
    y,
    z: flat ? 0 : z,
    rz,
    ry: flat ? 0 : ry,
    opacity: mix(
      mix(1, mix(lineOpacity, 1, 1 - closed), optical),
      active ? 0.64 : 0.13,
      c,
    ),
    aperture,
    cropShift,
    planeScale,
    visibleHeight,
    weight,
  };
}
