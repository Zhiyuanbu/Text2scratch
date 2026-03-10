
const { test, expect, chromium } = require('playwright/test');
const path = require('path');
const extensionPath = path.resolve('extension/scratch-text-editor');

let context;
let page;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: false,
    args: [
      '--disable-extensions-except=' + extensionPath,
      '--load-extension=' + extensionPath
    ]
  });
  page = await context.newPage();
});

test.afterAll(async () => {
  await context.close();
});

test('injects the Text tab into Scratch editor', async () => {
  await page.goto('https://scratch.mit.edu/projects/editor', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(9000);
  const tab = page.locator('#t2s-scratch-text-tab');
  await expect(tab).toHaveText('Text');
  await tab.click();
  await expect(page.locator('#t2s-scratch-text-overlay')).toBeVisible();
  await page.screenshot({ path: path.resolve('output/playwright/extension-smoke.png'), fullPage: true });
});
