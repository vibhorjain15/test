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
import {
  ALL_FIRM_SETTING_NESTED_ROUTES,
  ALL_FIRM_SETTING_ROUTES,
} from './routes/firm-settings.routes';
import { ALL_ENTITY_ROUTES } from './routes/common.routes';


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
      await page.close();
    });

    test('All Entity module Routes', async ({}) => {
      await setupApiMocks(page, user.role);
      let allRoutes = [
        ...ALL_ENTITY_ROUTES
      ];

      for (const route of allRoutes) {
        try {
          await page.goto(`${ENV}${route.url}`);
          checkCanRoute(page.url(),route )
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
