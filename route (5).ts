import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: Request) {
  try {
    const input = await request.json();
    const displayName = typeof input.displayName === "string" ? input.displayName.trim().slice(0, 40) : "";
    if (!displayName) return Response.json({ error: "Укажите имя" }, { status: 400 });
    if (typeof input.reminderTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.reminderTime)) return Response.json({ error: "Укажите время напоминания" }, { status: 400 });
    const [updated] = await db.update(settings).set({ displayName, notificationsEnabled: input.notificationsEnabled === true, reminderTime: input.reminderTime }).where(eq(settings.id, "default")).returning();
    return Response.json(updated);
  } catch {
    return Response.json({ error: "Не удалось сохранить настройки" }, { status: 500 });
  }
}
