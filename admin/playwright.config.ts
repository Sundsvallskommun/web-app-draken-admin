import { defineConfig, devices } from '@playwright/test';

const localBaseURL = 'http://localhost:3003';
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL ?? localBaseURL;
const isCI = process.env.CI === 'true';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer:
    externalBaseURL ? undefined : (
      {
        command: 'yarn dev',
        url: localBaseURL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
        env: {
          NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'Draken admin',
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? localBaseURL,
          NEXT_PUBLIC_API_PATH: process.env.NEXT_PUBLIC_API_PATH ?? '/api',
          NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
          NEXT_PUBLIC_ENABLE_TEMPLATE_TEST_STATUS: process.env.NEXT_PUBLIC_ENABLE_TEMPLATE_TEST_STATUS ?? 'false',
          DOMAIN_NAME: process.env.DOMAIN_NAME ?? 'localhost',
          HEALTH_AUTH: process.env.HEALTH_AUTH ?? 'false',
          HEALTH_USERNAME: process.env.HEALTH_USERNAME ?? '',
          HEALTH_PASSWORD: process.env.HEALTH_PASSWORD ?? '',
          PORT: '3003',
        },
      }
    ),
});
