import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { posts } from "../../../../db/schema";
import { owner, limitRequest, requestError } from "../../../server-security";

export async function GET(request: Request) {
  try {
    const user = await owner(request);
    await limitRequest(request, "posts-manage-read", 60, 60, user.userId);
    const rows = await getDb().select().from(posts).orderBy(desc(posts.createdAt), desc(posts.id)).limit(1000);
    return Response.json({ posts: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error) || Response.json({ error: "日记暂时无法读取。" }, { status: 500 });
  }
}
