import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const js = ts.transpileModule(
  fs.readFileSync(new URL("../src/runsMotion.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { sample, pose, runs, initialMotion, frontRun, runAngle, scanEase } =
  await import(
    `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
  );
for (let t = 0; t <= 9; t += 1 / 120) {
  const s = sample(t);
  for (let i = 0; i < runs.length; i++) {
    const p = pose(i, s, 3);
    assert.ok(Object.values(p).every(Number.isFinite), `Finite pose at ${t}`);
    assert.ok(p.opacity >= 0 && p.opacity <= 1);
    const next = pose(i, sample(t + 1e-5), 3);
    assert.ok(
      Math.abs(next.x - p.x) < 0.1 && Math.abs(next.z - p.z) < 0.1,
      "No spatial discontinuity",
    );
  }
}
for (let i = 0; i < 5; i++) {
  assert.equal(frontRun(-runAngle(i)), i, "Every run is inspectable");
  const p = pose(i, initialMotion(), 3);
  assert.ok(p.x === 0 && p.y === 0 && p.ry === 0);
  assert.ok(p.z <= 0, "All runs emerge behind R01");
}
const aligned = (i) =>
  pose(
    i,
    { expand: 1, field: 1, angle: -runAngle(i), compare: 0, reveal: 0 },
    i,
  );
assert.equal(aligned(3).z, 0, "All field planes share one depth");
assert.equal(aligned(3).ry, 0, "Inspected plane faces camera");
const distant = pose(0, { ...sample(6), angle: -runAngle(3) }, 3);
assert.ok(
  Math.abs(distant.aperture * distant.planeScale - 1.5) < 1e-9,
  "Distant photographic slits have 1.5 px projected width",
);
assert.equal(frontRun(sample(6).angle), 3, "Autoplay stops on R04");
assert.deepEqual(sample(9), sample(9), "Replay is deterministic");
assert.equal(sample(9).compare, 1);
assert.equal(sample(9).reveal, 1);
console.log(
  "RUNS: all five runs inspectable; continuous finite poses; parallel photographic slits; R04 comparison and deterministic sampling pass.",
);

// Sweep arbitrary drag positions, including each exact handover.
for (let angle = -1.18; angle <= 1.18; angle += 0.001) {
  const active = frontRun(angle),
    state = { expand: 1, field: 1, angle, compare: 0, reveal: 0 };
  const planes = runs.map((_, i) => pose(i, state, active));
  assert.ok(
    planes.filter((p) => p.aperture > 20.001).length <= 1,
    "Never two readable photographic apertures",
  );
  planes.forEach((p, i) => {
    assert.ok(p.y === 0, "Shared vertical center");
    assert.equal(p.rz, 0, "Shared baseline");
    assert.ok(p.ry === 0, "No perspective-compressed faces");
    assert.ok(p.z === 0, "No field depth");
    assert.ok(
      p.opacity >= 0.35 - 1e-9 && p.opacity <= 1,
      "Slices remain quiet while the active image stays opaque",
    );
    if (i !== active)
      assert.ok(p.cropShift > 104, "Nonactive crops exclude face");
    if (i > 0) {
      const previous = planes[i - 1];
      assert.ok(
        p.x -
          previous.x -
          (p.aperture * p.planeScale +
            previous.aperture * previous.planeScale) /
            2 >
          20,
        "Generous nonintersecting spacing",
      );
    }
  });
}
for (let i = 0; i < 5; i++) {
  const p = aligned(i);
  assert.equal(p.aperture, 270, "Aligned run has full photographic width");
  assert.equal(p.cropShift, 0, "Aligned run preserves original crop");
  assert.ok(
    Math.abs((p.planeScale * 1500) / (1500 - p.z) - 1.392) < 1e-9,
    "Aligned image is enlarged 20 percent above the previous field size",
  );
}
console.log(
  "FIELD: arbitrary-angle aperture exclusivity, zero depth, shared vertical centers, full-size aligned images and nonintersection pass.",
);

const midpoint = { expand: 1, field: 1, angle: -0.295, compare: 0, reveal: 0 };
for (const i of [2, 3]) {
  const p = pose(i, midpoint, 2);
  assert.equal(p.aperture, 20, "Handover contains two abstract slices");
  assert.equal(p.visibleHeight, 364, "Compression retains photographic height");
  assert.equal(p.planeScale, 1.392, "Photograph is never squashed");
}
const resting = runs
  .map((_, i) => pose(i, { ...midpoint, angle: 0 }, 2))
  .filter((_, i) => i !== 2);
const heights = resting.map((p) => p.visibleHeight / 364);
assert.ok(heights.every((h) => h >= 0.7 && h <= 0.9));
assert.ok(Math.max(...heights) - Math.min(...heights) <= 0.08);
for (let t = 0; t < 1; t += 0.001) {
  assert.ok(
    scanEase(t) <= scanEase(t + 0.001),
    "Settle easing never overshoots",
  );
}
console.log(
  "SCAN: abstract midpoint, constant image scale, quiet slit height variation and monotonic easing pass.",
);
