# RUNS

A standalone motion study for generative consistency. One photographic control becomes five related runs, opens into a drift-based spatial field, and returns to an expected/observed comparison.

## Run

```sh
npm install
npm run dev -- --port 5188
```

Open http://localhost:5188. `npm run build` type-checks the project and builds `dist/`. `npm run check:runs` verifies motion continuity, finite transforms, inspection reachability, parallel line geometry and abstract slice handovers, and the R04 autoplay destination.

## Interaction

- Use the bottom-right ▶ button to play the nine-second motion sequence. During playback it becomes a pause button; after completion it replays the sequence.

- Hover the portrait to separate five runs from one stack.
- Drag horizontally from a print to enter the field and inspect runs. Drag right to advance, left to reverse. Release to settle on the nearest inspection axis.
- Click the facing run to overlay it on EXPECTED. Evaluation metadata follows after the image settles. After five seconds, the planes retract through FIELD → RUNS → SINGLE.
- Escape or click the composition background to return one level.
- Left/right arrow keys inspect adjacent runs. Tab and Enter provide keyboard comparison.
- PLAY MOTION starts the deterministic nine-second sequence; PAUSE freezes it and PLAY MOTION resumes. Autoplay holds on the final R04 evaluation as specified. REPLAY / R restarts it.
- Space toggles playback. D toggles debug mode (off by default). T hides/restores all composition text.

The development controls are absent from the normal experience. Press D to mount PLAY, REPLAY, timeline, TEXT, and DEPTH outside the 16:9 recording composition; press D again to remove them. TEXT OFF and DEPTH OFF support the brief's quality checks. The DEPTH toggle removes Z position and Y rotation while retaining the photographic drift for comparison. Reduced-motion preferences make manual transitions immediate; autoplay remains opt-in.

## Reproducible stills

Use `?t=0` for SINGLE, `?t=2.6` for RUNS, `?t=5.95` for FIELD, and `?t=8.8` for COMPARE. Development controls are hidden by default. Add `&textless` to remove labels or `&flat` to disable depth. Seeking pauses the sequence at the exact shared-state sample.

## Architecture

`src/runsMotion.ts` contains five fixed drift records and pure pose/timeline functions. Shared normalized expansion, field, inspection angle, comparison, and metadata values drive the same five persistent image planes. CSS 3D provides perspective and GPU-composited transforms; React owns the interface while requestAnimationFrame updates plane transforms without rerendering the scene each frame.

Deviation is the mean of framing, scale, and centroid drift. FIELD presents parallel photographic slits: inactive runs are real masked image pixels, with 1.5–2 px projected widths, 35–55% opacity, and drift-based heights around 82–86% of the active image. All share the same vertical center, with zero rotation and zero Z depth. During a scan, mask width and horizontal position change together while the underlying photograph retains its full scale. The midpoint contains two abstract 20 px crops. Aperture-aware spacing keeps adjacent runs separated. Release or keyboard navigation settles over 550 ms using cubic-bezier(.65, 0, .20, 1), without bounce. The counter waits until the incoming photo becomes dominant. Only two faint reference crop corners appear during comparison. RUNS and 35 MM remain fixed editorial anchors. Comparison preserves the crop/scale mismatch and retracts the other planes in depth.

The metadata is a deterministic prototype fixture, not a measured evaluation of a generative model. The 35 MM control and seeds are illustrative. Crop, translation, scale, exposure, and contrast variations reuse one locally stored portrait. There are no AI API calls, runtime network assets, or random values.

The supplied attachment contained the written brief but no sketch image; the written single/fan/field geometry guided the composition.

## Assets and earlier studies

Portrait sample: `public/runs/portrait.jpg`, downloaded from [Unsplash image source](https://images.unsplash.com/photo-1506794778202-cad84cf45f1d). All five observed images and the expected reference use this same sample. IBM Plex Mono and Barlow Condensed remain locally bundled with their existing licenses.

The previous ATTENTION study is preserved at `?attention`; its source is `src/AttentionApp.tsx` and its original notes are in `ATTENTION.md`. The other existing studies remain intact.

## Editorial stills

`output/editorial/contact-sheet.png` collects SINGLE, FAN, FIELD, and COMPARE, left-to-right, top-to-bottom. Individual 16:9 captures are alongside it. The normal composition has no instructions, stage navigation, persistent run labels, crosshairs, or developer controls.

The refined parallel FIELD and abstract handover stills are in `output/parallel/field.png` and `output/parallel/midpoint.png`. Drag progress remains under direct pointer control until release.

## Production deployment

Production uses Vercel project `runs` in `alilins-projects`, with the Vite preset, `npm run build`, and `dist` output. No runtime server, environment variables, or custom routing configuration are required. The root `/` is the app entry point.

The legacy ATTENTION entry, capture query parameters, D debug toolbar and T text toggle are development-only. Normal RUNS pointer, keyboard, playback and motion logic are unchanged. `.vercelignore` excludes captures, previous nested studies, build output, local environment files, and documentation from uploads. Only compiled assets and `public` files are served.

For an authorized future production update, use `vercel deploy --prod --scope alilins-projects` from this directory, after `npm run build` and `npm run check:runs`. Local `.vercel` linkage is ignored by version control. The intended `runs.alilinlab.com` domain has not been attached; that is a separate step.
