import { markTargets } from './attentionMark';
export const SELECTED=18;
export const COUNT=318;
export const STEP=1/120;
export const DURATION=6;
export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x);};
export const sweepTime=(x:number)=>1.4+.22*clamp((x+9)/18);
export type Pin={x:number;y:number;a:number;vx:number;vy:number;va:number;tx:number;ty:number;ta:number;selected:boolean;scale:number;layer:number;mass:number;friction:number;collisionRadius:number;exited:boolean;angularDamping:number;onset:number;launched:boolean};
function random(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function createStudy(){
 const rand=random(83142),targets=markTargets();
 const pins:Pin[]=targets.map(p=>({...p,vx:0,vy:0,va:0,tx:p.x,ty:p.y,ta:p.a,selected:true,layer:0,mass:4,friction:0,collisionRadius:.17,exited:false,angularDamping:24,onset:sweepTime(p.x),launched:false}));
 const piles=[[-6,2.6],[-5,-2.5],[-2,2.8],[2.2,1.7],[4,-1.8],[6,2.6],[1,-3]];
 for(let i=SELECTED;i<COUNT;i++){
  let x:number,y:number;
  if(i<SELECTED+54){const target=targets[(i-SELECTED)%targets.length];x=target.x+(rand()-.5)*1.6;y=target.y+(rand()-.5)*1.5;}
  else if(i%3===0){const p=piles[Math.floor(rand()*piles.length)];x=p[0]+(rand()+rand()-1)*3.4;y=p[1]+(rand()+rand()-1)*2.4;}
  else{x=(rand()-.5)*17.6;y=(rand()-.5)*9.5;}
  const scale=1.7+rand()*.4,a=rand()*Math.PI*2;
  pins.push({x,y,a,vx:0,vy:0,va:0,tx:x,ty:y,ta:a,selected:false,scale,layer:.035+(i%5)*.014,mass:.85+rand()*.3,friction:2.4+rand()*3.2,collisionRadius:.16*scale,exited:false,angularDamping:1.5+rand()*2.5,onset:sweepTime(x),launched:false});
 }
 const initial=pins.map(p=>({...p})),steps=Math.round(DURATION/STEP),frames=new Float32Array((steps+1)*COUNT*3);
 const save=(f:number)=>pins.forEach((p,i)=>{const o=(f*COUNT+i)*3;frames[o]=p.x;frames[o+1]=p.y;frames[o+2]=p.a;});save(0);
 for(let f=1;f<=steps;f++){
  const t=f*STEP;
  for(const p of pins){
   if(p.exited||t<=p.onset)continue;
   if(p.selected){
    // Impulse response of a critically damped fixture: no bounce or overshoot.
    const age=t-p.onset,response=age*Math.exp(-38*age);
    p.x=p.tx+1.45*response;p.a=p.ta+1.35*Math.sin(p.ta+.8)*response;
    continue;
   }
   if(!p.launched){p.launched=true;p.vx=28/p.mass;p.vy=.65*Math.sin(p.a*2);p.va=3.4*Math.sin(p.a+.4)/p.mass;}
   const retain=Math.max(0,1-p.friction*STEP/Math.max(Math.hypot(p.vx,p.vy),.00001));p.vx*=retain;p.vy*=retain;p.va*=Math.exp(-p.angularDamping*STEP);
  }
  // Only bodies already reached by the sweep exchange momentum. Layered wire
  // contacts are intentionally light, preserving the single directional gesture.
  if(t>1.4&&t<2.7)for(let i=SELECTED;i<COUNT;i++)for(let j=i+1;j<COUNT;j++){
   const a=pins[i],b=pins[j];if(a.exited||b.exited||!a.launched||!b.launched)continue;
   const dx=b.x-a.x,dy=b.y-a.y,r=a.collisionRadius+b.collisionRadius,d2=dx*dx+dy*dy;if(d2<.00001||d2>r*r)continue;
   const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(relative>=0)continue;
   const ia=1/a.mass,ib=1/b.mass,impulse=-1.08*relative/(ia+ib)*.12;
   a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib;a.va-=impulse*.2*ia;b.va+=impulse*.2*ib;
  }
  for(const p of pins){
   if(p.exited||p.selected||!p.launched)continue;
   p.x+=p.vx*STEP;p.y+=p.vy*STEP;p.a+=p.va*STEP;
   // Beyond the right crop plus a full pin radius; never removed while visible.
   if(p.x>10.2){p.exited=true;p.vx=p.vy=p.va=0;}
  }
  save(f);
 }
 return {pins:initial,frames,selected:SELECTED};
}
