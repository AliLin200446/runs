import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { stateAt, lerp } from './timeline';

// One continuous, corrugated surface. No image swaps or nondeterministic motion.
function foldedRing() {
  const positions:number[]=[]; const indices:number[]=[];
  const nu=640, nv=32;
  for(let i=0;i<=nu;i++) {
    const u=i/nu*Math.PI*2;
    const major=1.34 + .12*Math.cos(3*u);
    const fold=.058*Math.cos(80*u);
    for(let j=0;j<=nv;j++) {
      const v=j/nv*Math.PI*2;
      const twist=.5*Math.sin(2*u)+.3;
      const a=(.40+fold)*Math.cos(v), b=(.69+fold)*Math.sin(v);
      const radial=a*Math.cos(twist)-b*Math.sin(twist);
      const z=a*Math.sin(twist)+b*Math.cos(twist);
      positions.push((major+radial)*Math.cos(u),(major+radial)*Math.sin(u),z+.19*Math.sin(2*u));
      if(i<nu && j<nv){const k=i*(nv+1)+j; indices.push(k,k+nv+1,k+1,k+1,k+nv+1,k+nv+2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function Sculpture({time}:{time:number}) {
  const mount=useRef<HTMLDivElement>(null);const clock=useRef(time);clock.current=time;
  useEffect(()=>{
    const host=mount.current!;
    let renderer:THREE.WebGLRenderer;
    try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});} catch {host.dataset.unavailable='true';return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.setClearColor(0,0);
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;
    host.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(0,0,6);
    const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();
    const geometry=foldedRing();const material=new THREE.MeshStandardMaterial({color:0x737976,metalness:1,roughness:.27});
    const mesh=new THREE.Mesh(geometry,material);scene.add(mesh);
    const key=new THREE.DirectionalLight(0xffffff,3.5);key.position.set(-3,5,4);scene.add(key);
    const fill=new THREE.DirectionalLight(0xfff2de,1);fill.position.set(4,-2,2);scene.add(fill);
    const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};
    const ro=new ResizeObserver(resize);ro.observe(host);resize();
    let frame=0;
    const draw=()=>{
      const s=stateAt(clock.current);
      camera.setFocalLength(s.focal);camera.updateProjectionMatrix();
      mesh.rotation.set(.3+s.drift*.17,-.44+s.lens*.14+s.drift*.13,-.29+s.drift*.08);
      const size=.57*lerp(.88,1,s.enter)*(1+s.drift*.17)*(1-s.outro*.36);
      mesh.scale.set(size,size*(1-s.drift*.055),size);
      mesh.position.set(s.drift*.22+s.outro*.65,s.drift*.13+s.outro*.08,0);
      key.position.x=-3+s.drift*5;key.intensity=3.5-s.drift*1.5;
      fill.intensity=1+s.drift*1.9;material.roughness=.27+s.drift*.1;
      renderer.render(scene,camera);frame=requestAnimationFrame(draw);
    };draw();
    return()=>{cancelAnimationFrame(frame);ro.disconnect();geometry.dispose();material.dispose();env.dispose();pmrem.dispose();renderer.dispose();host.replaceChildren();};
  },[]);
  return <div className="sculpture" ref={mount}><span className="webgl-fallback">WebGL is required to render the live sculpture.</span></div>;
}
