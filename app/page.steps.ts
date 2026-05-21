import { Given, Then, When } from '../fixtures.steps';
import { expect } from 'playwright/test';


Given('I am using a mobile device', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
});

When('I go to root page', async ({ page }) => {
  const url = `/`;

  const response = await page.goto(url, { waitUntil: 'networkidle' });
  expect(response?.ok()).toBeTruthy();
});

Then('I see in title {string}', async ({ page }, text: string) => {
  await expect(page).toHaveTitle(new RegExp(text));
});