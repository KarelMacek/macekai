import { test, expect, type Page } from '@playwright/test';

async function freezeAnimations(page: Page) {
  await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
}

test.describe('presentation + camera integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('8. slide navigation keeps the camera mounted and its mode unchanged', async ({ page }) => {
    await page.goto('/?mockCamera=1');
    const shell = page.getByTestId('camera-shell');
    await expect(shell).toHaveAttribute('data-mode', 'cameo');
    await expect(page.getByText('Co udělat pro svůj mozek a kariéru v IT v době AI')).toBeVisible();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('Co si dnes projdeme')).toBeVisible();
    await expect(shell).toBeAttached();
    await expect(shell).toHaveAttribute('data-mode', 'cameo');

    // Repeat while hidden, and after exiting focus.
    await page.keyboard.press('c');
    await page.keyboard.press('ArrowRight');
    // "Kdo dnes umí snít?" is both this slide's heading AND an agenda list item
    // elsewhere in the deck, so it's not a unique locator -- the quote is.
    await expect(page.getByText('Zajímavé technologie')).toBeVisible();
    await expect(shell).toBeAttached();
    await expect(shell).toHaveAttribute('data-mode', 'hidden');

    await page.keyboard.press('F9');
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowRight');
    // The section 1 divider's heading duplicates an agenda list item, so it's
    // not a unique locator -- the divider's subtitle is.
    await expect(page.getByText('Nároky rostou rychleji než naše schopnost je průběžně zpracovávat.')).toBeVisible();
    await expect(shell).toBeAttached();
    await expect(shell).toHaveAttribute('data-mode', 'hidden');
  });

  test('9. no unexpected console errors in mock-camera mode', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/?mockCamera=1');
    await page.getByTestId('mock-camera').waitFor();
    await page.keyboard.press('F9');
    await page.keyboard.press('Escape');
    await page.keyboard.press('c');
    await page.keyboard.press('c');

    expect(errors).toEqual([]);
  });

  test.describe('10. visual screenshots', () => {
    test('cameo on dark title slide', async ({ page }) => {
      await page.goto('/?mockCamera=1&mode=cameo');
      await freezeAnimations(page);
      await expect(page.getByText('Co udělat pro svůj mozek a kariéru v IT v době AI')).toBeVisible();
      await expect(page).toHaveScreenshot('cameo-dark-slide.png');
    });

    test('cameo on light slide', async ({ page }) => {
      await page.goto('/?mockCamera=1&mode=cameo');
      await freezeAnimations(page);
      await page.keyboard.press('ArrowRight');
      await expect(page.getByText('Co si dnes projdeme')).toBeVisible();
      await expect(page).toHaveScreenshot('cameo-light-slide.png');
    });

    test('hidden mode', async ({ page }) => {
      await page.goto('/?mockCamera=1&mode=hidden');
      await freezeAnimations(page);
      await expect(page).toHaveScreenshot('hidden-mode.png');
    });

    test('focus mode', async ({ page }) => {
      await page.goto('/?mockCamera=1&mode=focus');
      await freezeAnimations(page);
      await expect(page).toHaveScreenshot('focus-mode.png');
    });
  });
});
