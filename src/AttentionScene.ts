import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { COUNT, STEP, DURATION, createStudy, smooth } from './attentionPhysics';

export function buildScene(host:HTMLDivElement) {
 const study=createStudy();
 const capture=new URLSearchParams(location.search).has('capture');
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:capture,alpha:false,powerPreference:'high-performance'});
 renderer.setPixelRatio(capture?1:Math.min(Math.max(devicePixelRatio,1.5),2));renderer.setClearColor('#0e0e0d');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;host.appendChild(renderer.domElement);
 const captureLink=capture?document.createElement('a'):null;
 if(captureLink){captureLink.textContent='DOWNLOAD FRAME';captureLink.download='attention-frame.png';captureLink.style.cssText='position:fixed;bottom:12px;right:20px;font:10px Arial;color:#555;z-index:9';document.body.appendChild(captureLink);}
 let capturedTime=-1;
 const scene=new THREE.Scene();
 // Long lens, only seven degrees off perpendicular: depth without theatrical perspective.
 const camera=new THREE.PerspectiveCamera(18,16/9,.1,90);camera.position.set(0,-3.35,28);camera.lookAt(0,.2,0);
 const studio=new THREE.Scene();studio.background=new THREE.Color(.006,.006,.006);
 const card=(w:number,h:number,x:number,y:number,z:number,color:THREE.Color)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);studio.add(m);};
 // One dominant reflection card, with a low-output narrow fill opposite it.
 card(3.8,10,-2.6,3,7,new THREE.Color(5.4,5.3,5.1));
 card(1,8,5,-2,6,new THREE.Color(.32,.35,.38));
 const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.025);scene.environment=env.texture;scene.environmentIntensity=1.0;
 studio.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});pmrem.dispose();
 scene.add(new THREE.AmbientLight(0xffffff,.045));
 const key=new THREE.DirectionalLight(0xfffaf1,2.3);key.position.set(-4,5,8);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.camera.near=.5;key.shadow.camera.far=25;key.shadow.normalBias=.005;key.shadow.bias=-.00002;key.shadow.radius=3;key.shadow.blurSamples=12;scene.add(key);
 const fill=new THREE.DirectionalLight(0xe5edff,.12);fill.position.set(4,-2,6);scene.add(fill);
 const wash=new THREE.SpotLight(0xfff5e7,20,40,1.08,1,2);wash.position.set(-4,4,9);wash.target.position.set(-1,0,0);scene.add(wash,wash.target);
 // Fine black presentation stone: almost imperceptible micro-roughness.
 const grain=document.createElement('canvas');grain.width=grain.height=256;const gc=grain.getContext('2d')!;const data=gc.createImageData(256,256);let seed=19;for(let i=0;i<data.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=125+(seed%7);data.data[i]=v;data.data[i+1]=v;data.data[i+2]=v;data.data[i+3]=255;}gc.putImageData(data,0,0);const texture=new THREE.CanvasTexture(grain);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(90,90);
 const table=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshPhysicalMaterial({color:0x151513,roughness:.86,metalness:0,specularIntensity:.12,envMapIntensity:.025,bumpMap:texture,bumpScale:.001}));table.receiveShadow=true;table.position.z=0;scene.add(table);
 const pieces:THREE.BufferGeometry[]=[];
 const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 const tube=(points:THREE.Vector3[],radius=.022)=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,radius,12,false);
 pieces.push(tube([v(-.255,.047,.034),v(-.16,.105,.039),v(.06,.108,.043),v(.22,.063,.051),v(.285,.026,.055)]));
 pieces.push(tube([v(-.265,-.05,.035),v(-.12,-.054,.036),v(.14,-.038,.037),v(.302,-.008,.045)],.018));
 const coil:THREE.Vector3[]=[];for(let n=0;n<=90;n++){const a=.72+n/90*Math.PI*2.25;coil.push(v(-.294+Math.cos(a)*.052,Math.sin(a)*.052,.036+n/90*.018));}pieces.push(tube(coil,.021));
 // Rounded folded steel hood with a second rolled rim catching a narrow reflection.
 const shape=new THREE.Shape();shape.moveTo(.239,-.049);shape.lineTo(.312,-.042);shape.quadraticCurveTo(.351,-.004,.321,.049);shape.quadraticCurveTo(.29,.069,.25,.06);shape.quadraticCurveTo(.231,.01,.239,-.049);
 const clasp=new THREE.ExtrudeGeometry(shape,{depth:.042,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.013,bevelThickness:.014,curveSegments:20});clasp.translate(0,0,.016);
 const positions=clasp.getAttribute('position'),normals=clasp.getAttribute('normal');
 for(let i=0;i<positions.count;i++){if(normals.getZ(i)>.95){const y=positions.getY(i)-.005;positions.setZ(i,positions.getZ(i)+.016*Math.max(0,1-y*y/.0036));const normal=v(0,2*.016*y/.0036,1).normalize();normals.setXYZ(i,normal.x,normal.y,normal.z);}}
 pieces.push(clasp);
 pieces.push(tube([v(.247,-.039,.068),v(.251,.005,.079),v(.259,.052,.068)],.006));
 const expanded=pieces.map(g=>g.index?g.toNonIndexed():g),geometry=mergeGeometries(expanded);new Set([...pieces,...expanded]).forEach(g=>g.dispose());
 const steel=new THREE.MeshPhysicalMaterial({color:0xdce0e2,metalness:1,roughness:.115,clearcoat:0});
 const mesh=new THREE.InstancedMesh(geometry,steel,COUNT);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);
 // A soft local contact footprint grounds the wire even below shadow-map texel size.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=64;const ctx=shadowCanvas.getContext('2d')!; // Use a wire-shaped, blurred silhouette, avoiding oval blobs beneath the objects.
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,256,64);ctx.filter='blur(5px)';ctx.strokeStyle='rgba(0,0,0,.72)';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(124,32,91,12,0,0,Math.PI*2);ctx.stroke();
 const contactTexture=new THREE.CanvasTexture(shadowCanvas),contactMaterial=new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,opacity:.9});
 const contacts=new THREE.InstancedMesh(new THREE.PlaneGeometry(.83,.25),contactMaterial,COUNT);contacts.frustumCulled=false;scene.add(contacts);
 const dummy=new THREE.Object3D();let lastTime=-1,lastSingle=false;
 function render(time:number,_hideText=false,single=false){
  if(lastTime===time&&lastSingle===single)return;
  lastTime=time;lastSingle=single;const frame=Math.min(Math.round(DURATION/STEP)-1,Math.floor(time/STEP)),frac=Math.min(1,time/STEP-frame);
  for(let i=0;i<COUNT;i++){
   const p=study.pins[i],o=(frame*COUNT+i)*3,n=o+COUNT*3;
   const x=THREE.MathUtils.lerp(study.frames[o],study.frames[n],frac),y=THREE.MathUtils.lerp(study.frames[o+1],study.frames[n+1],frac),a=THREE.MathUtils.lerp(study.frames[o+2],study.frames[n+2],frac);
   const stack=p.layer*(1-smooth((time-p.onset)/.3));
   dummy.position.set(single?0:x,single?0:y,stack);dummy.rotation.set(0,0,single?-.27:a);dummy.scale.setScalar(single?(i===0?6:0):p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   dummy.position.z=.002;dummy.rotation.set(0,0,single?-.27:a);dummy.updateMatrix();contacts.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;contacts.instanceMatrix.needsUpdate=true;
  camera.zoom=1+.018*smooth((time-3.5)/1.5);camera.updateProjectionMatrix();renderer.render(scene,camera);
  if(captureLink&&capturedTime!==time){captureLink.href=renderer.domElement.toDataURL("image/png");capturedTime=time;}
 }
 const observer=new ResizeObserver(()=>{capturedTime=-1;renderer.setSize(capture?1920:host.clientWidth,capture?1080:host.clientHeight,!capture);const resumeTime=Math.max(0,lastTime);lastTime=-1;render(resumeTime,false,lastSingle);});observer.observe(host);
 return {render,selected:study.selected,stats:()=>({...renderer.info.render}),dispose(){captureLink?.remove();observer.disconnect();scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});texture.dispose();contactTexture.dispose();env.dispose();renderer.dispose();renderer.domElement.remove();}};
}
