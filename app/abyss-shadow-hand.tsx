"use client";

import { useCallback, useEffect, useRef } from "react";

type Point = { x:number; y:number };
const mix=(a:Point,b:Point,t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const ease=(t:number)=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
// 伸到指尖时带一点冲劲，再往回收一点点
const reach=(t:number)=>{const k=Math.max(0,Math.min(1,t))-1,c=1.15;return 1+(c+1)*k*k*k+c*k*k;};

export function useShadowHand(motion=true){
  const canvas=useRef<HTMLCanvasElement>(null);
  const suppressedUntil=useRef(0),holding=useRef(false);
  const suppressClick=useCallback(()=>holding.current||Date.now()<suppressedUntil.current,[]);
  useEffect(()=>{
    const node=canvas.current,host=node?.closest<HTMLElement>(".abyss-site");
    if(!node||!host)return;
    let engine:Awaited<ReturnType<typeof import("./abyss-hand-3d").createHand3D>>|undefined;
    let disposed=false;
    suppressedUntil.current=0;
    function fit(){engine?.resize(window.innerWidth,window.innerHeight);}
    let phase:"idle"|"armed"|"holding"|"releasing"="idle";
    let timer:ReturnType<typeof setTimeout>|undefined,frame=0,last=0,started=0,released=0,lastTouch=0;
    let pressedAt=0,viewportWidth=window.innerWidth;
    let contact:number|null=null,source:"touch"|"mouse"|null=null;
    let origin:Point={x:0,y:0},target:Point={x:0,y:0},base:Point={x:0,y:0},follower:Point={x:0,y:0},releaseTip:Point={x:0,y:0},currentTip:Point={x:0,y:0};
    if(motion){
      (async()=>{
        try{
          // A rendered Blender pose is predictable on phones and embedded browsers.
          if(matchMedia('(any-pointer: coarse)').matches){
            const {createHandFrames}=await import("./abyss-hand-frames");if(disposed)return;
            engine=await createHandFrames(node);node.dataset.renderer="blender-frames";
          }else{
            try{const {createHand3D}=await import("./abyss-hand-3d");if(disposed)return;engine=await createHand3D(node);node.dataset.renderer="webgl-3d";}
            catch{if(disposed)return;const {createHandFrames}=await import("./abyss-hand-frames");engine=await createHandFrames(node);node.dataset.renderer="blender-frames";}
          }
          if(disposed){engine?.dispose();return;}fit();
          // Do not lose a hold that started while the atlas was decoding.
          resumeIfPressed();
        }catch{node.dataset.renderer="unavailable";}
      })();
    }
    function resumeIfPressed(){if(phase==="armed"&&Date.now()-pressedAt>=120)activate();}
    function stop(){
      if(timer)clearTimeout(timer);timer=undefined;window.cancelAnimationFrame(frame);frame=0;
      phase="idle";holding.current=false;source=null;contact=null;
      node!.style.opacity="0";node!.dataset.phase="idle";delete host!.dataset.handHeld;
    }
    function paint(now:number){
      frame=0;if(phase!=="holding"&&phase!=="releasing")return;
      const dt=Math.min(.05,Math.max(0,(now-(last||now))/1000));last=now;
      follower=mix(follower,target,1-Math.exp(-dt/.18));
      const entrance=ease((now-started)/460);
      let curl=ease((entrance-.55)/.45),opacity=entrance;
      if(phase==="holding")currentTip=mix(base,target,reach((now-started)/520));
      else {const t=Math.max(0,(now-released-90)/620);if(t>=1){stop();return;}const out=ease(t);currentTip=mix(releaseTip,base,out);curl*=1-Math.min(1,t*3);opacity=(1-out)*.92;}
      engine?.paint(base,currentTip,{x:target.x-follower.x,y:target.y-follower.y},curl);
      node!.style.opacity=String(opacity);frame=requestAnimationFrame(paint);
    }
    function release(){
      if(timer)clearTimeout(timer);timer=undefined;
      if(phase==="holding"){
        suppressedUntil.current=Date.now()+850;holding.current=false;delete host!.dataset.handHeld;
        releaseTip={...currentTip};released=performance.now();phase="releasing";node!.dataset.phase="releasing";
        if(!frame)frame=requestAnimationFrame(paint);
      }else if(phase==="armed")stop();
      source=null;contact=null;
    }
    function eligible(target:EventTarget|null){
      return target instanceof Element&&!target.closest("dialog,form,input,textarea,select,[contenteditable=true],a[target=_blank],button:not([data-jelly])")&&!window.getSelection()?.toString();
    }
    function begin(point:Point,kind:"touch"|"mouse",id:number|null,eventTarget:EventTarget|null){
      if(!motion||!eligible(eventTarget))return;
      stop();suppressedUntil.current=0;source=kind;contact=id;origin={...point};target={...point};follower={...point};
      phase="armed";node!.dataset.input=kind;
      window.dispatchEvent(new Event("abyss-contact-start"));
      pressedAt=Date.now();timer=setTimeout(activate,120);
    }
    function activate(){
      timer=undefined;if(phase!=="armed"||!engine)return;
      const w=window.innerWidth;
      base={x:origin.x<=w/2?-65:w+65,y:origin.y};node!.dataset.side=origin.x<=w/2?"left":"right";
      currentTip={...base};phase="holding";holding.current=true;host!.dataset.handHeld="true";node!.dataset.phase="holding";
      started=performance.now();last=started;fit();frame=requestAnimationFrame(paint);
    }
    function move(point:Point){
      if(phase==="armed"){
        target=point;
        // Scrolling is part of this gesture: keep passive native touch scrolling.
        if(Math.hypot(point.x-origin.x,point.y-origin.y)>=9){if(timer)clearTimeout(timer);activate();}
      }else if(phase==="holding")target=point;
    }
    function resize(){
      if(window.innerWidth!==viewportWidth){viewportWidth=window.innerWidth;stop();}
      // Browser chrome can change height during a mobile scroll; keep holding.
      fit();
    }

    function touchStart(e:TouchEvent){
      lastTouch=Date.now();if(e.touches.length!==1){release();return;}
      const p=e.touches[0];begin({x:p.clientX,y:p.clientY},"touch",p.identifier,e.target);
    }
    function touchMove(e:TouchEvent){
      if(source!=="touch")return;if(e.touches.length!==1){release();return;}
      const p=Array.from(e.touches).find(p=>p.identifier===contact);if(p)move({x:p.clientX,y:p.clientY});else release();
    }
    function touchEnd(e:TouchEvent){lastTouch=Date.now();if(source==="touch"&&Array.from(e.changedTouches).some(p=>p.identifier===contact))release();}
    function mouseDown(e:MouseEvent){if(e.button===0&&Date.now()-lastTouch>850)begin({x:e.clientX,y:e.clientY},"mouse",null,e.target);}
    function mouseMove(e:MouseEvent){if(source==="mouse"){if(!(e.buttons&1)){release();return;}move({x:e.clientX,y:e.clientY});}}
    function mouseUp(){if(source==="mouse")release();}
    function context(e:Event){if(phase==="holding")e.preventDefault();}
    function hide(){if(document.hidden)stop();}
    function key(e:KeyboardEvent){if(e.key==="Escape")stop();}
    const passive={passive:true};
    host.addEventListener("touchstart",touchStart,passive);window.addEventListener("touchmove",touchMove,passive);window.addEventListener("touchend",touchEnd,passive);window.addEventListener("touchcancel",release,passive);
    host.addEventListener("mousedown",mouseDown);window.addEventListener("mousemove",mouseMove);window.addEventListener("mouseup",mouseUp);
    host.addEventListener("contextmenu",context);window.addEventListener("resize",resize);window.addEventListener("blur",stop);window.addEventListener("keydown",key);document.addEventListener("visibilitychange",hide);
    return ()=>{disposed=true;stop();engine?.dispose();host.removeEventListener("touchstart",touchStart);window.removeEventListener("touchmove",touchMove);window.removeEventListener("touchend",touchEnd);window.removeEventListener("touchcancel",release);host.removeEventListener("mousedown",mouseDown);window.removeEventListener("mousemove",mouseMove);window.removeEventListener("mouseup",mouseUp);host.removeEventListener("contextmenu",context);window.removeEventListener("resize",resize);window.removeEventListener("blur",stop);window.removeEventListener("keydown",key);document.removeEventListener("visibilitychange",hide);};
  },[motion]);
  return {suppressClick,overlay:<canvas ref={canvas} className="abyss-shadow-hand" data-phase="idle" aria-hidden="true"/>};
}
