"use client";

import { useCallback, useEffect, useRef } from "react";

type Point = { x:number; y:number };
const mix=(a:Point,b:Point,t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const ease=(t:number)=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);

// The same flexible spine drives a photographic skin mesh; the tip stays attached.
function spine(base:Point,tip:Point,lag:Point,curl:number):Point[] {
  const dx=tip.x-base.x,dy=tip.y-base.y,distance=Math.max(1,Math.hypot(dx,dy));
  const axis={x:dx/distance,y:dy/distance},normal={x:-axis.y,y:axis.x};
  const sway=Math.min(68,distance*.18)+(lag.x*normal.x+lag.y*normal.y)*.18;
  const c1={x:base.x+dx*.38+normal.x*sway,y:base.y+dy*.38+normal.y*sway};
  const reach=Math.min(130,distance*.26),hook=Math.min(32,distance*.13)*curl;
  const c2={x:tip.x-axis.x*reach+normal.x*(sway*.6+hook)-lag.x*.16,y:tip.y-axis.y*reach+normal.y*(sway*.6+hook)-lag.y*.16};
  const end={x:tip.x-axis.x*hook*.85+normal.x*hook*.8,y:tip.y-axis.y*hook*.85+normal.y*hook*.8};
  const bend={x:tip.x+axis.x*hook*.9+normal.x*hook*1.4,y:tip.y+axis.y*hook*.9+normal.y*hook*1.4};
  const points:Point[]=[];
  for(let i=0;i<=64;i++){
    const t=i/64;
    if(t<=.82){const u=t/.82,v=1-u;points.push({x:v*v*v*base.x+3*v*v*u*c1.x+3*v*u*u*c2.x+u*u*u*end.x,y:v*v*v*base.y+3*v*v*u*c1.y+3*v*u*u*c2.y+u*u*u*end.y});}
    else {const u=(t-.82)/.18,v=1-u;points.push({x:v*v*end.x+2*v*u*bend.x+u*u*tip.x,y:v*v*end.y+2*v*u*bend.y+u*u*tip.y});}
  }
  return points;
}

// Affine texture mapping on small triangles bends the actual skin and suckers.
function triangle(ctx:CanvasRenderingContext2D,image:HTMLImageElement,s:Point[],d:Point[]){
  const [a,b,c]=s,[p,q,r]=d,den=a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y);
  if(Math.abs(den)<.001)return;
  const coeff=(u:number,v:number,w:number)=>[
    (u*(b.y-c.y)+v*(c.y-a.y)+w*(a.y-b.y))/den,
    (u*(c.x-b.x)+v*(a.x-c.x)+w*(b.x-a.x))/den,
    (u*(b.x*c.y-c.x*b.y)+v*(c.x*a.y-a.x*c.y)+w*(a.x*b.y-b.x*a.y))/den
  ];
  const x=coeff(p.x,q.x,r.x),y=coeff(p.y,q.y,r.y);
  // Subpixel overlap hides raster seams without changing the surface opacity.
  const center={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3};
  const expand=(v:Point)=>{const len=Math.max(1,Math.hypot(v.x-center.x,v.y-center.y));return {x:v.x+(v.x-center.x)*.45/len,y:v.y+(v.y-center.y)*.45/len};};
  const [u,v,w]=d.map(expand);
  ctx.save();ctx.beginPath();ctx.moveTo(u.x,u.y);ctx.lineTo(v.x,v.y);ctx.lineTo(w.x,w.y);ctx.closePath();ctx.clip();
  ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(image,0,0);ctx.restore();
}

function drawSkin(ctx:CanvasRenderingContext2D,image:HTMLImageElement,points:Point[],distance:number){
  const height=Math.min(300,Math.max(170,distance*.52));
  const top:Point[]=[],bottom:Point[]=[];
  points.forEach((p,i)=>{
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],len=Math.max(.001,Math.hypot(b.x-a.x,b.y-a.y));
    const nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
    top.push({x:p.x-nx*height*.51,y:p.y-ny*height*.51});bottom.push({x:p.x+nx*height*.49,y:p.y+ny*height*.49});
  });
  for(let i=0;i<points.length-1;i++){
    const x0=image.naturalWidth*i/(points.length-1),x1=image.naturalWidth*(i+1)/(points.length-1),h=image.naturalHeight;
    triangle(ctx,image,[{x:x0,y:0},{x:x1,y:0},{x:x0,y:h}],[top[i],top[i+1],bottom[i]]);
    triangle(ctx,image,[{x:x1,y:0},{x:x1,y:h},{x:x0,y:h}],[top[i+1],bottom[i+1],bottom[i]]);
  }
}

export function useShadowHand(){
  const canvas=useRef<HTMLCanvasElement>(null);
  const suppressedUntil=useRef(0),holding=useRef(false);
  const suppressClick=useCallback(()=>holding.current||Date.now()<suppressedUntil.current,[]);
  useEffect(()=>{
    const node=canvas.current,host=node?.closest<HTMLElement>(".abyss-site");
    if(!node||!host)return;
    const ctx=node.getContext("2d");if(!ctx)return;
    const skin=new Image();skin.src="/reiko-assets/abyss/hand-material-v2.webp";
    let scale=1;
    function fit(){scale=Math.min(window.devicePixelRatio||1,2);node!.width=Math.round(window.innerWidth*scale);node!.height=Math.round(window.innerHeight*scale);}
    fit();
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
      const points=spine(base,currentTip,{x:target.x-follower.x,y:target.y-follower.y},curl);
      ctx!.setTransform(scale,0,0,scale,0,0);ctx!.clearRect(0,0,node!.width/scale,node!.height/scale);
      if(skin.complete&&skin.naturalWidth)drawSkin(ctx!,skin,points,Math.hypot(currentTip.x-base.x,currentTip.y-base.y));
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
      if(reduced.matches||!skin.complete||!skin.naturalWidth||!eligible(eventTarget))return;
      stop();suppressedUntil.current=0;source=kind;contact=id;origin={...point};target={...point};follower={...point};
      phase="armed";
      window.dispatchEvent(new Event("abyss-contact-start"));
      timer=setTimeout(()=>{
        timer=undefined;if(phase!=="armed")return;
        const w=window.innerWidth,h=window.innerHeight;
        base=[{x:-80,y:Math.min(h+35,point.y+100),d:point.x},{x:w+80,y:Math.min(h+35,point.y+100),d:w-point.x},{x:point.x-80,y:-80,d:point.y},{x:point.x+80,y:h+80,d:h-point.y}].sort((a,b)=>a.d-b.d)[0];
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
    return ()=>{stop();host.removeEventListener("touchstart",touchStart);window.removeEventListener("touchmove",touchMove);window.removeEventListener("touchend",touchEnd);window.removeEventListener("touchcancel",release);host.removeEventListener("mousedown",mouseDown);window.removeEventListener("mousemove",mouseMove);window.removeEventListener("mouseup",mouseUp);host.removeEventListener("contextmenu",context);window.removeEventListener("resize",stop);window.removeEventListener("blur",stop);window.removeEventListener("keydown",key);document.removeEventListener("visibilitychange",hide);reduced.removeEventListener("change",stop);};
  },[]);
  return {suppressClick,overlay:<canvas ref={canvas} className="abyss-shadow-hand" data-phase="idle" aria-hidden="true"/>};
}
