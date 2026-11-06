"use client";
import {useEffect,useRef} from 'react';

// Light moves over the scene, not the text: no screen distortion or layout shift.
export default function SeaAtmosphere({motion}:{motion:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current,ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;
  let w=1,h=1,dpr=1,raf=0,last=0,time=0,visible=!document.hidden;
  function size(){w=window.innerWidth;h=window.innerHeight;dpr=Math.min(devicePixelRatio||1,1.4);canvas!.width=Math.round(w*dpr);canvas!.height=Math.round(h*dpr);}
  function paint(now:number){
   raf=0;if(!visible)return;
   if(motion&&now-last<38){raf=requestAnimationFrame(paint);return;}
   time+=Math.min(.08,(now-(last||now))/1000);last=now;
   ctx!.setTransform(dpr,0,0,dpr,0,0);ctx!.clearRect(0,0,w,h);
   const main=document.querySelector<HTMLElement>('.abyss-site>main');
   const mainY=main?.getBoundingClientRect().top??h;
   const descent=Number(document.querySelector<HTMLElement>('.abyss-site')?.style.getPropertyValue('--ab-descent')||0);
   const strength=Math.max(.22,1-descent*.85);
   const sourceY=Math.min(-h*.22,mainY-90),sourceX=w*(.5+Math.sin(time*.17)*.035);
   // Broad uneven shafts, fading through water rather than flat blue fill.
   for(let i=0;i<7;i++){
    const drift=Math.sin(time*.3+i*1.7)*w*.025,spread=(i-3)*w*.2;
    const g=ctx!.createLinearGradient(0,Math.max(0,sourceY),0,h);
    g.addColorStop(0,`rgba(181,223,241,${(.085-Math.abs(i-3)*.012)*strength})`);g.addColorStop(.6,`rgba(129,194,222,${.022*strength})`);g.addColorStop(1,'rgba(89,155,189,0)');
    ctx!.fillStyle=g;ctx!.beginPath();ctx!.moveTo(sourceX-10,sourceY);ctx!.lineTo(sourceX+16,sourceY);ctx!.lineTo(sourceX+spread+drift+w*.09,h);ctx!.lineTo(sourceX+spread+drift-w*.06,h);ctx!.closePath();ctx!.fill();
   }
   // Looking up: rippling broad ellipses near the upper edge of the lower scene.
   if(mainY<h&&mainY>-h*1.6){
    const sy=mainY+30;
    const glow=ctx!.createRadialGradient(w*.5,sy,10,w*.5,sy,w*.8);glow.addColorStop(0,'rgba(174,221,235,.17)');glow.addColorStop(.5,'rgba(80,155,180,.065)');glow.addColorStop(1,'rgba(20,84,116,0)');ctx!.fillStyle=glow;ctx!.fillRect(0,Math.max(0,mainY),w,h);
    ctx!.save();ctx!.beginPath();ctx!.rect(0,Math.max(0,mainY),w,h);ctx!.clip();
    for(let k=0;k<9;k++){
     ctx!.beginPath();for(let x=-24;x<w+24;x+=10){
      const y=sy+12+k*15+Math.sin(x/w*(5+k*.35)+time*.38+k*.9)*7+Math.sin(x/w*15-time*.23+k)*3;
      if(x===-24)ctx!.moveTo(x,y);else ctx!.lineTo(x,y);
     }
     ctx!.strokeStyle=`rgba(178,222,233,${.055-k*.0045})`;ctx!.lineWidth=1.8;ctx!.stroke();
    }ctx!.restore();
   }
   // Refracted highlights: a few drifting irregular bands, kept very quiet.
   for(let band=0;band<3;band++){
    ctx!.beginPath();for(let x=-30;x<w+30;x+=14){const y=h*(.17+band*.29)+Math.sin(x/w*7+time*.36+band)*30+Math.sin(x/w*14-time*.25)*9;if(x===-30)ctx!.moveTo(x,y);else ctx!.lineTo(x,y);}
    ctx!.strokeStyle=`rgba(151,211,227,${.022*strength})`;ctx!.lineWidth=8;ctx!.stroke();
   }
   if(motion)raf=requestAnimationFrame(paint);
  }
  function resize(){size();if(!motion)paint(performance.now());}
  function visibility(){visible=!document.hidden;cancelAnimationFrame(raf);last=0;if(visible)raf=requestAnimationFrame(paint);}
  size();raf=requestAnimationFrame(paint);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);};
 },[motion]);
 return <canvas ref={ref} className='abyss-water-light' aria-hidden='true'/>;
}
