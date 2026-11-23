import { expect, test, type Locator, type Page } from '@playwright/test';

test.use({
  viewport: { width: 360, height: 740 },
  hasTouch: true,
  isMobile: true,
});

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 412, height: 915 },
  { width: 915, height: 412 },
  { width: 820, height: 1180 },
  { width: 1180, height: 820 },
];

type Box = { x: number; y: number; width: number; height: number };

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width - 0.5 &&
  a.x + a.width > b.x + 0.5 &&
  a.y < b.y + b.height - 0.5 &&
  a.y + a.height > b.y + 0.5;

const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box as Box;
};

const ideaCount = async (page: Page) => {
  const lines = (await page.evaluate(() => document.body.innerText))
    .split('\n')
    .map((line) => line.trim());
  return Number(lines[lines.indexOf('IDEAS') + 1]);
};

const touchPoint = async (locator: Locator) => {
  const box = await boxOf(locator);
  return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
};

// Press and hold without the click Playwright's touchscreen.tap() always sends.
const holdAt = async (page: Page, x: number, y: number, ms: number) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 0 }],
  });
  await page.waitForTimeout(ms);
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
};

test('a coarse pointer can play, inspect and reach every control', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  expect(await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches)).toBe(true);

  await page.getByRole('button', { name: /FREE MIND/i }).tap();
  await expect(page.getByText('Ideas', { exact: true })).toBeVisible();
  await expect(page.getByText('Tap to plant an idea.')).toBeVisible();
  await expect(page.getByText('Hold to pay attention.')).toBeVisible();
  await expect(page.getByText('Click to plant an idea.')).toHaveCount(0);
  await expect(page.getByText('Hover to pay attention.')).toHaveCount(0);

  // Free Mind already has its seed idea. Holding pays attention and does not plant.
  // A tap on empty space plants exactly one more.
  await expect.poll(() => ideaCount(page)).toBe(1);
  const before = await ideaCount(page);
  await holdAt(page, 90, 180, 600);
  await page.waitForTimeout(400);
  expect(await ideaCount(page)).toBe(before);
  await page.touchscreen.tap(90, 180);
  await page.waitForTimeout(500);
  expect(await ideaCount(page)).toBe(before + 1);

  // Long-press shows the archetype text that hover would show, before the finger lifts.
  const logic = page.getByRole('button', { name: 'Logic', exact: true });
  const logicPoint = await touchPoint(logic);
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ ...logicPoint, id: 0 }],
  });
  await page.waitForTimeout(550);
  await expect(page.getByRole('status')).toHaveText('Slow to fade. Builds stable structures.');
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();

  // A tap selects and keeps the description on screen.
  await page.getByRole('button', { name: 'Instinct', exact: true }).tap();
  const description = page.getByRole('status');
  await expect(description).toHaveText('Heavy and slow. Pulls other ideas in.');
  const descriptionBox = await boxOf(description);
  expect(descriptionBox.x).toBeGreaterThanOrEqual(-0.5);
  expect(descriptionBox.x + descriptionBox.width).toBeLessThanOrEqual(360.5);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    const label = page.getByRole('button', { name: 'Instinct', exact: true }).locator('span');
    const labelBox = await boxOf(label);
    const where = `${viewport.width}x${viewport.height}`;
    expect(labelBox.x, where).toBeGreaterThanOrEqual(-0.5);
    expect(labelBox.y, where).toBeGreaterThanOrEqual(-0.5);
    expect(labelBox.x + labelBox.width, where).toBeLessThanOrEqual(viewport.width + 0.5);
    expect(labelBox.y + labelBox.height, where).toBeLessThanOrEqual(viewport.height + 0.5);

    const instinct = await boxOf(page.getByRole('button', { name: 'Instinct', exact: true }));
    for (const name of ['Mute', 'Save image', 'Pause', 'Back to menu']) {
      const tool = await boxOf(page.getByRole('button', { name, exact: true }));
      expect(Math.round(tool.width), `${name} width ${where}`).toBeGreaterThanOrEqual(44);
      expect(Math.round(tool.height), `${name} height ${where}`).toBeGreaterThanOrEqual(44);
      expect(overlaps(labelBox, tool), `${name} covers INSTINCT at ${where}`).toBe(false);
      expect(overlaps(instinct, tool), `${name} covers the Instinct button at ${where}`).toBe(
        false,
      );
    }
  }

  await page.setViewportSize({ width: 360, height: 740 });
  await page.getByRole('button', { name: 'Back to menu', exact: true }).tap();
  await page.getByRole('button', { name: /BEGIN/i }).tap();
  await expect(
    page.getByText('Tap empty space to plant an idea. Planting spends focus.'),
  ).toBeVisible();

  expect(errors).toEqual([]);
});
