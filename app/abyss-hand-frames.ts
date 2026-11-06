type Point={x:number;y:number};
// Compatibility frames are rendered from the SAME Blender mesh and lights.
// The canvas only places complete frames; it never bends a photograph.
export async function createHandFrames(canvas:HTMLCanvasElement){
  const image=new Image();image.src='/reiko-assets/abyss/hand-3d/contact-atlas.webp';await image.decode();
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('2D rendering unavailable');
  let width=1,height=1,dpr=1;
  function resize(w:number,h:number){width=w;height=h;dpr=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  function paint(base:Point,tip:Point,_lag:Point,curl:number){
    ctx!.setTransform(dpr,0,0,dpr,0,0);ctx!.clearRect(0,0,width,height);
    const dx=tip.x-base.x,dy=tip.y-base.y,length=Math.hypot(dx,dy);if(length<2)return;
    const frame=Math.round(Math.min(1,Math.max(0,curl))*23),sx=(frame%8)*1024,sy=Math.floor(frame/8)*384;
    const scale=length/(1024*10/11.6),angle=Math.atan2(dy,dx);
    ctx!.save();ctx!.translate(base.x,base.y);ctx!.rotate(angle);ctx!.scale(scale,scale);
    ctx!.drawImage(image,sx,sy,1024,384,-1024*.8/11.6,-192,1024,384);ctx!.restore();
    ctx!.globalCompositeOperation='destination-in';
    const fade=ctx!.createLinearGradient(base.x,base.y,tip.x,tip.y);fade.addColorStop(0,'rgba(0,0,0,.22)');fade.addColorStop(.55,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,1)');
    ctx!.fillStyle=fade;ctx!.fillRect(0,0,width,height);ctx!.globalCompositeOperation='source-over';
  }
  function dispose(){ctx!.clearRect(0,0,canvas.width,canvas.height);}
  return {resize,paint,dispose};
}
