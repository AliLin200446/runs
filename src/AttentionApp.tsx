import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { buildScene } from './AttentionScene';
import './attention.css';
import { DURATION } from './attentionPhysics';

function Attention(){
 const params=new URLSearchParams(location.search), initial=Math.max(0,Math.min(DURATION,Number(params.get('t')||0)));
 const host=useRef<HTMLDivElement>(null), engine=useRef<ReturnType<typeof buildScene>|null>(null), clock=useRef(initial), playing=useRef(!params.has('t')&&!matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [time,setTime]=useState(initial),[running,setRunning]=useState(playing.current),[hidden,setHidden]=useState(!params.has('controls')),[textless,setTextless]=useState(params.has('textless')),[error,setError]=useState('');
 const cleanText=useRef(textless);cleanText.current=textless;
 useEffect(()=>{document.title="ATTENTION — Motion Study";try{engine.current=buildScene(host.current!);}catch(e){setError(`WebGL could not start: ${e instanceof Error?e.message:String(e)}`);return;}let raf=0,last=performance.now();const tick=(now:number)=>{if(playing.current){clock.current=Math.min(DURATION,clock.current+Math.min((now-last)/1000,.05));if(clock.current===DURATION){playing.current=false;setRunning(false);}setTime(clock.current);}last=now;engine.current!.render(clock.current,cleanText.current,params.has('pin'));raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);engine.current?.dispose();};},[]);
 const replay=()=>{clock.current=0;setTime(0);playing.current=true;setRunning(true);};
 const play=()=>{if(clock.current>=DURATION){replay();return;}playing.current=!playing.current;setRunning(playing.current);};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement)return;if(e.code==='Space'){e.preventDefault();play();}if(e.key.toLowerCase()==='r')replay();if(e.key.toLowerCase()==='h')setHidden(h=>!h);if(e.key.toLowerCase()==='t')setTextless(t=>!t);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[]);
 return <main className={hidden?'screen clean':'screen'}><div className="film" aria-label="Attention: metallic safety pins slide away to reveal a hidden metallic monogram"><div className="canvas" ref={host}/>{error&&<p className="error">{error}</p>}<div className="end-title" style={{opacity:textless?0:Math.max(0,Math.min(1,(time-4.0)/.7))}}>ATTENTION</div></div><footer className="controls"><div className="transport"><button onClick={play}>{running?'PAUSE':'PLAY'}</button><button onClick={replay}>REPLAY</button><span className="time">{time.toFixed(2)} / 06.00</span></div><input aria-label="Film timeline" type="range" min="0" max={DURATION} step="0.0083333333" value={time} onChange={e=>{clock.current=Number(e.target.value);setTime(clock.current);playing.current=false;setRunning(false);}}/><div className="options"><button aria-pressed={textless} onClick={()=>setTextless(!textless)}>{textless?'TEXT OFF':'TEXT ON'}</button><button onClick={()=>setHidden(true)}>HIDE CONTROLS <kbd>H</kbd></button></div></footer></main>;
}
createRoot(document.getElementById('root')!).render(<Attention/>);
