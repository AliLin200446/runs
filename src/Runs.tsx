import { useEffect, useRef, useState } from "react";
import {
  clamp,
  frontRun,
  initialMotion,
  mix,
  pose,
  inspectionAnchor,
  scanEase,
  runAngle,
  runs,
  sample,
  type Motion,
} from "./runsMotion";

const params = new URLSearchParams(import.meta.env.DEV ? location.search : "");
const startTime = clamp(Number(params.get("t")) || 0, 0, 9);
const photo = "/runs/portrait.jpg";
type Mode = "CONTROL" | "RUNS" | "FIELD" | "COMPARE";
export function Runs() {
  const stage = useRef<HTMLDivElement>(null),
    world = useRef<HTMLDivElement>(null),
    cards = useRef<(HTMLButtonElement | null)[]>([]),
    expected = useRef<HTMLDivElement>(null);
  const state = useRef<Motion>(
    params.has("t") ? sample(startTime) : initialMotion(),
  );
  const target = useRef<Motion>({ ...state.current });
  const playback = useRef(false),
    elapsed = useRef(startTime),
    selected = useRef(3),
    compareAge = useRef(0),
    returning = useRef(false);
  const pointer = useRef({
    down: false,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    distance: 0,
    angle: 0,
    field: 0,
    px: 0,
    py: 0,
  });
  const counterRun = useRef(2);
  const settle = useRef<{ from: number; to: number; start: number } | null>(
    null,
  );
  const [mode, setMode] = useState<Mode>("CONTROL"),
    [front, setFront] = useState(2),
    [time, setTime] = useState(startTime),
    [playing, setPlaying] = useState(false);
  const [debugMode, setDebugMode] = useState(false),
    [textless, setTextless] = useState(params.has("textless")),
    [flat, setFlat] = useState(params.has("flat"));
  const flatRef = useRef(flat);
  flatRef.current = flat;
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  const reduced = useRef(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const stop = () => {
    playback.current = false;
    settle.current = null;
    setPlaying(false);
  };
  const replay = () => {
    returning.current = false;
    settle.current = null;
    elapsed.current = 0;
    playback.current = true;
    setPlaying(true);
    selected.current = 3;
    compareAge.current = 0;
  };
  const togglePlay = () => {
    if (playback.current) stop();
    else if (elapsed.current > 0 && elapsed.current < 9) {
      playback.current = true;
      setPlaying(true);
    } else replay();
  };
  const back = () => {
    stop();
    returning.current = false;
    compareAge.current = 0;
    const s = target.current;
    if (s.compare > 0) {
      s.compare = 0;
      s.reveal = 0;
    } else if (s.field > 0) {
      s.field = 0;
      s.angle = 0;
    } else s.expand = 0;
  };
  const compare = (i: number) => {
    if (target.current.field < 0.8 || i !== frontRun(state.current.angle))
      return;
    stop();
    elapsed.current = 0;
    selected.current = i;
    target.current.compare = 1;
    target.current.reveal = 0;
    compareAge.current = 0;
  };
  const seek = (t: number) => {
    stop();
    returning.current = false;
    elapsed.current = t;
    selected.current = 3;
    state.current = sample(t);
    target.current = { ...state.current };
    setTime(t);
  };
  useEffect(() => {
    let raf = 0,
      last = performance.now(),
      lastUI = 0;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (playback.current) {
        elapsed.current = Math.min(9, elapsed.current + dt);
        state.current = sample(elapsed.current);
        target.current = { ...state.current };
        if (elapsed.current >= 9) {
          playback.current = false;
          setPlaying(false);
        }
      } else {
        const speed = reduced.current ? 1 : 1 - Math.exp(-dt * 8);
        for (const key of Object.keys(state.current) as (keyof Motion)[])
          state.current[key] = mix(
            state.current[key],
            target.current[key],
            speed,
          );
        if (target.current.compare === 1 && elapsed.current === 0) {
          compareAge.current += dt;
          if (compareAge.current > 1.5) target.current.reveal = 1;
          if (compareAge.current > 5) {
            target.current.compare = 0;
            target.current.reveal = 0;
            returning.current = true;
          }
        }
        if (returning.current) {
          if (state.current.compare < 0.015) target.current.field = 0;
          if (state.current.field < 0.015) target.current.expand = 0;
          if (state.current.expand < 0.015) returning.current = false;
        }
      }
      if (pointer.current.down && !settle.current && target.current.field > 0.8)
        state.current.angle = target.current.angle;
      // A bounded 550ms optical transition is independent of the fan's easing.
      if (settle.current && !playback.current) {
        const progress = reduced.current
          ? 1
          : clamp((now - settle.current.start) / 550);
        state.current.angle = mix(
          settle.current.from,
          settle.current.to,
          scanEase(progress),
        );
        if (progress === 1) {
          if (pointer.current.down) {
            pointer.current.startX = pointer.current.lastX;
            pointer.current.angle = settle.current.to;
            pointer.current.field = 1;
          }
          settle.current = null;
        }
      }
      const s = state.current,
        inspected = frontRun(s.angle),
        active = s.compare > 0.01 ? selected.current : inspected;
      const scale = stage.current ? stage.current.clientWidth / 1440 : 1;
      if (world.current)
        world.current.style.transform = `translate(-50%, -50%) scale(${scale}) rotateX(${-pointer.current.py * s.expand * (1 - s.compare) * (1 - s.field) * 1.2}deg) rotateY(${pointer.current.px * s.expand * (1 - s.field) * 1.5}deg)`;
      cards.current.forEach((el, i) => {
        if (!el) return;
        const p = pose(i, s, active, flatRef.current);
        el.style.transform = `translate3d(${p.x}px,${p.y}px,${p.z}px) rotateZ(${p.rz}deg) rotateY(${p.ry}deg) scale(${p.planeScale})`;
        el.style.opacity = String(p.opacity);
        el.style.setProperty("--aperture", String(p.aperture));
        el.style.setProperty("--crop-shift", p.cropShift + "px");
        el.style.setProperty(
          "--slit-inset",
          (364 - p.visibleHeight) / 2 + "px",
        );
        el.style.clipPath =
          s.field > 0.001 && s.compare < 0.999
            ? "inset(-32px " + (270 - p.aperture) / 2 + "px -32px)"
            : "none";
        el.style.zIndex = String(Math.round(p.z + 600));
        el.style.setProperty(
          "--label-opacity",
          String(s.expand * (1 - s.field) * (i === 2 ? 1 : 0)),
        );
        el.style.setProperty("--fan-label", String(s.expand * (1 - s.field)));
        el.tabIndex =
          (s.field > 0.8 && i === inspected) || (s.field < 0.1 && i === 2)
            ? 0
            : -1;
        el.setAttribute("aria-label", `Compare ${runs[i].id}`);
      });
      if (expected.current) {
        expected.current.style.opacity = String(1);
        expected.current.style.setProperty("--reference", String(s.compare));
      }
      if (stage.current) {
        stage.current.style.setProperty(
          "--field-quiet",
          String(s.field * (1 - s.compare)),
        );
        stage.current.style.setProperty(
          "--counter-left",
          50 + (inspectionAnchor(s.angle) / 1440) * 100 + "%",
        );
        stage.current.style.setProperty("--comparison", String(s.compare));
        stage.current.style.setProperty(
          "--metrics",
          String(s.reveal * s.compare),
        );
        stage.current.style.setProperty("--expanded", String(s.expand));
      }
      if (now - lastUI > 60) {
        if (
          s.compare > 0.01 ||
          s.field < 0.8 ||
          pose(inspected, s, inspected).weight > 0.08
        )
          counterRun.current = active;
        setFront(counterRun.current);
        setTime(elapsed.current);
        setMode(
          s.compare > 0.5
            ? "COMPARE"
            : s.field > 0.5
              ? "FIELD"
              : s.expand > 0.15
                ? "RUNS"
                : "CONTROL",
        );
        lastUI = now;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (import.meta.env.DEV && e.key.toLowerCase() === "d") {
        setDebugMode((v) => !v);
        return;
      }
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Escape") back();
      if (import.meta.env.DEV && e.key.toLowerCase() === "t") setTextless((v) => !v);
      if (e.key.toLowerCase() === "r") replay();
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        stop();
        target.current.expand = 1;
        target.current.field = 1;
        target.current.compare = 0;
        const from = state.current.angle;
        target.current.angle = clamp(
          target.current.angle + (e.key === "ArrowRight" ? -0.59 : 0.59),
          -1.18,
          1.18,
        );
        settle.current = {
          from,
          to: target.current.angle,
          start: performance.now(),
        };
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const r = runs[front];
  return (
    <main
      className={`runs-app ${debugMode ? "debug" : ""} ${textless ? "textless" : ""}`}
    >
      <section
        className="composition"
        ref={stage}
        aria-label="RUNS interactive motion study"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest(".print")) {
            stop();
            settle.current = null;
            pointer.current = {
              ...pointer.current,
              down: true,
              startX: e.clientX,
              lastX: e.clientX,
              lastTime: performance.now(),
              velocity: 0,
              distance: 0,
              angle: target.current.angle,
              field: target.current.field,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }
        }}
        onPointerMove={(e) => {
          const p = pointer.current,
            rect = e.currentTarget.getBoundingClientRect();
          p.px = (e.clientX - rect.left) / rect.width - 0.5;
          p.py = (e.clientY - rect.top) / rect.height - 0.5;
          if (p.down) {
            settle.current = null;
            const now = performance.now();
            p.velocity = (e.clientX - p.lastX) / Math.max(1, now - p.lastTime);
            p.lastX = e.clientX;
            p.lastTime = now;
            const dx = ((e.clientX - p.startX) * 1440) / rect.width;
            p.distance = Math.max(p.distance, Math.abs(dx));
            if (p.distance > 5 && target.current.compare < 0.1) {
              target.current.expand = 1;
              target.current.field = clamp(Math.abs(dx) / 100 + p.field);
              target.current.angle = clamp(p.angle - dx * 0.006, -1.18, 1.18);
            }
          }
        }}
        onPointerUp={(e) => {
          const p = pointer.current;
          if (p.down) {
            p.down = false;
            if (p.distance > 5) {
              target.current.field = 1;
              const destination = -runAngle(frontRun(target.current.angle));
              settle.current = {
                from: state.current.angle,
                to: destination,
                start: performance.now(),
              };
              target.current.angle = destination;
            } else {
              const hit = document
                .elementFromPoint(e.clientX, e.clientY)
                ?.closest<HTMLElement>("[data-run]");
              if (hit) compare(Number(hit.dataset.run));
            }
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          } else if (!(e.target as HTMLElement).closest(".print")) back();
        }}
        onPointerCancel={() => {
          pointer.current.down = false;
        }}
      >
        <header className="masthead annotation">
          <div className="wordmark">
            RUNS<span className="meta">03</span>
          </div>
        </header>
        <div className="control annotation">
          <div className="lens">35 MM</div>
          <span className="meta">CENTERED · SOFT LIGHT</span>
        </div>
        <div className="world" ref={world}>
          <div className="expected" ref={expected}>
            <div className="expected-photo">
              <img
                src={photo}
                alt="Expected centered composition"
                draggable={false}
              />
            </div>
            <span className="expected-label meta annotation">EXPECTED</span>
            <b className="corner a" />
            <b className="corner c" />
          </div>
          {[0, 1, 4, 3, 2].map((i) => (
            <button
              key={i}
              ref={(el) => {
                cards.current[i] = el;
              }}
              data-run={i}
              className="print"
              onPointerEnter={() => {
                if (
                  !playback.current &&
                  !returning.current &&
                  target.current.field < 0.1
                )
                  target.current.expand = 1;
              }}
              onClick={(e) => {
                if (e.detail === 0) compare(i);
              }}
              onFocus={() => {
                if (target.current.expand === 0) target.current.expand = 1;
              }}
            >
              <div className="image-window">
                <img
                  src={photo}
                  alt={`Portrait generation ${runs[i].id}`}
                  draggable={false}
                  onLoad={() => setReady(true)}
                  onError={() => setFailed(true)}
                  style={{
                    transform: `translate(${runs[i].dx}%, ${runs[i].dy}%) scale(${runs[i].zoom * 1.04})`,
                    filter: `brightness(${runs[i].exposure}) contrast(${1 + (runs[i].exposure - 1) * 0.45})`,
                  }}
                />
              </div>
              <span className="run-label meta annotation">
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
        {(!ready || failed) && (
          <div className="asset-status">
            {failed ? "PORTRAIT COULD NOT LOAD" : "LOADING SAMPLE"}
          </div>
        )}
        <aside className="evaluation meta annotation">
          <span>OBSERVED {String(front + 1).padStart(2, "0")} / 05</span>
          <dl>
            <div>
              <dt>FRAME</dt>
              <dd>
                {r.dx > 0 ? "+" : ""}
                {r.dx.toFixed(1)}%
              </dd>
            </div>
            <div>
              <dt>SCALE</dt>
              <dd>+{((r.zoom - 1) * 100).toFixed(1)}%</dd>
            </div>
            <div>
              <dt>CENTROID</dt>
              <dd>{Math.round(r.dy * 4)} PX</dd>
            </div>
          </dl>
        </aside>
        <div
          className="sample-caption meta annotation"
          style={{ opacity: mode === "FIELD" ? 1 : 0 }}
        >
          {String(front + 1).padStart(2, "0")} / 05
        </div>
      </section>
      {import.meta.env.DEV && debugMode && (
        <nav className="dev-controls" aria-label="Motion development controls">
          <div>
            <button className="play" onClick={togglePlay}>
              <span>{playing ? "Ⅱ" : "▷"}</span>
              {playing ? "PAUSE" : "PLAY MOTION"}
            </button>
            <button onClick={replay}>REPLAY</button>
          </div>
          <label className="timeline">
            <span>{time.toFixed(2)} / 09.00</span>
            <input
              type="range"
              aria-label="Motion timeline"
              min="0"
              max="9"
              step=".01"
              value={time}
              onChange={(e) => seek(Number(e.target.value))}
            />
          </label>
          <div>
            <button
              aria-pressed={textless}
              onClick={() => setTextless(!textless)}
            >
              TEXT {textless ? "OFF" : "ON"}
            </button>
            <button aria-pressed={flat} onClick={() => setFlat(!flat)}>
              DEPTH {flat ? "OFF" : "ON"}
            </button>
          </div>
        </nav>
      )}
    </main>
  );
}
