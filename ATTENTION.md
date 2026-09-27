# ATTENTION — chaos → sweep right → signal

Preview: http://localhost:5187/?attention

300 loose polished-silver pins overlap on a near-black surface. Eighteen logo pins occupy their final coordinates from frame one. Extra loose pins physically obscure the mark; clutter continues beyond all four edges.

At 1.4 seconds an invisible sweep reaches the left side. Its arrival propagates continuously across the frame over 220 ms. Each loose pin receives a strong rightward velocity, small lateral and angular variation, then frictional decay and restrained contact impulses. There are no destination coordinates, fades, scale changes, table oscillations or camera shake. All loose pins cross the right boundary. The logo responds by approximately 1–2 pixels and less than one degree, recovering without overshoot.

By 2.7 seconds the scene is still. A 1.8% camera push runs from 3.5 to 5.0 seconds. Tiny ATTENTION typography appears near the edge at 4.0 seconds, after the logo-only hold. The film ends at six seconds.

The existing safety-pin geometry is preserved. Lighting uses a dominant rectangular reflection source and restrained fill, with low-roughness metallic PBR, dark reflections and contact shadows.

## Development

`npm run dev -- --port 5187` starts the preview. R replays; Space pauses. Controls remain hidden by default; H exposes the development transport outside the film. T toggles final typography.

`?attention&t=0` pauses at the opening. `?attention&t=2.7` shows the isolated logo. Add `&capture` for a native 1920 × 1080 WebGL export link; exports exclude DOM typography.

`src/attentionMark.ts` contains replaceable logo strokes. `src/attentionPhysics.ts` computes deterministic 120 Hz trajectories using a velocity impulse and approximate layered-wire contacts. `src/AttentionScene.ts` renders the scene with instanced geometry.

`npm run check:physics` checks stillness before each pin's sweep arrival, spatial propagation, monotonic rightward travel, complete right-edge clearance, restrained logo recovery, deterministic replay and the final hold. `npm run build` validates TypeScript and the production bundle.

Current captures: `artifacts/attention-black-opening.png`, `artifacts/attention-black-reveal.png`.
