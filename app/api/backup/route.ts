import { getDb } from "../../../db";
import { posts, postComments, nightRecords } from "../../../db/schema";
import { owner, limitRequest, requestError } from "../../server-security";

export async function GET(request: Request) {
  try {
    const user = await owner(request);
    await limitRequest(request, "backup", 5, 3600, user.userId);
    const db = getDb();
    const [diary, comments, records] = await db.batch([
      db.select().from(posts).limit(10001), db.select().from(postComments).limit(10001), db.select().from(nightRecords).limit(10001),
    ]);
    if ([diary, comments, records].some(rows => rows.length > 10000)) return Response.json({ error: "数据较多，需要分批导出；本次未生成不完整备份。" }, { status: 413 });
    const day = new Date().toISOString().slice(0, 10);
    return Response.json({ version: 1, exportedAt: new Date().toISOString(), posts: diary, comments, nightRecords: records }, {
      headers: { "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="reiko-backup-${day}.json"`, "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) { return requestError(error) || Response.json({ error: "备份暂时无法导出，请稍后再试。" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
