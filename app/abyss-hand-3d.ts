import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type Point={x:number;y:number};
export async function createHand3D(canvas:HTMLCanvasElement){
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
  renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,1,2000);camera.position.z=1000;
  scene.add(new THREE.HemisphereLight(0xa9c5dd,0x091625,2.3));
  const key=new THREE.DirectionalLight(0xb9d8ef,3.3);key.position.set(-280,400,650);scene.add(key);
  const rim=new THREE.DirectionalLight(0x74649e,1.9);rim.position.set(300,-50,300);scene.add(rim);
  const uniforms={uP0:{value:new THREE.Vector2()},uP1:{value:new THREE.Vector2()},uP2:{value:new THREE.Vector2()},uP3:{value:new THREE.Vector2()},uWidth:{value:35}};
  const declaration=`
    uniform vec2 uP0,uP1,uP2,uP3;
    uniform float uWidth;
    varying float vArmT;
    vec2 armPoint(float t){float v=1.-t;return v*v*v*uP0+3.*v*v*t*uP1+3.*v*t*t*uP2+t*t*t*uP3;}
    vec2 armTangent(float t){float v=1.-t;vec2 d=3.*v*v*(uP1-uP0)+6.*v*t*(uP2-uP1)+3.*t*t*(uP3-uP2);return normalize(d+vec2(.00001));}
  `;
  let model:THREE.Group;
  try{model=(await new GLTFLoader().loadAsync('/reiko-assets/abyss/hand-3d/reiko-arm.glb')).scene;}
  catch(error){renderer.dispose();renderer.forceContextLoss();throw error;}
  model.traverse(object=>{
    if(!(object instanceof THREE.Mesh))return;
    object.frustumCulled=false;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    for(const material of materials){
      const m=material as THREE.MeshStandardMaterial;
      m.roughness=m.name.includes('bowl')?.48:.42;m.metalness=0;m.transparent=true;m.depthWrite=true;
      m.onBeforeCompile=shader=>{
        Object.assign(shader.uniforms,uniforms);
        shader.vertexShader=declaration+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
          float nt=clamp(position.x/10.,0.,1.);
          vec2 tangent=armTangent(nt);
          objectNormal.xy=mat2(tangent.x,tangent.y,-tangent.y,tangent.x)*objectNormal.xy;
        `);
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
          float t=clamp(position.x/10.,0.,1.);vArmT=t;
          vec2 tangentPosition=armTangent(t),n=vec2(-tangentPosition.y,tangentPosition.x);
          vec2 center=armPoint(t);
          vec3 transformed=vec3(center+n*position.y*uWidth,position.z*uWidth);
        `);
        shader.fragmentShader='varying float vArmT;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
          gl_FragColor.a*=.22+.78*smoothstep(0.,.55,vArmT);
        `);
      };
      m.customProgramCacheKey=()=>"abyss-living-arm-v1";
    }
  });
  scene.add(model);
  let width=1,height=1;
  function resize(w:number,h:number){width=w;height=h;renderer.setSize(w,h,false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
  function paint(base:Point,tip:Point,lag:Point,curl:number){
    const p0=uniforms.uP0.value.set(base.x-width/2,height/2-base.y),p3=uniforms.uP3.value.set(tip.x-width/2,height/2-tip.y);
    const dx=p3.x-p0.x,dy=p3.y-p0.y,length=Math.max(1,Math.hypot(dx,dy)),side=dx>=0?1:-1;
    const sway=Math.min(16,length*.04)+lag.y*.08;
    uniforms.uP1.value.set(p0.x+dx*.4,p0.y);
    uniforms.uP2.value.set(p3.x-side*Math.min(130,length*.24),p3.y-sway-curl*14);
    uniforms.uWidth.value=Math.min(42,Math.max(27,length*.065));
    renderer.render(scene,camera);
  }
  function dispose(){
    const seen=new Set<THREE.Material>();model.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])seen.add(m);}});
    for(const m of seen)m.dispose();renderer.dispose();renderer.forceContextLoss();
  }
  return {resize,paint,dispose};
}
