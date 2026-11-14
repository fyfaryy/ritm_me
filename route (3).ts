import { db } from "@/db";
import { habits } from "@/db/schema";
import { parseHabitInput } from "@/lib/tracker-server";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const input = parseHabitInput(await request.json());
    const [position] = await db.select({ value: sql<number>`coalesce(max(${habits.position}), 0) + 1` }).from(habits);
    const [habit] = await db.insert(habits).values({ ...input, id: randomUUID(), position: Number(position.value) }).returning();
    return Response.json(habit, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Не удалось создать привычку" }, { status: 400 });
  }
}
