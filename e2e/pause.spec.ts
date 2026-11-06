import { expect, test } from '@playwright/test';

// Mind age as the HUD shows it, in seconds
const mindAge = async (page: import('@playwright/test').Page) => {
  const text = await page.evaluate(() => document.body.innerText);
  const [, m, s] = text.match(/mind age\s*\n\s*(\d+):(\d+)/i) ?? [];
  return Number(m) * 60 + Number(s);
};

test('pausing freezes the mind and keyboard play works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.getByRole('button', { name: /FREE MIND/i }).click();
  await expect(page.getByText('Ideas', { exact: true })).toBeVisible();

  // Number keys pick an archetype
  await page.keyboard.press('2');
  await expect(page.getByRole('button', { name: /FEELING/i })).toHaveClass(/scale-110/);

  await page.mouse.click(600, 400);
  await page.waitForTimeout(2_200);

  // Esc opens the pause menu with Resume focused, and no time passes
  await page.keyboard.press('Escape');
  const dialog = page.getByRole('dialog', { name: 'Paused' });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeFocused();
  const pausedAt = await mindAge(page);
  await page.waitForTimeout(2_500);
  expect(await mindAge(page)).toBe(pausedAt);

  // Settings stick
  await dialog.getByLabel('Screen shake').uncheck();
  const saved = await page.evaluate(() => localStorage.getItem('noosphere:settings:v1'));
  expect(JSON.parse(saved ?? '{}').shake).toBe(false);

  // Esc resumes and the clock moves again
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await page.waitForTimeout(2_200);
  expect(await mindAge(page)).toBeGreaterThan(pausedAt);

  expect(errors).toEqual([]);
});
