import { test, expect } from '@playwright/test';
import {
  ALL_USERS,
  checkCanRoute,
  CURRENT_ENV,
  ENV,
  EXPECT_TIMEOUT,
  getSelector,
  handleError,
  invokeAction,
  login,
  setupApiMocks,
} from './test-util';
import {
  ALL_FIRM_SETTING_NESTED_ROUTES,
  ALL_FIRM_SETTING_ROUTES,
} from './routes/firm-settings.routes';
import { ALL_ENTITY_ROUTES, ALL_NEW_MENU_ROUTES } from './routes/common.routes';

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

    test('All New Menu Routes', async ({}) => {
      await setupApiMocks(page, user.role);
      let allRoutes = [...ALL_NEW_MENU_ROUTES];

      for (const route of allRoutes) {
        try {
          if (route?.url) {
            await page.goto(`${ENV}${route.url}`);
            checkCanRoute(page.url(), route);
          }
          page.locator('a').filter({ hasText: /^New$/ }).dblclick();
          if (route?.selector?.action)
            invokeAction(route.selector.location, page);
          await expect(getSelector(route.selector, page)).toBeVisible({
            timeout: EXPECT_TIMEOUT,
          });
          if (route?.url) console.log(`Passed URL: ${route.url}`);

          // if (
          //   await page
          //     .getByLabel('Close')
          //     .isVisible({ timeout: EXPECT_TIMEOUT })
          // ) {
          await page.getByLabel('Close').click();
          // }
        } catch (error) {
          // if (
          //   await page
          //     .getByLabel('Close')
          //     .isVisible({ timeout: EXPECT_TIMEOUT })
          // ) {
          await page.getByLabel('Close').click();
          // }
          handleError(page, route, error, user);
        }
      }
    });
    test(`All New Menu Routes for ${user.role}`, async ({}) => {
      await setupApiMocks(page, user.role);

      try {
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();
        await page.locator('a').filter({ hasText: 'Request' }).click();
        await page.getByText('Select the purpose for this').click();
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();
        await page.locator('a').filter({ hasText: 'Firm' }).click();
        await page.getByLabel('SafeValue must use [property').click();
        await page.getByLabel('Close').click();
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();
        await page.locator('a').filter({ hasText: 'Strategy' }).click();
        await page.getByLabel('SafeValue must use [property').click();
        await page.getByLabel('Close').click();
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();
        await page.locator('a').filter({ hasText: 'Product' }).click();
        await page.getByLabel('SafeValue must use [property').click();
        await page.getByLabel('Close').click();
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();
        await page.locator('a').filter({ hasText: 'Vehicle' }).click();
        await page.getByLabel('SafeValue must use [property').click();
        await page.getByLabel('Close').click();
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();
        await page.locator('a').filter({ hasText: 'Contact' }).click();
        await page.getByLabel('SafeValue must use [property').click();
        await page.getByLabel('Close').click();
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();
        await page
          .getByRole('menu')
          .locator('a')
          .filter({ hasText: 'Template' })
          .click();
        await page.getByLabel('SafeValue must use [property').click();
        await page.getByLabel('Close').click();
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();
        await page
          .getByRole('menu')
          .locator('a')
          .filter({ hasText: 'Document' })
          .click();
        await page.getByLabel('SafeValue must use [property').click();
        await page.getByLabel('Close').click();
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();
        await page
          .locator('a')
          .filter({ hasText: 'Presentation Design' })
          .click();
        await page.getByLabel('SafeValue must use [property').click();
        await page.getByLabel('Close').click();
        await page.locator('a').filter({ hasText: /^New$/ }).dblclick();

        await page
          .getByRole('menu')
          .locator('a')
          .filter({ hasText: 'Presentation Reports' })
          .click();
        await page.getByText('Select your report design and').click();
      } catch (error) {
        if (
          await page.getByLabel('Close').isVisible({ timeout: EXPECT_TIMEOUT })
        ) {
          await page.getByLabel('Close').click();
        }
        handleError(page, 'modal', error, user);
      }
    });
  });
});
