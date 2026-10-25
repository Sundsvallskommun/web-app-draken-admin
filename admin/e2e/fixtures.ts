import { expect, test as base } from '@playwright/test';

const authenticatedUser = {
  name: 'E2E Admin',
  username: 'e2e-admin',
  permissions: { canUseAdminPanel: true },
};

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/api/**', async (route) => {
      const pathname = new URL(route.request().url()).pathname;

      if (pathname.endsWith('/api/me')) {
        await route.fulfill({ json: { data: authenticatedUser, message: 'ok' } });
        return;
      }

      if (pathname.endsWith('/api/admin/environment')) {
        await route.fulfill({ json: { data: { environment: 'test' } } });
        return;
      }

      if (/\/api\/namespaces\/\d+\/all$/.test(pathname)) {
        await route.fulfill({ json: { data: [], message: 'Playwright API mock' } });
        return;
      }

      throw new Error(`Unhandled API request in Playwright fixture: ${route.request().method()} ${pathname}`);
    });

    await use(page);
  },
});

export { expect };
