import { expect, test, type Page } from "@playwright/test";

async function guess(page: Page, value: string) {
  await page.getByLabel("Your price guess").fill(value);
  await page.getByRole("button", { name: "Guess", exact: true }).click();
}

const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("copordrop:v1") ?? "{}"));

test("plays a full day, shares, and keeps the finished state", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-08T12:00:00"));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined });
  });
  await page.goto("/");

  const howTo = page.getByRole("dialog", { name: "How to play" });
  await expect(howTo).toBeVisible();
  await howTo.getByRole("button", { name: "Close" }).click();
  await expect(page.getByText("No. 1")).toBeVisible();

  // Budget: invalid input doesn't count, then a one-guess win ($39.90).
  await guess(page, "abc");
  await expect(page.getByText("doesn't look like a price")).toBeVisible();
  await expect(page.getByText("Guess 1 of 5")).toBeVisible();
  await guess(page, "39.90");
  await expect(page.getByText("Full price on Strand Online (US)")).toBeVisible();
  await page.getByRole("button", { name: /^COP/ }).click();
  await expect(page.getByText("demo crowd")).toBeVisible();
  await page.getByRole("button", { name: "Next item" }).click();

  // Mid: a win in three ($128).
  await guess(page, "60");
  await expect(page.getByText("⬆️ Higher")).toBeVisible();
  await expect(page.getByText("Rigid organic-cotton denim")).toBeVisible();
  await guess(page, "105");
  await expect(page.getByText("🔥 Close")).toBeVisible();

  // A reload mid-item resumes exactly where we were.
  await page.reload();
  await expect(page.getByText("Guess 3 of 5")).toBeVisible();
  await guess(page, "128");
  await page.getByRole("button", { name: /^DROP/ }).click();
  await page.getByRole("button", { name: "Next item" }).click();

  // Bougie: a loss in five ($2,450).
  for (const value of ["100", "200", "300", "400", "500"]) await guess(page, value);
  await expect(page.getByText("It's between")).toBeHidden(); // clues clear after the reveal
  await page.getByRole("button", { name: /^DROP/ }).click();
  await page.getByRole("button", { name: "See your results" }).click();

  await expect(page.getByRole("heading", { name: "Today's verdicts" })).toBeVisible();
  await page.getByRole("button", { name: "Share" }).click();
  await expect(page.getByText("Copied.")).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toBe(
    [
      "Cop or Drop #1 🏷️",
      "👕 ✅ 1/5 · COP",
      "👖 ⬆️🔥✅ 3/5 · DROP",
      "👜 ⬆️⬆️⬆️⬆️❌ X/5 · DROP",
      "copordrop.example",
    ].join("\n"),
  );

  await page.getByRole("main").getByRole("button", { name: "Stats" }).click();
  const stats = page.getByRole("dialog", { name: "Your stats" });
  await expect(stats.getByText("Played")).toBeVisible();
  await stats.getByRole("button", { name: "Close" }).click();
  const state = await stored(page);
  expect(state.days["2026-11-08"].items.map((i: { status: string }) => i.status)).toEqual([
    "done",
    "done",
    "done",
  ]);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Today's verdicts" })).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("an item can be played with the keyboard and is announced", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-08T12:00:00"));
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "How to play" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  const input = page.getByLabel("Your price guess");
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    if (await input.evaluate((el) => el === document.activeElement)) break;
  }
  await expect(input).toBeFocused();

  const live = page.locator('[aria-live="polite"]');
  await page.keyboard.type("34");
  await page.keyboard.press("Enter");
  await expect(live).toHaveText("Guess 1: Higher. Close. 4 guesses left.");
  await expect(input).toBeFocused();

  await page.keyboard.type("39.90");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /^COP/ })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Next item" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toBeFocused();
  await expect(page.getByRole("heading", { name: "High-Rise Wide-Leg Jean" })).toBeVisible();
});

test("a date with no content shows the no-drop screen", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-11T12:00:00"));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "No drop today 💅" })).toBeVisible();
});
