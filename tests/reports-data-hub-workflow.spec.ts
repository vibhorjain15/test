import { test, expect } from '@playwright/test';
import {
  ALL_USERS,
  checkCanRoute,
  CURRENT_ENV,
  ENV,
  EXPECT_TIMEOUT,
  getSelector,
  handleError,
  login,
  setupApiMocks,
} from './test-util';
import { ALL_DATAHUB_ROUTES, ALL_REPORTS_ROUTES, ALL_WORKFLOW_ROUTES } from './routes/common.routes';

// Load user data
let page;
// Loop through users and create tests
ALL_USERS.forEach((user) => {
  test.describe(`Testing for user role: ${user.role}`, () => {
    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await login(page, user);
      await setupApiMocks(page, user.role);
    });

    test.afterAll(async () => {
      await page.waitForTimeout(3000);
      await page.close();
    });

    test('All Datahub and Reports Routes', async ({}) => {
      await setupApiMocks(page, user.role);

      let allRoutes = [
        ...ALL_DATAHUB_ROUTES,
        ...ALL_REPORTS_ROUTES,
        ...ALL_WORKFLOW_ROUTES
      ];

      for (const route of allRoutes) {
        try {
          await page.goto(`${ENV}${route.url}`);
          checkCanRoute(page.url(), route);
          await expect(getSelector(route.selector, page)).toBeVisible({
            timeout: EXPECT_TIMEOUT,
          });
          console.log(`Passed URL: ${route.url}`);
        } catch (error) {
          handleError(page, route, error, user);
        }
      }
    });
  });
});
