import { boolean, date, integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const habits = pgTable("rhythm_habits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("Здоровье"),
  icon: text("icon").notNull().default("sparkles"),
  color: text("color").notNull().default("lime"),
  timeOfDay: text("time_of_day").notNull().default("morning"),
  schedule: jsonb("schedule").$type<number[]>().notNull(),
  startDate: date("start_date").notNull(),
  notification: boolean("notification").notNull().default(false),
  reminderTime: text("reminder_time").notNull().default("09:00"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const checkIns = pgTable("rhythm_check_ins", {
  habitId: text("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.habitId, table.date] })]);

export const settings = pgTable("rhythm_settings", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull().default("Александр"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  reminderTime: text("reminder_time").notNull().default("09:00"),
});
