"use client";

import { useCallback, useEffect, useRef } from "react";

type Point = { x:number; y:number };
const mix=(a:Point,b:Point,t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const ease=(t:number)=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);

export function useShadowHand(){
  const canvas=useRef<HTMLCanvasElement>(null);
  const suppressedUntil=useRef(0),holding=useRef(false);
  const suppressClick=useCallback(()=>holding.current||Date.now()<suppressedUntil.current,[]);
  useEffect(()=>{
    const node=canvas.current,host=node?.closest<HTMLElement>(".abyss-site");
    if(!node||!host)return;
    let engine:Awaited<ReturnType<typeof import("./abyss-hand-3d").createHand3D>>|undefined;
    let disposed=false;
    function fit(){engine?.resize(window.innerWidth,window.innerHeight);}
    if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      (async()=>{
        try{
          const {createHand3D}=await import("./abyss-hand-3d");if(disposed)return;
          const ready=await createHand3D(node);if(disposed){ready.dispose();return;}
          engine=ready;node.dataset.renderer="webgl-3d";
        }catch{
          if(disposed)return;
          try{
            const {createHandFrames}=await import("./abyss-hand-frames");if(disposed)return;
            const ready=await createHandFrames(node);if(disposed){ready.dispose();return;}
            engine=ready;node.dataset.renderer="blender-frames";
          }catch{node.dataset.renderer="unavailable";}
        }
        if(!disposed)fit();
      })();
    }
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    let phase:"idle"|"armed"|"holding"|"releasing"="idle";
    let timer:ReturnType<typeof setTimeout>|undefined,frame=0,last=0,started=0,released=0,lastTouch=0;
    let contact:number|null=null,source:"touch"|"mouse"|null=null;
    let origin:Point={x:0,y:0},target:Point={x:0,y:0},base:Point={x:0,y:0},follower:Point={x:0,y:0},releaseTip:Point={x:0,y:0},currentTip:Point={x:0,y:0};
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
      if(phase==="holding")currentTip=mix(base,target,entrance);
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
      if(reduced.matches||!engine||!eligible(eventTarget))return;
      stop();suppressedUntil.current=0;source=kind;contact=id;origin={...point};target={...point};follower={...point};
      phase="armed";
      window.dispatchEvent(new Event("abyss-contact-start"));
      timer=setTimeout(()=>{
        timer=undefined;if(phase!=="armed")return;
        const w=window.innerWidth;
        // Always enter horizontally; keep the chosen side through the whole hold.
        base={x:point.x<=w/2?-90:w+90,y:point.y};
        node!.dataset.side=point.x<=w/2?"left":"right";
        currentTip={...base};phase="holding";holding.current=true;host!.dataset.handHeld="true";node!.dataset.phase="holding";
        started=performance.now();last=started;fit();frame=requestAnimationFrame(paint);
      },200);
    }
    function move(point:Point){
      if(phase==="armed"&&Math.hypot(point.x-origin.x,point.y-origin.y)>12){stop();return;}
      if(phase==="holding")target=point;
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
    host.addEventListener("contextmenu",context);window.addEventListener("resize",stop);window.addEventListener("blur",stop);window.addEventListener("keydown",key);document.addEventListener("visibilitychange",hide);reduced.addEventListener("change",stop);
    return ()=>{disposed=true;stop();engine?.dispose();host.removeEventListener("touchstart",touchStart);window.removeEventListener("touchmove",touchMove);window.removeEventListener("touchend",touchEnd);window.removeEventListener("touchcancel",release);host.removeEventListener("mousedown",mouseDown);window.removeEventListener("mousemove",mouseMove);window.removeEventListener("mouseup",mouseUp);host.removeEventListener("contextmenu",context);window.removeEventListener("resize",stop);window.removeEventListener("blur",stop);window.removeEventListener("keydown",key);document.removeEventListener("visibilitychange",hide);reduced.removeEventListener("change",stop);};
  },[]);
  return {suppressClick,overlay:<canvas ref={canvas} className="abyss-shadow-hand" data-phase="idle" aria-hidden="true"/>};
}
