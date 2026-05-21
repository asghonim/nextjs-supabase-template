import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ quiet: true, path: path.resolve(__dirname, '.env.test') });

const testDir = defineBddConfig({
  features: 'features/*.feature',
  steps: '**/*.steps.ts',
  outputDir: '.', 
});

export default defineConfig({
  // testDir: './tests/e2e',
  globalSetup: require.resolve('./tests/init.ts'),
  testDir,
  fullyParallel: true,
  testIgnore: ['tests/init.ts', 'tests/*.test.ts'],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    trace: 'on',
    screenshot: 'on',
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'tests/init.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: process.env.NEXT_PUBLIC_APP_URL,
    reuseExistingServer: true,
  },
})
