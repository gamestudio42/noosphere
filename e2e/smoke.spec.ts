import { expect, test } from '@playwright/test';

test('the menu starts the sandbox and planting raises the idea count', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('button', { name: /BEGIN/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /FREE MIND/i })).toBeVisible();

  await page.getByRole('button', { name: /FREE MIND/i }).click();
  // The HUD renders "Ideas" and CSS uppercases it, so match the DOM text, not the rendered one.
  await expect(page.getByText('Ideas', { exact: true })).toBeVisible();
  // A mouse still reads click and hover, and hover still reveals the archetype.
  await expect(page.getByText('Click to plant an idea.')).toBeVisible();
  await expect(page.getByText('Hover to pay attention.')).toBeVisible();
  await expect(page.getByText('Tap to plant an idea.')).toHaveCount(0);
  const instinct = page.getByRole('button', { name: 'Instinct', exact: true });
  const tip = instinct.getByText('Heavy and slow. Pulls other ideas in.');
  await expect(tip).toHaveCSS('opacity', '0');
  await instinct.hover();
  await expect(tip).toHaveCSS('opacity', '1');

  for (const [x, y] of [
    [520, 380],
    [700, 460],
    [880, 520],
  ]) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(2_000);

  const ideas = await page.evaluate(() => {
    const lines = document.body.innerText.split('\n').map((line) => line.trim());
    return Number(lines[lines.indexOf('IDEAS') + 1]);
  });

  expect(ideas).toBeGreaterThanOrEqual(3);
  expect(errors).toEqual([]);
});
