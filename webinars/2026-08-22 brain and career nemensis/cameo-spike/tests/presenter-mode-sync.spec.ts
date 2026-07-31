import { test, expect } from '@playwright/test';

// Spectacle's Presenter Mode is a second tab (?presenterMode=true) for the
// presenter's private notes/timer view; the plain tab is what's shared to
// Teams. Only the plain ("audience") tab may own the camera, and C/F9/Escape
// pressed in either tab must stay in sync via the BroadcastChannel in
// cameraChannel.ts. This exercises both tabs in one real browser context,
// which is the only way to actually prove that, not just assert it.
test.describe('presenter-mode camera sync', () => {
  test('camera lives only in the audience tab; presenter tab keeps it in sync', async ({ context }) => {
    const audience = await context.newPage();
    await audience.setViewportSize({ width: 1920, height: 1080 });
    await audience.goto('/?mockCamera=1');
    await audience.waitForSelector('[data-testid="camera-shell"]');

    const presenter = await context.newPage();
    await presenter.goto('/?mockCamera=1&presenterMode=true');
    await presenter.waitForTimeout(300);

    // Presenter tab renders no camera of its own.
    await expect(presenter.getByTestId('camera-shell')).toHaveCount(0);

    // Sanity: audience starts in cameo.
    await expect(audience.getByTestId('camera-shell')).toHaveAttribute('data-mode', 'cameo');

    // C pressed in the presenter tab hides the camera in the audience tab.
    await presenter.bringToFront();
    await presenter.keyboard.press('c');
    await expect(audience.getByTestId('camera-shell')).toHaveAttribute('data-mode', 'hidden');

    // F9 pressed in the presenter tab moves the audience tab to focus (returnMode hidden).
    await presenter.keyboard.press('F9');
    await expect(audience.getByTestId('camera-shell')).toHaveAttribute('data-mode', 'focus');
    await expect(audience.getByTestId('camera-focus-dimmer')).toBeVisible();

    // Escape in the presenter tab returns the audience tab to hidden, not cameo.
    await presenter.keyboard.press('Escape');
    await expect(audience.getByTestId('camera-shell')).toHaveAttribute('data-mode', 'hidden');

    // And the reverse direction: a key pressed in the audience tab is seen by
    // the presenter tab's own (invisible-to-Teams, but locally tracked) state --
    // proven by pressing the next key in the presenter tab and checking it acted
    // on the up-to-date mode, not a stale one. We wait for the presenter's own
    // status readout to reflect the change first: BroadcastChannel delivery is
    // fast but async, and a real presenter would likewise see the label update
    // (much slower than the sync itself) before their next keypress.
    await audience.bringToFront();
    await audience.keyboard.press('c'); // hidden -> cameo, from the audience side this time
    await expect(audience.getByTestId('camera-shell')).toHaveAttribute('data-mode', 'cameo');
    await expect(presenter.getByTestId('presenter-status')).toContainText('cameo');

    await presenter.bringToFront();
    await presenter.keyboard.press('c'); // if presenter's state were stale ("hidden"), this would go to cameo (no-op-looking); it must instead go cameo -> hidden
    await expect(audience.getByTestId('camera-shell')).toHaveAttribute('data-mode', 'hidden');

    await presenter.close();
    await audience.close();
  });
});
