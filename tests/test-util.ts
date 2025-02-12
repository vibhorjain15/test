import { mock_data } from './mock-data/mock-data.util';
import { ALL_ENV, LOCAL } from './types/all-env.type';
import { ALL_USER_ROLE } from './types/user-role.type';
export const ENV = LOCAL;

export const CURRENT_ENV = ALL_ENV.FEATURE;

export const ALL_USERS = [
  {
    username: 'nikhil.kumar+securityadmin@diligencevault.com',
    password: 'Test@123',
    role: ALL_USER_ROLE.SECURITY_ADMIN,
  },
  {
    username: 'investors@diligencevault.com',
    password: 'TestInvest@r!123',
    role: ALL_USER_ROLE.ADMIN,
  },
  {
    username: 'nikhil.kumar+freemanager@diligencevault.com',
    password: 'Test@123',
    role: ALL_USER_ROLE.FREE_MANAGER,
  },
  {
    username: 'nikhil.kumar+freeinvestor@diligencevault.com',
    password: 'Test@123',
    role: ALL_USER_ROLE.FREE_INVESTOR,
  },
  {
    username: 'nikhil.kumar+productiveinvestor@diligencevault.com',
    password: 'Test@123',
    role: ALL_USER_ROLE.PRODUCTIVE_SUB,
  },
];

export const EXPECT_TIMEOUT = 3000;

export const getSelector = (selector, page) => {
  switch (selector.role) {
    case 'label':
      return page.getByLabel(selector.name, { exact: true });
    case 'text':
      return page.getByText(selector.name, { exact: true });
    case 'heading':
      return page.getByRole(selector.role, { name: selector.name });
    case 'a':
      return page.locator('a').filter({ hasText: selector.name });
  }
  return page;
};

export const invokeAction = (selector, page) => {
  switch (selector.locator) {
    case 'a':
      return page
        .getByRole(selector.role)
        .locator('a')
        .filter({ hasText: selector.name })
        .click();
  }
};

export const checkCanRoute = (page, route) => {
  //  Check if the current URL matches the expected URL
  const currentUrl = new URL(page);
  const expectedUrl = new URL(`${ENV}${route.url}`);

  if (currentUrl.pathname !== expectedUrl.pathname) {
    throw new Error(
      `URL mismatch. Expected: ${expectedUrl.pathname}, Got: ${currentUrl.pathname}`
    );
  }
};

export async function setupApiMocks(page, role): Promise<void> {
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    let mockResponse = null;
    // if (url.includes('ewfwefef')) {
    //   mockResponse = mock_data[CURRENT_ENV].team_member;
    // } else
    if (url.includes('api/account') && !mock_data[CURRENT_ENV][role].account) {
      const response = await route.continue();
      const responseBody = await response?.json();
      mock_data[CURRENT_ENV][role].account = responseBody;
    } else if (
      url.includes('api/users/me') &&
      !mock_data[CURRENT_ENV][role].me
    ) {
      const response = await route.continue();
      const responseBody = await response?.json();
      mock_data[CURRENT_ENV][role].me = responseBody;
    } else if (url.includes('api/service/dvapi_service/task_file_list')) {
      mockResponse = [];
    } else if (url.includes('api/operators')) {
      mockResponse = mock_data[CURRENT_ENV][role].operators;
    } else if (url.includes('api/functions')) {
      mockResponse = mock_data[CURRENT_ENV][role].functions;
    } else if (url.includes('api/subscription_limits')) {
      mockResponse = mock_data[CURRENT_ENV][role].subscription_limits;
    }

    if (mockResponse) {
      await route.fulfill({ json: mockResponse });
    } else {
      try {
        await route?.continue();
      } catch (e) {
        console.log(route.request().url());
      }
    }
  });
}

// Helper function for login
export async function login(page, user) {
  await page.goto(`${ENV}/login`);
  await page.getByPlaceholder('Email').click();
  await page.getByPlaceholder('Email').fill(user.username);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByPlaceholder('Password').click();
  await page.getByPlaceholder('Password').fill(user.password);
  await page.getByRole('button', { name: 'Log in' }).click();

  if (user.username == 'investors@diligencevault.com') {
    await page.getByText('World Pensions').click();
  }

  await page.waitForTimeout(10000);
}

export async function handleError(page, route, error, user): Promise<void> {
  try {
    console.error(`------------------------------------------`);
    console.error(`Failed URL: ${route?.url}`);
    console.error(`Error: ${route?.url} ${error.message}`);
    await page.screenshot({
      path: `test-screen-shots/error-${user.role}-${route?.url?.replace(
        /\//g,
        '-'
      )}.png`,
    });
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}
