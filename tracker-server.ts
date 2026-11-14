import { db } from "@/db";
import { checkIns, habits, settings } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { addDays, dateKey, isScheduled, type Habit, type TrackerData } from "./tracker";

export async function getTrackerData(): Promise<TrackerData> {
  await db.transaction(async (tx) => {
    const inserted = await tx.insert(settings).values({ id: "default" }).onConflictDoNothing().returning();
    if (!inserted.length) return;
    const today = new Date();
    const startDate = dateKey(addDays(today, -44));
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    const seeds: Habit[] = [
      { id: "seed-water", name: "Выпить 2 литра воды", category: "Здоровье", icon: "water", color: "blue", timeOfDay: "morning", schedule: allDays, startDate, notification: true, reminderTime: "09:00", position: 0 },
      { id: "seed-book", name: "Читать 20 минут", category: "Развитие", icon: "book", color: "purple", timeOfDay: "evening", schedule: allDays, startDate, notification: false, reminderTime: "20:00", position: 1 },
      { id: "seed-exercise", name: "Утренняя зарядка", category: "Здоровье", icon: "activity", color: "peach", timeOfDay: "morning", schedule: [0, 1, 2, 3, 4], startDate, notification: true, reminderTime: "07:30", position: 2 },
      { id: "seed-meditate", name: "Медитация · 10 минут", category: "Баланс", icon: "flower", color: "lime", timeOfDay: "morning", schedule: allDays, startDate, notification: false, reminderTime: "08:00", position: 3 },
      { id: "seed-walk", name: "Прогулка на воздухе", category: "Здоровье", icon: "walk", color: "sand", timeOfDay: "afternoon", schedule: allDays, startDate, notification: false, reminderTime: "13:00", position: 4 },
      { id: "seed-sleep", name: "Без телефона перед сном", category: "Баланс", icon: "moon", color: "pink", timeOfDay: "evening", schedule: allDays, startDate, notification: false, reminderTime: "22:00", position: 5 },
    ];
    await tx.insert(habits).values(seeds);
    const entries: { habitId: string; date: string }[] = [];
    for (let offset = 44; offset >= 0; offset--) {
      const date = addDays(today, -offset);
      seeds.forEach((habit, index) => {
        const completed = offset === 0 ? [0, 2, 3].includes(index) : offset <= 4 ? (offset + index) % 5 !== 0 : (offset * 7 + index * 3) % 11 < 8;
        if (isScheduled(habit, date) && completed) entries.push({ habitId: habit.id, date: dateKey(date) });
      });
    }
    if (entries.length) await tx.insert(checkIns).values(entries);
  });
  const [allHabits, allEntries, prefs] = await Promise.all([
    db.select().from(habits).orderBy(asc(habits.position), asc(habits.createdAt)),
    db.select({ habitId: checkIns.habitId, date: checkIns.date }).from(checkIns),
    db.select().from(settings).where(eq(settings.id, "default")),
  ]);
  return {
    habits: allHabits.map(({ createdAt: _createdAt, ...habit }) => habit),
    checkIns: allEntries,
    settings: { displayName: prefs[0].displayName, notificationsEnabled: prefs[0].notificationsEnabled, reminderTime: prefs[0].reminderTime },
  };
}

export function parseHabitInput(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Проверьте данные привычки");
  const value = input as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name || name.length > 80) throw new Error("Название должно содержать от 1 до 80 символов");
  const schedule = Array.isArray(value.schedule) ? [...new Set(value.schedule)].filter((n): n is number => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= 6).sort() : [];
  if (!schedule.length) throw new Error("Выберите хотя бы один день недели");
  const startDate = value.startDate;
  if (typeof startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || isNaN(new Date(startDate).getTime()) || new Date(startDate).toISOString().slice(0, 10) !== startDate) throw new Error("Укажите корректную дату начала");
  const reminderTime = typeof value.reminderTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.reminderTime) ? value.reminderTime : "09:00";
  return {
    name,
    category: ["Здоровье", "Развитие", "Баланс", "Другое"].includes(String(value.category)) ? String(value.category) : "Другое",
    icon: ["water", "book", "activity", "flower", "walk", "moon", "target", "coffee", "pencil", "heart"].includes(String(value.icon)) ? String(value.icon) : "target",
    color: ["lime", "blue", "purple", "peach", "pink", "sand"].includes(String(value.color)) ? String(value.color) : "lime",
    timeOfDay: ["morning", "afternoon", "evening"].includes(String(value.timeOfDay)) ? String(value.timeOfDay) : "morning",
    schedule,
    startDate,
    notification: value.notification === true,
    reminderTime,
  };
}
