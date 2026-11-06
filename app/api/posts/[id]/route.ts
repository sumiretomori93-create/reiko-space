import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { posts } from "../../../../db/schema";
import { owner, limitRequest, requestError } from "../../../server-security";

async function update(request: Request, context: { params: Promise<{ id: string }> }, restore: boolean) {
  try {
    const user = await owner(request);
    await limitRequest(request, "posts-manage", 60, 60, user.userId);
    const value = (await context.params).id;
    const id = Number(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1) return Response.json({ error: "日记编号无效。" }, { status: 400 });
    const [post] = await getDb().update(posts).set({ deletedAt: restore ? null : new Date().toISOString() }).where(eq(posts.id, id)).returning();
    if (!post) return Response.json({ error: "这篇日记不存在。" }, { status: 404 });
    return Response.json({ post }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error) || Response.json({ error: "日记操作失败，请稍后再试。" }, { status: 500 });
  }
}

export const DELETE = (request: Request, context: { params: Promise<{ id: string }> }) => update(request, context, false);
export const PATCH = (request: Request, context: { params: Promise<{ id: string }> }) => update(request, context, true);
