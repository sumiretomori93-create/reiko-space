"use client";

import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useRef, useState } from "react";

type Visit = { id:number; x:number; y:number; fromX:number; fromY:number; bendX:number; bendY:number; duration:number; angle:number };

export function useJellyClick(suppressClick:(()=>boolean)|undefined,motion=true) {
  const [visit,setVisit] = useState<Visit|null>(null);
  const [arrived,setArrived] = useState(false);
  const pending = useRef<ReturnType<typeof setTimeout>|null>(null);
  const fading = useRef<ReturnType<typeof setTimeout>|null>(null);
  const serial = useRef(0);
  const replaying=useRef(false);
  const pointer=useRef({time:0,x:0,y:0});
  const cancel = useCallback(() => {
    if(pending.current) clearTimeout(pending.current);
    if(fading.current) clearTimeout(fading.current);
    pending.current=null; fading.current=null;
    setVisit(null); setArrived(false);
  },[]);
  useEffect(()=>{
    let width=window.innerWidth;
    const pointerUp=(event:PointerEvent)=>{pointer.current={time:Date.now(),x:event.clientX,y:event.clientY};};
    const touchEnd=(event:TouchEvent)=>{const p=event.changedTouches[0];if(p)pointer.current={time:Date.now(),x:p.clientX,y:p.clientY};};
    const resized=()=>{if(window.innerWidth!==width){width=window.innerWidth;cancel();}};
    window.addEventListener("pointerup",pointerUp,{passive:true});window.addEventListener("touchend",touchEnd,{passive:true});
    const hide=()=>{if(document.hidden)cancel();};
    const escape=(event:KeyboardEvent)=>{if(event.key==="Enter"||event.key===" ")pointer.current.time=0;if(event.key==="Escape")cancel();};
    window.addEventListener("scroll",cancel,{passive:true});
    window.addEventListener("resize",resized);
    window.addEventListener("keydown",escape);
    document.addEventListener("visibilitychange",hide);
    window.addEventListener("abyss-contact-start",cancel);
    return ()=>{if(pending.current)clearTimeout(pending.current);if(fading.current)clearTimeout(fading.current);window.removeEventListener("scroll",cancel);window.removeEventListener("resize",resized);window.removeEventListener("pointerup",pointerUp);window.removeEventListener("touchend",touchEnd);window.removeEventListener("keydown",escape);document.removeEventListener("visibilitychange",hide);window.removeEventListener("abyss-contact-start",cancel);};
  },[cancel]);
  useEffect(()=>{if(!motion)cancel();},[motion,cancel]);
  const capture = useCallback((event:ReactMouseEvent<HTMLDivElement>)=>{
    if(replaying.current||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
    // Some mobile/switch browsers report a real tap with detail=0. Only a
    // zero-detail activation without a recent pointer is a keyboard click.
    const recentPointer=Date.now()-pointer.current.time<1000;
    if(event.detail===0&&!recentPointer)return;
    if(suppressClick?.()){event.preventDefault();event.stopPropagation();cancel();return;}
    const origin=event.target instanceof Element?event.target:null;
    if(!origin||origin.closest("dialog,form,input,textarea,select,[contenteditable=true]"))return;
    const control=origin.closest<HTMLElement>("a,button,[role=button]");
    if(control&&!control.hasAttribute("data-jelly"))return;
    if(control?.matches(":disabled,[aria-disabled=true]"))return;
    if(!motion)return;
    if(control){event.preventDefault();event.stopPropagation();}
    cancel();
    const x=event.clientX||pointer.current.x,y=event.clientY||pointer.current.y,w=window.innerWidth,h=window.innerHeight;
    const edge=[{x:-75,y:Math.max(35,Math.min(h-35,y-110)),d:x},{x:w+75,y:Math.max(35,Math.min(h-35,y+90)),d:w-x},{x:Math.max(35,Math.min(w-35,x-100)),y:-75,d:y},{x:Math.max(35,Math.min(w-35,x+100)),y:h+75,d:h-y}].sort((a,b)=>a.d-b.d)[0];
    const dx=edge.x-x,dy=edge.y-y,distance=Math.hypot(dx,dy);
    const duration=1050;
    const id=++serial.current;
    setVisit({id,x,y,fromX:dx,fromY:dy,bendX:dx*.45+dy*.12,bendY:dy*.45-dx*.12,duration,angle:Math.atan2(-dy,-dx)*180/Math.PI+90});
    pending.current=setTimeout(()=>{
      pending.current=null;setArrived(true);
      // Explicit replay guard, independent of mobile browser click detail.
      if(control?.isConnected){replaying.current=true;try{control.focus({preventScroll:true});control.click();}finally{replaying.current=false;}}
      fading.current=setTimeout(()=>{setVisit(null);setArrived(false);fading.current=null;},550);
    },duration+70);
  },[cancel,suppressClick,motion]);
  return {capture,overlay:visit?<JellyVisit key={visit.id} visit={visit} arrived={arrived}/>:null};
}

function JellyVisit({visit,arrived}:{visit:Visit;arrived:boolean}){
  return <div className={`abyss-click-visitor${arrived?" is-arrived":""}`} aria-hidden="true" style={{left:visit.x,top:visit.y,"--jelly-from-x":`${visit.fromX}px`,"--jelly-from-y":`${visit.fromY}px`,"--jelly-bend-x":`${visit.bendX}px`,"--jelly-bend-y":`${visit.bendY}px`,"--jelly-duration":`${visit.duration}ms`,"--jelly-angle":`${visit.angle}deg`} as React.CSSProperties}>
    <div className="abyss-click-swimmer"><svg viewBox="0 0 100 140" className="abyss-click-jelly">
      <defs><radialGradient id={`click-bell-${visit.id}`} cx="45%" cy="25%" r="80%"><stop stopColor="#e5e9ff" stopOpacity=".66"/><stop offset=".45" stopColor="#b1bde9" stopOpacity=".18"/><stop offset="1" stopColor="#9ca7da" stopOpacity=".03"/></radialGradient></defs>
      <g className="abyss-click-bell"><path d="M17 54C17 9 83 9 83 54Q76 62 68 55Q59 65 50 57Q40 65 31 55Q23 62 17 54Z" fill={`url(#click-bell-${visit.id})`} stroke="#d5dcf2" strokeOpacity=".75" strokeWidth=".8"/><path d="M50 20Q35 30 31 55M50 20Q65 30 68 55M50 20V57M18 51Q50 39 82 51" fill="none" stroke="#d5ddf1" strokeOpacity=".37" strokeWidth=".7"/><ellipse cx="50" cy="49" rx="19" ry="5" fill="#c5cef4" fillOpacity=".1"/></g>
      <g className="abyss-click-threads" fill="none" stroke="#c9d4f0" strokeOpacity=".58" strokeWidth=".8"><path d="M30 55C18 80 47 90 28 125"/><path d="M42 58C52 82 24 100 47 133"/><path d="M54 58C38 80 75 104 55 130"/><path d="M67 55C82 80 52 96 78 119"/><path d="M49 58C64 83 39 96 61 115" strokeWidth="2" strokeOpacity=".22"/></g>
    </svg></div><span className="abyss-click-ripple"/>
  </div>;
}
