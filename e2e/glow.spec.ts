import { expect, Page, test } from '@playwright/test';

const glowState = (page: Page) =>
  page.evaluate(() => {
    const webgl2 = !!document.createElement('canvas').getContext('webgl2');
    // Same probe as the game: the performance-caveat flag, then the renderer name
    // (headless Chromium accepts the flag but reports SwiftShader)
    const gl = document
      .createElement('canvas')
      .getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    const renderer = gl
      ? String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
      : '';
    const hardware =
      !!gl &&
      !/swiftshader|llvmpipe|softpipe|lavapipe|software|basic render driver/i.test(renderer);
    const glow = document.querySelector<HTMLCanvasElement>('canvas[aria-hidden="true"]');
    return { webgl2, hardware, shown: glow?.style.display === 'block' };
  });

const startFreeMind = async (page: Page, url: string) => {
  await page.goto(url);
  await page.getByRole('button', { name: /FREE MIND/i }).click();
  await page.mouse.click(640, 400);
  await page.waitForTimeout(1_000);
};

const savedGlow = async (page: Page) =>
  JSON.parse((await page.evaluate(() => localStorage.getItem('noosphere:settings:v1'))) ?? '{}')
    .glow;

test('the WebGL glow turns on from ?fx=glow, or falls back to the flat canvas', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await startFreeMind(page, '/?fx=glow');
  const state = await glowState(page);
  // With WebGL2 the glow layer is on; without it the 2D canvas is all there is
  expect(state.shown).toBe(state.webgl2);
  expect(await savedGlow(page)).toBe('on');
  expect(errors).toEqual([]);
});

test('by default the glow runs only on a hardware GPU', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await startFreeMind(page, '/');
  const state = await glowState(page);
  // Headless Chromium renders WebGL in software, so this is usually off in CI
  expect(state.shown).toBe(state.hardware);
  expect(await savedGlow(page)).toBe('auto');
  expect(errors).toEqual([]);
});
