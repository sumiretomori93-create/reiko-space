import { and, asc, eq, gt } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { postComments, posts } from "../../../../../db/schema";
import { owner, readJson, limitRequest, requestError } from "../../../../server-security";

const MAX_COMMENT_LENGTH = 500;

function parsePostId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  return message.includes("no such table")
    ? "批注存储还没有准备好，请稍后再试。"
    : "批注暂时无法读取，请稍后再试。";
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const id = parsePostId((await context.params).id);
  if (!id) return Response.json({ error: "动态编号无效。" }, { status: 400 });

  try {
    await limitRequest(_request, "comments-read", 120);
    const [post] = await getDb().select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1);
    if (!post) return Response.json({ error: "这条动态不存在。" }, { status: 404 });
    const cursor = new URL(_request.url).searchParams.get("after");
    const after = cursor ? Number(cursor) : 0;
    if (!Number.isSafeInteger(after) || after < 0) return Response.json({ error: "批注页码无效。" }, { status: 400 });
    const comments = await getDb().select().from(postComments).where(and(eq(postComments.postId, id), gt(postComments.id, after))).orderBy(asc(postComments.id)).limit(51);
    return Response.json({ comments: comments.slice(0, 50), nextAfter: comments.length > 50 ? comments[49].id : null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestError(error) || Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const id = parsePostId((await context.params).id);
  if (!id) return Response.json({ error: "动态编号无效。" }, { status: 400 });

  try {
    const user = await owner(request);
    await limitRequest(request, "comments-write", 20, 60, user.userId);
    const payload = await readJson(request);
    const content = typeof payload.content === "string" ? payload.content.trim() : "";
    if (!content) return Response.json({ error: "先写点批注。" }, { status: 400 });
    if (content.length > MAX_COMMENT_LENGTH) return Response.json({ error: `批注最多 ${MAX_COMMENT_LENGTH} 字。` }, { status: 400 });
    const [post] = await getDb().select({ id: posts.id }).from(posts).where(and(eq(posts.id, id))).limit(1);
    if (!post) return Response.json({ error: "这条动态不存在。" }, { status: 404 });
    const [comment] = await getDb().insert(postComments).values({ postId: id, content }).returning();
    return Response.json({ comment }, { status: 201 });
  } catch (error) {
    return requestError(error) || Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
