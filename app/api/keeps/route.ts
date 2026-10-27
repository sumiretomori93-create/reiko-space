import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { keepsConnections as connections } from "../../../db/schema";
import { getChatGPTUser } from "../../chatgpt-auth";
import { validURL, text, uuid, validDate, describe, redis } from "../../../lib/keeps";
import { SAVE_NOTE, SAVE_ANNIVERSARY } from "../../../lib/keeps-lua";
export const dynamic = "force-dynamic";
const json = (body: any, status=200) => Response.json(body, {status,headers:{"Cache-Control":"no-store"}});
async function encryptionKey() {
 const hex = (env as any).KEEPS_CONNECTION_ENCRYPTION_KEY;
 if (!hex || !/^[a-f0-9]{64}$/.test(hex)) throw Error("服务端连接配置尚未就绪。");
 return crypto.subtle.importKey("raw", Uint8Array.from(hex.match(/../g), (s:any)=>parseInt(s,16)), "AES-GCM", false,["encrypt","decrypt"]);
}
async function seal(value: unknown, userId: string) {
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:new TextEncoder().encode(userId)},await encryptionKey(),new TextEncoder().encode(JSON.stringify(value)));
 return JSON.stringify({iv:Array.from(iv),data:Array.from(new Uint8Array(ciphertext))});
}
async function connection(userId: string) {
 const row = (await getDb().select().from(connections).where(eq(connections.userId,userId)))[0];
 if(!row) return null;
 const value=JSON.parse(row.encrypted);
 const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:new Uint8Array(value.iv),additionalData:new TextEncoder().encode(userId)},await encryptionKey(),new Uint8Array(value.data));
 return JSON.parse(new TextDecoder().decode(plain));
}
export async function GET(request: Request) {
 const user=await getChatGPTUser(); if(!user) return json({error:"请先使用你的 ChatGPT 账号登录。"},401);
 if(user.email.toLowerCase()!=="sumire.tomori93@gmail.com")return json({error:"只有 Reiko 可以查看留存。"},403);
 try {
  const config=await connection(user.userId); if(!config)return json({connected:false});
  const url=new URL(request.url), action=url.searchParams.get("action");
  if(!action)return json({connected:true});
  if(action==="anniversaries") {
   const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
   const raw=await redis(config,["HVALS","reiko:anniversaries:v1:records"]);
   return json({items:raw.map((s:string)=>describe(JSON.parse(s),today)).sort((a:any,b:any)=>a.days_until_next-b.days_until_next)});
  }
  if(action!=="notes")return json({error:"未知操作。"},400);
  const cursor=url.searchParams.get("before");
  if(cursor && !/^[1-9]\d{0,15}$/.test(cursor))throw Error("翻页编号无效。");
  const pairs=await redis(config,["ZREVRANGEBYSCORE","reiko:notebook:v1:index",cursor?`(${cursor}`:"+inf","-inf","WITHSCORES","LIMIT",0,21]);
  const page=pairs.slice(0,40), ids=page.filter((_:unknown,i:number)=>i%2===0);
  const raw=ids.length?await redis(config,["HMGET","reiko:notebook:v1:notes",...ids]):[];
  return json({items:raw.filter(Boolean).map((s:string)=>JSON.parse(s)),next:pairs.length>40?String(page[page.length-1]):null});
 }catch(e){return json({error:e instanceof Error?e.message:"读取失败，请稍后重试。"},400);}
}
export async function POST(request: Request) {
 const user=await getChatGPTUser(); if(!user)return json({error:"请先登录。"},401);
 if(user.email.toLowerCase()!=="sumire.tomori93@gmail.com")return json({error:"只有 Reiko 可以写入留存。"},403);
 if(request.headers.get("origin")!==new URL(request.url).origin)return json({error:"请求来源不符。"},403);
 try {
  const raw=await request.text();if(raw.length>50000)throw Error("内容太长，请分开记录。");
  const body=JSON.parse(raw);
  if(body.op==="connect") {
   const config={url:validURL(text(body.url,300)),token:text(body.token,4000).replace(/^['"]|['"]$/g,"")};
   await redis(config,["EVAL","return 1",0]);
   const encrypted=await seal(config,user.userId);
   await getDb().insert(connections).values({userId:user.userId,encrypted}).onConflictDoUpdate({target:connections.userId,set:{encrypted}});
   return json({connected:true});
  }
  const config=await connection(user.userId); if(!config)throw Error("请先连接现有数据库。");
  const id=uuid(body.request_id);
  if(body.op==="note") {
   const title=text(body.title,120),content=text(body.text,10000),signature=text(body.signature,80);
   const result=await redis(config,["EVAL",SAVE_NOTE,3,"reiko:notebook:v1:notes","reiko:notebook:v1:index","reiko:notebook:v1:sequence",id,title,content,signature,new Date().toISOString()]);
   return json({saved:true,item:JSON.parse(result)});
  }
  if(body.op==="anniversary") {
   const item={id,name:text(body.name,200),date:validDate(body.date),note:text(body.note??"",2000,false)};
   const result=await redis(config,["EVAL",SAVE_ANNIVERSARY,1,"reiko:anniversaries:v1:records",id,JSON.stringify(item)]);
   return json({saved:true,item:JSON.parse(result)});
  }
  throw Error("未知操作。");
 }catch(e){return json({error:e instanceof Error && !(e instanceof SyntaxError)?e.message:"内容格式不正确，请检查后重试。"},400);}
}
