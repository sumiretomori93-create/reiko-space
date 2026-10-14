import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { nightRecords } from "../../../db/schema";
import { owner, readJson, limitRequest, requestError } from "../../server-security";

const response = (data: unknown, status = 200) => Response.json(data, {
  status, headers: { "Cache-Control": "no-store" },
});

export async function GET(request: Request) {
  try {
    await limitRequest(request, "record-read", 120);
    const [record] = await getDb().select().from(nightRecords).where(eq(nightRecords.id, 1)).limit(1);
    return response({ score: record?.score ?? 0 });
  } catch (error) {
    return requestError(error) || response({ error: "Reiko 的纪录暂时无法读取。" }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const user = await owner(request);
    await limitRequest(request, "record-write", 120, 60, user.userId);
    const { score } = await readJson(request);
    if (typeof score !== "number" || !Number.isSafeInteger(score) || score < 0 || score > 2147483647 || score % 4 !== 0) return response({ error: "成绩格式无效。" }, 400);
    const [record] = await getDb().insert(nightRecords).values({ id: 1, score })
      .onConflictDoUpdate({ target: nightRecords.id,
        set: { score: sql`max(${nightRecords.score}, excluded.score)`, updatedAt: sql`CURRENT_TIMESTAMP` },
        setWhere: sql`excluded.score > ${nightRecords.score}`,
      }).returning();
    if (record) return response({ score: record.score });
    const [existing] = await getDb().select().from(nightRecords).where(eq(nightRecords.id, 1)).limit(1);
    return response({ score: existing?.score ?? 0 });
  } catch (error) {
    return requestError(error) || response({ error: "纪录暂未同步，成绩仍保存在此浏览器。" }, 503);
  }
}
