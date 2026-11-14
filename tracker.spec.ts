import { test, expect } from "@playwright/test";
import { addDays, dateKey, type TrackerData } from "../src/lib/tracker";

const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
test.describe.configure({ mode: "serial" });

test("навигация, история за 30 дней и планирование недель", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("В своём ритме");
  await page.locator(".main-nav .nav-item").nth(3).click();
  await page.getByRole("button", { name: "30 дней", exact: true }).click();
  await expect(page.locator(".history-scroll thead th")).toHaveCount(32);
  await page.locator(".main-nav .nav-item").nth(2).click();
  await page.getByRole("button", { name: "Следующая неделя", exact: true }).click();
  await expect(page.locator(".future-banner")).toBeVisible();
  await expect(page.locator(".mini-calendar")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("создание, отметка с сохранением, перенос на будущее и удаление", async ({ page, request }) => {
  const name = `Проверка ритма ${Date.now()}`;
  let id: string | undefined;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  try {
    await page.getByRole("button", { name: "Новая привычка", exact: true }).click();
    await page.getByLabel("Название привычки", { exact: true }).fill(name);
    const creation = page.waitForResponse((response) => response.url().endsWith("/api/habits") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Создать привычку", exact: true }).click();
    const created = await creation;
    expect(created.status()).toBe(201);
    id = (await created.json()).id;
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    let row = page.locator(".habit-row").filter({ has: page.locator(".habit-name", { hasText: name }) });
    const check = row.locator(".today-cell .check-box");
    await check.click();
    await expect(check).toHaveAttribute("aria-pressed", "true");
    await expect(check).toBeEnabled();
    await page.reload();
    row = page.locator(".habit-row").filter({ has: page.locator(".habit-name", { hasText: name }) });
    await expect(row.locator(".today-cell .check-box")).toHaveAttribute("aria-pressed", "true");
    await row.locator(".habit-name").click();
    await page.getByRole("button", { name: "По дням недели", exact: true }).click();
    const future = dateKey(addDays(new Date(), 14));
    await page.getByLabel("Дата начала привычки", { exact: true }).fill(future);
    await page.getByRole("button", { name: "Сохранить изменения", exact: true }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator(".future-banner")).toBeVisible();
    const stored = await (await request.get(`${base}/api/tracker`)).json() as TrackerData;
    expect(stored.habits.find((habit) => habit.id === id)?.startDate).toBe(future);
    expect(stored.habits.find((habit) => habit.id === id)?.schedule).toEqual([0, 1, 2, 3, 4]);
    expect(stored.checkIns.some((entry) => entry.habitId === id)).toBe(false);
    row = page.locator(".habit-row").filter({ has: page.locator(".habit-name", { hasText: name }) });
    await row.locator(".more-button").click();
    await row.getByRole("button", { name: "Удалить привычку", exact: true }).click();
    await page.locator(".delete-modal").getByRole("button", { name: "Удалить", exact: true }).click();
    await expect(page.locator(".delete-modal")).toHaveCount(0);
    await expect(page.locator(".habit-name", { hasText: name })).toHaveCount(0);
    const finalData = await (await request.get(`${base}/api/tracker`)).json() as TrackerData;
    expect(finalData.habits.some((habit) => habit.id === id)).toBe(false);
  } finally {
    if (id) await fetch(`${base}/api/habits/${id}`, { method: "DELETE" });
  }
});

test("экспорт CSV скачивается из интерфейса", async ({ page }) => {
  await page.goto(base);
  await page.getByRole("button", { name: "Экспорт", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/^rhythm-30-days-.*\.csv$/);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("мобильная версия не переполняется и открывает календарь", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/mobile-open/);
  await page.locator(".main-nav .nav-item").nth(2).click();
  await expect(page.locator(".mini-calendar")).toBeVisible();
  await expect(page.locator(".sidebar")).not.toHaveClass(/mobile-open/);
});
