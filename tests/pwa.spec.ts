import { expect, test } from "@playwright/test";

test("hosted PWA precaches the shell and can reopen offline after install", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);

  const onlineAssets = await page.evaluate(async () => {
    const paths = [
      "./manifest.json",
      "./icons/icon-192.png",
      "./icons/icon-512.png",
      "./icons/maskable-512.png",
    ];
    const responses = await Promise.all(paths.map((path) => fetch(path)));
    return responses.map((response) => response.ok);
  });
  expect(onlineAssets).toEqual([true, true, true, true]);

  await context.setOffline(true);
  const offlinePage = await context.newPage();
  await offlinePage.goto("/");
  await expect(offlinePage.locator("h1")).toContainText("dziecka");
  await expect(offlinePage.locator(".enter-key")).toBeVisible();
  const offlineAssets = await offlinePage.evaluate(async () => {
    const paths = [
      "./manifest.json",
      "./icons/icon-192.png",
      "./icons/icon-512.png",
      "./icons/maskable-512.png",
    ];
    const responses = await Promise.all(paths.map((path) => fetch(path)));
    return responses.map((response) => response.ok);
  });
  expect(offlineAssets).toEqual([true, true, true, true]);
  expect(errors).toEqual([]);
  await context.close();
});
