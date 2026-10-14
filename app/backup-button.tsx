"use client";
import { useEffect, useRef, useState } from "react";
export default function BackupButton() {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const objectUrl=useRef<string|null>(null);
  useEffect(()=>()=>{if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);},[]);
  async function download(){
    if(busy)return;setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/backup",{cache:"no-store",credentials:"same-origin"});
      if(!response.ok){const data=await response.json() as {error?:string};throw new Error(data.error||"备份暂时无法导出。");}
      const blob=await response.blob();
      if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);
      const url=URL.createObjectURL(blob);objectUrl.current=url;
      const link=document.createElement("a");link.href=url;link.download=`reiko-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);link.click();link.remove();setMessage("备份已生成，请保存下载文件。");
    }catch(error){setMessage(error instanceof Error?error.message:"备份暂时无法导出。");}finally{setBusy(false);}
  }
  return <><button className="dusk-write-link" type="button" disabled={busy} onClick={download}>{busy?"正在导出……":"导出备份"}</button>{message&&<span className="dusk-backup-message" role="status">{message}</span>}</>;
}
