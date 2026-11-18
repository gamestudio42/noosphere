import { expect, test } from '@playwright/test';

test('the WebGL glow turns on from ?fx=glow, or falls back to the flat canvas', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/?fx=glow');
  await page.getByRole('button', { name: /FREE MIND/i }).click();
  await page.mouse.click(640, 400);
  await page.waitForTimeout(1_000);

  const state = await page.evaluate(() => {
    const webgl2 = !!document.createElement('canvas').getContext('webgl2');
    const glow = document.querySelector<HTMLCanvasElement>('canvas[aria-hidden="true"]');
    return { webgl2, shown: glow?.style.display === 'block' };
  });
  // With WebGL2 the glow layer is on; without it the 2D canvas is all there is
  expect(state.shown).toBe(state.webgl2);
  const saved = await page.evaluate(() => localStorage.getItem('noosphere:settings:v1'));
  expect(JSON.parse(saved ?? '{}').glow).toBe(true);
  expect(errors).toEqual([]);
});
