import { expect, test } from '@playwright/test';

test('the web build installs and plays offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /FREE MIND/i })).toBeVisible();

  // Installable: a manifest with icons
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector('link[rel="manifest"]')?.getAttribute('href');
    return href ? (await fetch(href)).json() : null;
  });
  expect(manifest?.name).toBe('Noosphere');
  expect(manifest?.icons?.length).toBeGreaterThan(0);

  // Wait until the service worker has cached the build and controls the page
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: /FREE MIND/i })).toBeVisible();
  await page.getByRole('button', { name: /FREE MIND/i }).click();
  await expect(page.getByText('Ideas', { exact: true })).toBeVisible();
  // The bundled typeface came from the cache too
  expect(await page.evaluate(() => document.fonts.check('16px "Space Grotesk"'))).toBe(true);
  await context.setOffline(false);
});
