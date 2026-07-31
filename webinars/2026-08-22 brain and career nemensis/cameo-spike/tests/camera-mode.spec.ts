import { test, expect, type Page } from '@playwright/test';

async function gotoSpike(page: Page, extraParams: Record<string, string> = {}) {
  const search = new URLSearchParams({ mockCamera: '1', ...extraParams }).toString();
  await page.goto(`/?${search}`);
  await page.waitForSelector('[data-testid="camera-shell"]');
}

test.describe('camera mode transitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('1. default cameo: bottom-left, ~20% width, 16:9', async ({ page }) => {
    await gotoSpike(page);
    const shell = page.getByTestId('camera-shell');
    await expect(shell).toBeVisible();
    await expect(shell).toHaveAttribute('data-mode', 'cameo');

    const box = await shell.boundingBox();
    expect(box).not.toBeNull();
    const widthRatio = box!.width / 1920;
    expect(widthRatio).toBeGreaterThanOrEqual(0.18);
    expect(widthRatio).toBeLessThanOrEqual(0.22);

    // Lower-left quadrant.
    expect(box!.x).toBeLessThan(1920 / 2);
    expect(box!.y).toBeGreaterThan(1080 / 2);

    const aspect = box!.width / box!.height;
    expect(aspect).toBeGreaterThan(1.6);
    expect(aspect).toBeLessThan(1.9);
  });

  test('2. hide and show with C', async ({ page }) => {
    await gotoSpike(page);
    const shell = page.getByTestId('camera-shell');

    await page.keyboard.press('c');
    await expect(shell).toHaveAttribute('data-mode', 'hidden');
    await expect(shell).toBeAttached();

    await page.keyboard.press('c');
    await expect(shell).toHaveAttribute('data-mode', 'cameo');
  });

  test('3. focus from cameo', async ({ page }) => {
    await gotoSpike(page);
    const shell = page.getByTestId('camera-shell');
    const presentation = page.getByTestId('presentation-layer');

    await page.keyboard.press('F9');
    await expect(shell).toHaveAttribute('data-mode', 'focus');
    await expect(presentation).toHaveAttribute('data-focus-active', 'true');
    await expect(page.getByTestId('camera-focus-dimmer')).toBeVisible();

    const box = await shell.boundingBox();
    expect(box!.width / 1920).toBeGreaterThanOrEqual(0.85);
    expect(box!.height / 1080).toBeGreaterThanOrEqual(0.75);

    await page.keyboard.press('F9');
    await expect(shell).toHaveAttribute('data-mode', 'cameo');
  });

  test('4. focus from hidden returns to hidden, not cameo', async ({ page }) => {
    await gotoSpike(page);
    const shell = page.getByTestId('camera-shell');

    await page.keyboard.press('c');
    await expect(shell).toHaveAttribute('data-mode', 'hidden');

    await page.keyboard.press('F9');
    await expect(shell).toHaveAttribute('data-mode', 'focus');

    await page.keyboard.press('F9');
    await expect(shell).toHaveAttribute('data-mode', 'hidden');
  });

  test('5. escape returns from focus to the mode before it', async ({ page }) => {
    await gotoSpike(page);
    const shell = page.getByTestId('camera-shell');

    await page.keyboard.press('F9');
    await expect(shell).toHaveAttribute('data-mode', 'focus');

    await page.keyboard.press('Escape');
    await expect(shell).toHaveAttribute('data-mode', 'cameo');
  });

  test('6. C while focused hides the camera and clears the dimmer', async ({ page }) => {
    await gotoSpike(page);
    const shell = page.getByTestId('camera-shell');
    const dimmer = page.getByTestId('camera-focus-dimmer');

    await page.keyboard.press('F9');
    await expect(shell).toHaveAttribute('data-mode', 'focus');

    await page.keyboard.press('c');
    await expect(shell).toHaveAttribute('data-mode', 'hidden');
    await expect(dimmer).toBeHidden();
  });

  test('7. modifier keys do not trigger shortcuts', async ({ page }) => {
    await gotoSpike(page);
    const shell = page.getByTestId('camera-shell');
    await expect(shell).toHaveAttribute('data-mode', 'cameo');

    await page.keyboard.press('Control+F9');
    await expect(shell).toHaveAttribute('data-mode', 'cameo');

    await page.keyboard.press('Meta+F9');
    await expect(shell).toHaveAttribute('data-mode', 'cameo');
  });
});
