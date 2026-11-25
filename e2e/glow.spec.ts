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

test('the glow shows an idea where it was planted, not mirrored', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?fx=glow');
  test.skip(
    !(await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))),
    'no WebGL2',
  );
  await page.getByRole('button', { name: /FREE MIND/i }).click();
  await page.waitForTimeout(500);
  await page.mouse.click(250, 600);
  await page.mouse.move(1100, 300);
  await page.waitForTimeout(500);

  // Copy the glow layer inside a frame, before the browser discards its buffer.
  // The idea drifts after birth, so look for the brightest pixel in the lower
  // left (where it was planted) and in the upper left (where a flip puts it).
  const peaks = await page.evaluate(
    () =>
      new Promise<{ planted: number; mirrored: number }>((resolve) => {
        requestAnimationFrame(() => {
          const glow = document.querySelector<HTMLCanvasElement>('canvas[aria-hidden="true"]')!;
          const copy = document.createElement('canvas');
          copy.width = glow.width;
          copy.height = glow.height;
          const ctx = copy.getContext('2d')!;
          ctx.drawImage(glow, 0, 0);
          const sx = glow.width / window.innerWidth;
          const sy = glow.height / window.innerHeight;
          const peak = (y0: number, y1: number) => {
            const d = ctx.getImageData(0, y0 * sy, 500 * sx, (y1 - y0) * sy).data;
            let best = 0;
            for (let i = 0; i < d.length; i += 4) best = Math.max(best, d[i] + d[i + 1] + d[i + 2]);
            return best;
          };
          resolve({ planted: peak(400, 720), mirrored: peak(0, 320) });
        });
      }),
  );
  expect(peaks.planted).toBeGreaterThan(450);
  expect(peaks.mirrored).toBeLessThan(300);
});
