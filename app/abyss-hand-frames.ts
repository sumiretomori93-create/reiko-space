type Point={x:number;y:number};
// Compatibility frames are rendered from the SAME Blender mesh and lights.
// 手机上不再把整张图拉直贴过去：把胳膊切成细条，沿一条会弯的曲线逐条贴，
// 拖动时中段被拖弯，握住不动时在水里轻轻起伏。
const FRAME_W=1024,FRAME_H=384,COLS=8,FRAMES=24;
const ARM_START=FRAME_W*.8/11.6;           // 图里胳膊根部的位置
const ARM_LEN=FRAME_W*10/11.6;             // 图里从根部到指尖的长度
const U_MIN=-ARM_START/ARM_LEN;            // 根部之前那一小截
const U_MAX=(FRAME_W-ARM_START)/ARM_LEN;   // 指尖之后那一小截
const STRIPS=44;

function bezier(p0:Point,p1:Point,p2:Point,p3:Point,t:number):Point{
  const v=1-t;
  return {x:v*v*v*p0.x+3*v*v*t*p1.x+3*v*t*t*p2.x+t*t*t*p3.x,y:v*v*v*p0.y+3*v*v*t*p1.y+3*v*t*t*p2.y+t*t*t*p3.y};
}

export async function createHandFrames(canvas:HTMLCanvasElement){
  const image=new Image();image.src='/reiko-assets/abyss/hand-3d/contact-atlas.webp';await image.decode();
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('2D rendering unavailable');
  let width=1,height=1,dpr=1;
  const samples=64,pts:Point[]=new Array(samples+1),acc:number[]=new Array(samples+1);
  function resize(w:number,h:number){width=w;height=h;dpr=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}

  function paint(base:Point,tip:Point,lag:Point,curl:number){
    ctx!.setTransform(dpr,0,0,dpr,0,0);ctx!.clearRect(0,0,width,height);
    const dx=tip.x-base.x,dy=tip.y-base.y,straight=Math.hypot(dx,dy);if(straight<2)return;
    const side=dx>=0?1:-1,time=performance.now()/1000;

    // 曲线：从屏幕边水平伸进来，靠近指尖时微微下垂再托上来；拖动的滞后把中段往后拉
    const p1={x:base.x+side*straight*.42,y:base.y+Math.min(40,straight*.06)};
    const p2={x:tip.x-side*Math.min(150,straight*.3)-lag.x*.9,y:tip.y+Math.min(34,straight*.07)-lag.y*.9-curl*10};

    // 按弧长取点，贴图时宽度均匀
    for(let i=0;i<=samples;i++){pts[i]=bezier(base,p1,p2,tip,i/samples);acc[i]=i?acc[i-1]+Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y):0;}
    const total=acc[samples];
    function at(u:number){
      if(u<=0){const t0=pts[1],a=Math.atan2(t0.y-base.y,t0.x-base.x);return {x:base.x+Math.cos(a)*u*total,y:base.y+Math.sin(a)*u*total,a};}
      if(u>=1){const a=Math.atan2(tip.y-pts[samples-1].y,tip.x-pts[samples-1].x);const e=(u-1)*total;return {x:tip.x+Math.cos(a)*e,y:tip.y+Math.sin(a)*e,a};}
      const s=u*total;let i=1;while(i<samples&&acc[i]<s)i++;
      const k=(s-acc[i-1])/Math.max(.0001,acc[i]-acc[i-1]),a=pts[i-1],b=pts[i];
      return {x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k,a:Math.atan2(b.y-a.y,b.x-a.x)};
    }

    const frame=Math.round(Math.min(1,Math.max(0,curl))*(FRAMES-1)),sx0=(frame%COLS)*FRAME_W,sy=Math.floor(frame/COLS)*FRAME_H;
    const scale=total/ARM_LEN,srcStep=(U_MAX-U_MIN)*ARM_LEN/STRIPS;
    const amp=Math.min(7,straight*.02);
    for(let i=0;i<STRIPS;i++){
      const u0=U_MIN+(U_MAX-U_MIN)*i/STRIPS,um=u0+(U_MAX-U_MIN)*.5/STRIPS;
      const p=at(u0);
      // 水里的起伏：根部和指尖不动，中段轻轻摆
      const env=Math.max(0,Math.min(1,um))*(1-Math.max(0,Math.min(1,um)))*4;
      const wave=Math.sin(time*1.7-um*6.5)*amp*env;
      const nx=-Math.sin(p.a),ny=Math.cos(p.a);
      ctx!.save();
      ctx!.translate(p.x+nx*wave,p.y+ny*wave);ctx!.rotate(p.a);ctx!.scale(scale,scale);
      const sx=sx0+ARM_START+u0*ARM_LEN;
      const cx=Math.max(sx0,sx),cw=Math.min(sx0+FRAME_W,sx+srcStep+1.2)-cx;
      if(cw>0)ctx!.drawImage(image,cx,sy,cw,FRAME_H,cx-sx,-FRAME_H/2,cw,FRAME_H);
      ctx!.restore();
    }

    // 根部淡进水里
    ctx!.globalCompositeOperation='destination-in';
    const fade=ctx!.createLinearGradient(base.x,base.y,tip.x,tip.y);fade.addColorStop(0,'rgba(0,0,0,.22)');fade.addColorStop(.55,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,1)');
    ctx!.fillStyle=fade;ctx!.fillRect(0,0,width,height);ctx!.globalCompositeOperation='source-over';
  }
  function dispose(){ctx!.clearRect(0,0,canvas.width,canvas.height);}
  return {resize,paint,dispose};
}
