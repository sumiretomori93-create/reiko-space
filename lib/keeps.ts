export function validURL(input: string) {
 const url = input.trim().replace(/^['"]|['"]$/g, "").replace(/\/$/, "");
 if (!/^https:\/\/[a-z0-9-]+\.upstash\.io$/.test(url)) throw Error("请填写 Upstash 的 HTTPS REST 地址。");
 return url;
}
export function text(value: unknown, max: number, required = true): string {
 if (typeof value !== "string") throw Error("填写内容格式不正确。");
 const result = value.trim();
 if ((required && !result) || [...result].length > max) throw Error(`内容${required ? "不可为空，且" : ""}不能超过 ${max} 字。`);
 return result;
}
export function uuid(value: unknown) {
 if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw Error("保存编号不正确，请刷新后重试。");
 return value.toLowerCase();
}
export function validDate(value: unknown): string {
 if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.slice(0,4)==="0000") throw Error("请选择完整日期。");
 const d = new Date(value+"T00:00:00Z");
 if (!Number.isFinite(+d) || d.toISOString().slice(0,10)!==value) throw Error("日期不存在。");
 return value;
}
export function describe(item: any, today: string) {
 const stamp = (s: string) => +new Date(s+"T00:00:00Z");
 let year = Math.max(Number(today.slice(0,4)), Number(item.date.slice(0,4)));
 let next = "";
 do {
  next = `${year}-${item.date.slice(5)}`;
  if (item.date.slice(5)==="02-29" && !(year%4===0 && (year%100!==0 || year%400===0))) next=`${year}-02-28`;
  year++;
 } while(next < today);
 return {...item, days_since: Math.round((stamp(today)-stamp(item.date))/86400000), next_occurrence: next, days_until_next: Math.round((stamp(next)-stamp(today))/86400000)};
}
export async function redis(config: {url:string;token:string}, args: (string|number)[]) {
 let response: Response;
 try { response = await fetch(validURL(config.url), {method:"POST", headers:{Authorization:`Bearer ${config.token}`,"Content-Type":"application/json"},body:JSON.stringify(args),redirect:"manual",signal:AbortSignal.timeout(15000)}); }
 catch {throw Error("数据库暂时连接不上。若在保存，请保留内容后重试。");}
 if (response.status >= 300 && response.status < 400) throw Error("数据库地址返回了重定向，请使用 Upstash 的原始 REST 地址。");
 if (!response.ok) throw Error("数据库连接失败，请检查地址和读写 Token。");
 const data = await response.json() as any;
 if (data.error) {
  if(String(data.error).includes("IDEMPOTENCY_CONFLICT")) throw Error("同一保存编号的内容发生变化，原记录没有被覆盖。请刷新后重新填写。");
  if(String(data.error).includes("ANNIVERSARY_LIMIT")) throw Error("纪念日已达到 1000 条上限。");
  throw Error("数据库未能完成操作，请检查读写权限后重试。");
 }
 return data.result;
}
