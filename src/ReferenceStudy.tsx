import { useEffect, useRef, useState, type CSSProperties } from 'react';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const mix = (a: number, b: number, s: number) => a + (b - a) * s;
const color = (a: number[], b: number[], s: number) => `rgb(${a.map((v, i) => mix(v, b[i], s)).join(' ')})`;
const stops = [0, .25, .55, .85, 1, .35];
const times = [0, 1.35, 2.85, 4.35, 5.65, 7.5];

// All geometry and colour share the same continuous influence value.
function StillLife({ strength: s, id }: { strength: number; id: string }) {
  const x = (a: number, b: number) => mix(a, b, s);
  const body = `M ${x(148,173)} 145 C ${x(145,172)} 169 ${x(144,109)} 181 ${x(144,109)} ${x(195,235)} L ${x(144,116)} 287 Q ${x(144,118)} 309 ${x(166,150)} 312 L ${x(253,251)} 312 Q ${x(276,284)} 309 ${x(276,286)} 287 L ${x(276,293)} ${x(195,235)} C ${x(276,293)} 181 ${x(275,229)} 169 ${x(272,228)} 145 Z`;
  return <svg className="still-life" viewBox="0 0 400 440" role="img" aria-label={id === 'reference' ? 'Reference: rounded terracotta vessel in a warm studio' : 'Output: a cool angular vessel gradually adopts the reference’s rounded form and warm colour'}>
    <defs>
      <linearGradient id={`${id}-wall`} x2=".7" y2="1"><stop stopColor={color([199,208,211],[228,198,167],s)}/><stop offset="1" stopColor={color([167,182,189],[198,157,124],s)}/></linearGradient>
      <linearGradient id={`${id}-body`}><stop stopColor={color([78,109,126],[141,62,39],s)}/><stop offset=".33" stopColor={color([138,166,178],[213,124,79],s)}/><stop offset=".64" stopColor={color([111,141,157],[190,96,57],s)}/><stop offset="1" stopColor={color([47,74,91],[106,48,31],s)}/></linearGradient>
      <linearGradient id={`${id}-floor`} x2="0" y2="1"><stop stopColor={color([181,193,197],[212,179,144],s)}/><stop offset="1" stopColor={color([219,223,220],[233,211,179],s)}/></linearGradient>
      <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="7"/></filter>
      <filter id={`${id}-grain`}><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="8" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".1"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>
    </defs>
    <g filter={`url(#${id}-grain)`}>
      <path fill={`url(#${id}-wall)`} d="M0 0H400V440H0Z"/>
      <path fill="#fff5de" opacity={.07 + .16*s} d={`M0 0H${x(170,245)}L${x(12,100)} 340H0Z`}/>
      <path fill={`url(#${id}-floor)`} d="M0 326H400V440H0Z"/>
      <path fill="#554735" opacity=".13" d="M76 370l215-33 109 25v47H180Z" filter={`url(#${id}-blur)`}/>
      <path fill={color([174,183,180],[199,174,141],s)} d="M69 345H326V440H69Z"/>
      <path fill={color([223,225,214],[241,220,185],s)} d="M69 345l41-38h252l-36 38Z"/>
      <path fill={color([142,153,151],[174,145,116],s)} d="M326 345l36-38v133h-36Z"/>
      <ellipse cx={x(233,239)} cy="314" rx={x(81,94)} ry="11" fill="#34281e" opacity=".28" filter={`url(#${id}-blur)`}/>
      <g transform={`translate(${x(-9,-4)} 0)`}>
        <path d={body} fill={`url(#${id}-body)`}/>
        <path d={`M${x(148,173)} 145Q201 ${x(152,159)} ${x(272,228)} 145`} fill="none" stroke={color([170,189,195],[225,154,104],s)} strokeWidth="4"/>
        <ellipse cx={x(210,200.5)} cy="145" rx={x(62,27.5)} ry={x(6,8)} fill={color([50,73,83],[91,43,29],s)}/>
        <ellipse cx={x(210,200.5)} cy="144" rx={x(63,28.5)} ry={x(7,9)} fill="none" stroke={color([141,164,172],[206,132,88],s)} strokeWidth="3"/>
        <path d="M155 168L155 292" stroke="#ecf3eb" strokeWidth="1" opacity={.19*(1-s)}/>
      </g>
    </g>
  </svg>;
}

