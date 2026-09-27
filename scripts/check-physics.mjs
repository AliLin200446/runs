import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile=p=>ts.transpile(fs.readFileSync(new URL(p,import.meta.url),'utf8'),{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const markURL='data:text/javascript;base64,'+Buffer.from(compile('../src/attentionMark.ts')).toString('base64');
const js=compile('../src/attentionPhysics.ts').replace("'./attentionMark'",JSON.stringify(markURL));
const {createStudy,COUNT,STEP,DURATION}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const a=createStudy(),b=createStudy();assert.deepEqual(a.frames,b.frames);assert(a.frames.every(Number.isFinite));
const at=(t,i)=>(Math.round(t/STEP)*COUNT+i)*3;
let maxTravel=0,maxAngle=0,cleared=0;
for(let i=0;i<COUNT;i++){
 const p=a.pins[i];
 for(let f=0;f<=Math.floor(p.onset/STEP);f++)for(let k=0;k<3;k++)assert.equal(a.frames[(f*COUNT+i)*3+k],a.frames[i*3+k],'Movement before sweep arrival');
 if(p.selected){for(let f=0;f<=DURATION/STEP;f++){const o=(f*COUNT+i)*3;maxTravel=Math.max(maxTravel,a.frames[o]-p.x);maxAngle=Math.max(maxAngle,Math.abs(a.frames[o+2]-p.a));assert(a.frames[o]>=p.x-.00001,'Logo overshoot');}}
 else {for(let f=1;f<=DURATION/STEP;f++)assert(a.frames[(f*COUNT+i)*3]>=a.frames[((f-1)*COUNT+i)*3],'Loose pin moves left');if(a.frames[at(2.7,i)]>10.2)cleared++;assert(a.frames[at(DURATION,i)]>10.2,'Pin has not crossed right edge');}
 for(let k=0;k<3;k++)assert(Math.abs(a.frames[at(2.7,i)+k]-a.frames[at(DURATION,i)+k])<.00001,'Motion after hold');
}
assert.equal(cleared,COUNT-18);assert(maxTravel>.008&&maxTravel<.018);assert(maxAngle*180/Math.PI<1);
const onsets=a.pins.filter(p=>!p.selected).map(p=>p.onset);assert(Math.max(...onsets)-Math.min(...onsets)>.2);
console.log({pins:COUNT,loose:COUNT-18,clearedRightBy2_7:cleared,maxLogoTravel:maxTravel,maxLogoAngleDegrees:maxAngle*180/Math.PI,propagation:Math.max(...onsets)-Math.min(...onsets),deterministic:true});
