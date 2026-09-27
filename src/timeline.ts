export const DURATION = 12;
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
export const ramp = (t: number, start: number, end: number) => ease((t - start) / (end - start));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function stateAt(t: number) {
  const enter = ramp(t, 1.4, 2.35);
  const focus = ramp(t, 3.2, 3.85);
  const lens = ramp(t, 4.05, 5.85);
  const observed = ramp(t, 6.95, 8.4);
  const reset = ramp(t, 10.5, 10.85);
  return {enter, focus, lens, observed, reset, drift: observed * (1-reset), focal: lerp(50,35,lens), outro:ramp(t,10.5,11.2)};
}
