"use client";

import {useEffect,useRef} from 'react';
import {seaMotionEnabled} from './abyss-motion';

let runner:((action:()=>void)=>void)|null=null;
let pending:(()=>void)|null=null;
export function runAbyssTransition(action:()=>void){
 if(runner){runner(action);return;}
 pending=action;
 setTimeout(()=>{if(pending===action&&!runner){pending=null;action();}},600);
}
const COVER=690,REVEAL=1050,END=2350;
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};

export default function AbyssTransition(){
 const wrap=useRef<HTMLDivElement>(null),cv=useRef<HTMLCanvasElement>(null),signature=useRef<HTMLDivElement>(null),depth=useRef<HTMLSpanElement>(null);
 const skip=useRef<()=>void>(()=>{});
 useEffect(()=>{
  const host=wrap.current,canvas=cv.current,ctx=canvas?.getContext('2d'),brand=signature.current,label=depth.current;
  if(!host||!canvas||!ctx||!brand||!label)return;
  let raf=0,busy=false,swapped=false,current:(()=>void)|null=null;
  let oldOverflow='',previous:HTMLElement|null=null;
  function swap(){if(swapped)return;swapped=true;const action=current;current=null;action?.();}
  function clean(){
   cancelAnimationFrame(raf);raf=0;host!.hidden=true;host!.style.opacity='1';host!.style.backdropFilter='';canvas!.style.opacity='1';brand!.style.opacity='0';label!.textContent='';
   if(busy){document.body.style.overflow=oldOverflow;if(previous?.isConnected)previous.focus({preventScroll:true});}
   busy=false;ctx!.clearRect(0,0,canvas!.width,canvas!.height);
  }
  function finish(){try{swap();}finally{clean();}}
  skip.current=finish;
  function play(action:()=>void){
   if(!seaMotionEnabled()){action();return;}
   if(busy){if(swapped)action();else current=action;return;}
   busy=true;swapped=false;current=action;oldOverflow=document.body.style.overflow;previous=document.activeElement as HTMLElement|null;
   document.body.style.overflow='hidden';
   const w=window.innerWidth,h=window.innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);
   canvas!.width=Math.round(w*dpr);canvas!.height=Math.round(h*dpr);host!.hidden=false;
   host!.dataset.phase='surface';host!.focus({preventScroll:true});
   // Start fetching the actual chapel plate while it is hidden under the water.
   const plate=new Image();plate.src='/reiko-assets/abyss/reference-plate.webp';
   const bubbles=Array.from({length:w<600?29:44},(_,i)=>({x:(i*.61803398875%1)*w,y:h+20+(i%7)*h*.12,r:(i%3===0?3.4:1.2)+(i%5)*.75,speed:170+(i%6)*48,phase:i*2.39}));
   const motes=Array.from({length:36},(_,i)=>({x:(i*.754877666%1)*w,y:(i*.56984029%1)*h,r:.45+(i%3)*.35}));
   const start=performance.now();
   function frame(now:number){
    const t=now-start,seconds=t/1000,cover=smooth(t/COVER),reveal=smooth((t-REVEAL)/(END-REVEAL));
    if(t>=COVER&&!swapped){host!.dataset.phase='submerged';swap();}
    if(t>=REVEAL)host!.dataset.phase='revealing';
    ctx!.setTransform(dpr,0,0,dpr,0,0);ctx!.clearRect(0,0,w,h);
    const level=-90+(h+180)*cover;
    const water=ctx!.createLinearGradient(0,0,0,Math.max(1,h));water.addColorStop(0,'#04111d');water.addColorStop(.42,'#0a2537');water.addColorStop(1,'#102e3c');
    function surface(){
     ctx!.beginPath();ctx!.moveTo(-10,-10);
     for(let x=-10;x<=w+14;x+=12){const wave=Math.sin(x/w*8+seconds*1.7)*9+Math.sin(x/w*17-seconds*1.3)*3;ctx!.lineTo(x,level+wave);}
     ctx!.lineTo(w+14,-10);ctx!.closePath();
    }
    surface();ctx!.fillStyle=water;ctx!.fill();ctx!.save();ctx!.clip();
    // Unequal, softly converging shafts give the water depth, with no iris wipe.
    const origin=w*(.48+Math.sin(seconds*.3)*.025);
    for(let i=0;i<8;i++){
     const spread=(i-3.5)*w*.16+Math.sin(seconds*.8+i)*w*.018;
     for(let layer=0;layer<9;layer++){
      const band=1-layer*.1;
      const light=ctx!.createLinearGradient(0,0,0,h);light.addColorStop(0,`rgba(179,220,235,${.016-Math.abs(i-3.5)*.0016})`);light.addColorStop(.6,'rgba(102,178,207,.002)');light.addColorStop(1,'rgba(60,123,153,0)');
      ctx!.fillStyle=light;ctx!.beginPath();ctx!.moveTo(origin-16*band,-80);ctx!.lineTo(origin+18*band,-80);ctx!.lineTo(origin+spread+w*.09*band,h);ctx!.lineTo(origin+spread-w*.085*band,h);ctx!.closePath();ctx!.fill();
     }
    }
    const bloom=ctx!.createRadialGradient(w*.5,h*.1,1,w*.5,h*.1,w*.75);bloom.addColorStop(0,'rgba(119,186,208,.12)');bloom.addColorStop(1,'rgba(50,107,133,0)');ctx!.fillStyle=bloom;ctx!.fillRect(0,0,w,h);
    // Refraction near the passing surface, intentionally irregular and faint.
    for(let k=0;k<5;k++){
     ctx!.beginPath();for(let x=-10;x<=w+14;x+=12){const y=level-10-k*13+Math.sin(x/w*(8+k)+seconds*1.5+k)*6;if(x===-10)ctx!.moveTo(x,y);else ctx!.lineTo(x,y);}
     ctx!.strokeStyle=`rgba(189,226,235,${.15-k*.024})`;ctx!.lineWidth=1.4;ctx!.stroke();
    }
    for(const b of bubbles){
     const y=b.y-b.speed*Math.max(0,seconds-.28),x=b.x+Math.sin(seconds*1.1+b.phase)*6;
     if(y< -15||y>h+15)continue;
     const alpha=.22*(1-reveal*.65);
     ctx!.beginPath();ctx!.ellipse(x,y,b.r,b.r*1.12,0,0,Math.PI*2);ctx!.fillStyle=`rgba(127,193,215,${alpha*.18})`;ctx!.fill();ctx!.strokeStyle=`rgba(197,226,236,${alpha})`;ctx!.lineWidth=.7;ctx!.stroke();
     ctx!.beginPath();ctx!.arc(x-b.r*.23,y-b.r*.18,b.r*.58,Math.PI,Math.PI*1.5);ctx!.strokeStyle=`rgba(228,242,246,${alpha*.8})`;ctx!.stroke();
    }
    for(const m of motes){ctx!.fillStyle='rgba(196,222,232,.14)';ctx!.beginPath();ctx!.arc(m.x+Math.sin(seconds*.6+m.y)*3,(m.y-seconds*17+h)%h,m.r,0,Math.PI*2);ctx!.fill();}
    ctx!.restore();
    canvas!.style.opacity=String(1-reveal);
    const brandIn=smooth((t-380)/340),brandOut=1-smooth((t-1320)/480);
    brand!.style.opacity=String(brandIn*brandOut);brand!.style.transform=`translate(-50%,-50%) translateY(${reveal*10}px)`;
    label!.textContent=`−${Math.round(200*smooth((t-300)/900))} m`;
    if(t<END)raf=requestAnimationFrame(frame);else finish();
   }
   raf=requestAnimationFrame(frame);
  }
  function key(event:KeyboardEvent){if(busy&&event.key==='Escape'){event.preventDefault();finish();}}
  function visibility(){if(document.hidden&&busy)finish();}
  window.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);
  runner=play;if(pending){const queued=pending;pending=null;play(queued);}
  return()=>{if(runner===play)runner=null;clean();window.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 return <div ref={wrap} className='abyss-transition' hidden tabIndex={-1} aria-label='深海下潜转场'>
  <canvas ref={cv} aria-hidden='true'/>
  <div ref={signature} className='abyss-transition-signature' aria-hidden='true'>
   <img src='/reiko-assets/abyss/reiko-lettering.webp' width='2172' height='724' alt=''/>
   <span className='abyss-transition-rule'/><span ref={depth} className='abyss-transition-depth'/>
  </div>
  <button type='button' className='abyss-transition-skip' onClick={()=>skip.current()}>跳过</button>
 </div>;
}