export function ReferenceStudy() {
  const [strength, setStrength] = useState(.32);
  const [playing, setPlaying] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [run, setRun] = useState(0);
  const [sweep, setSweep] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const target = useRef(.32);
  const current = useRef(.32);
  const activity = useRef(0);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    const start = previous;
    const tick = (now: number) => {
      const dt = Math.min(now - previous, 40); previous = now;
      if (playing) {
        const t = Math.min((now - start) / 1000, 7.5);
        let i = 0;
        while (i < times.length - 2 && t > times[i + 1]) i++;
        const p = clamp((t - times[i]) / (times[i+1] - times[i]));
        target.current = mix(stops[i], stops[i+1], p*p*(3-2*p));
        activity.current = now;
        if (t === 7.5) { target.current = .35; setPlaying(false); }
      }
      const next = reduced || playing ? target.current : mix(current.current, target.current, 1-Math.exp(-dt/45));
      current.current = Math.abs(next-target.current) < .00005 ? target.current : next;
      setStrength(current.current);
      if (!reduced && now-activity.current < 850) setSweep(v => (v + dt / 1350) % 1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, run, reduced]);
  const play = () => { target.current = 0; current.current = 0; setStrength(0); setRun(n=>n+1); setPlaying(true); };
  const change = (value: number) => {setPlaying(false); target.current = value; activity.current = performance.now();};
  const low = clamp(1 - strength*2), high = clamp(strength*2-1), medium = 1-low-high;
  return <main className={`study ${engaged ? 'is-engaged' : ''}`} style={{'--strength': strength} as CSSProperties}>
    <header className="masthead"><span className="wordmark">FORM / FIELD</span><span>MOTION STUDIES — 001</span><span>GENAI INTERACTIONS</span></header>
    <section aria-labelledby="study-title">
      <div className="heading"><div><p className="eyebrow">01 / IMAGE CONDITIONING</p><h1 id="study-title">Reference strength<span>.</span></h1></div><p className="heading-note">One source. A changing relationship.<br/>An exploration of visual influence.</p></div>
      <div className="relationship">
        <figure className="endpoint reference"><figcaption><span>REFERENCE <i>/ 01</i></span><span className="subdued">SOURCE IMAGE</span></figcaption><div className="image-frame"><StillLife strength={1} id="reference"/><div className="reference-outline" style={{opacity:strength}}/><span className="plate-mark">A</span></div><div className="image-meta"><span>FORM / COLOUR / MATERIAL</span><span>FIXED</span></div></figure>
        <div className="connection" aria-hidden="true"><span className="connection-label" style={{opacity:.28+.6*strength}}>INFLUENCE</span><svg viewBox="0 0 180 36"><defs><linearGradient id="signal"><stop stopColor="#af5035" stopOpacity="0"/><stop offset="1" stopColor="#af5035"/></linearGradient><clipPath id="line-clip"><rect x="1" y="0" width="178" height="36"/></clipPath></defs><path d="M1 18H179" stroke="#b8b4ab" opacity={.18+.4*strength}/><path d="M1 18H179" stroke="#a9563e" strokeWidth={.6+strength*1.2} opacity={strength*.8}/><path d={`M1 18H${1+178*strength}`} stroke="#a9563e" strokeWidth="2" opacity={strength}/><g clipPath="url(#line-clip)" opacity={reduced?0:strength*.7}><path d={`M${sweep*230-50} 18h36`} stroke="url(#signal)" strokeWidth="3"/></g><path d="M1 13v10M179 13v10" stroke="#a9563e" opacity={.2+strength*.7}/></svg><span className="connection-value" style={{opacity:.2+.7*strength}}>{Math.round(strength*100).toString().padStart(2,'0')}%</span></div>
        <figure className="endpoint output"><figcaption><span>OUTPUT <i>/ 01</i></span><span className="subdued">GENERATED STUDY</span></figcaption><div className="image-frame"><StillLife strength={strength} id="output"/><span className="plate-mark">B</span></div><div className="image-meta"><span>REFERENCE INFLUENCE</span><span className="influence-label"><span style={{opacity:.15+.85*low}}>LOW</span><span style={{opacity:.15+.85*medium}}>MEDIUM</span><span style={{opacity:.15+.85*high}}>HIGH</span></span></div></figure>
      </div>
      <div className="instrument"><div className="instrument-title"><label htmlFor="strength">REFERENCE STRENGTH</label><p>Independent <span>—</span> Informed by reference</p></div><div className="slider-group"><div className="slider-track"><div className="slider-line"/><div className="slider-fill" style={{width:`${strength*100}%`}}/><div className="slider-ticks">{Array.from({length:21},(_,i)=><span key={i} className={i%5===0?'major':''}/>)}</div><div className="slider-thumb" style={{left:`${strength*100}%`}}/><input id="strength" aria-label="Reference strength" aria-valuetext={strength.toFixed(2)} type="range" min="0" max="1" step="0.001" value={strength} onChange={e=>change(Number(e.target.value))} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setPlaying(false);setEngaged(true);}} onPointerUp={()=>setEngaged(false)} onPointerCancel={()=>setEngaged(false)} onFocus={()=>setEngaged(true)} onBlur={()=>setEngaged(false)} onKeyUp={()=>setEngaged(false)} onKeyDown={()=>setEngaged(true)}/></div><div className="slider-labels"><span>0.00</span><span>0.50</span><span>1.00</span></div></div><output htmlFor="strength" className="readout">{strength.toFixed(2)}</output></div>
      <footer className="study-footer"><span className="footer-caption">A CONTINUOUS STUDY IN CAUSE & EFFECT</span><div className="playback"><span className="duration">07.5 SEC</span><button onClick={()=>playing?setPlaying(false):play()} aria-label={playing?'Pause motion':'Play motion'}><span className="play-icon">{playing?'Ⅱ':'▷'}</span>{playing?'PAUSE MOTION':'PLAY MOTION'}</button><button className="replay" onClick={play}><span>↺</span> REPLAY</button></div></footer>
    </section>
    <div className="colophon"><span>REFERENCE STRENGTH / COMPONENT STUDY</span><span>DRAG TO EXPLORE</span></div>
  </main>;
}
