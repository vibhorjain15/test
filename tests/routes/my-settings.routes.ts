export const ALL_MY_SETTING_ROUTES: any = [
  {
    url: '/app/settings/profile',
    selector: { role: 'heading', name: 'My Profile' },
  },
  {
    url: '/app/settings/my-accounts',
    selector: { role: 'heading', name: 'My Accounts' },
  },
  {
    url: '/app/settings/account',
    selector: { role: 'heading', name: 'Change Password' },
  },
  {
    url: '/app/settings/security/two_factor_authentication/status',
    selector: { role: 'heading', name: 'Two-factor Authentication' },
  },
  {
    url: '/app/settings/security/account_activity',
    selector: { role: 'heading', name: 'Account Activity' },
  },
  {
    url: '/app/settings/security/my_token',
    selector: { role: 'heading', name: 'My Token' },
  },
  {
    url: '/app/settings/email_notifications',
    selector: { role: 'heading', name: 'Email Notifications' },
  },
  {
    url: '/app/settings/my-permissions',
    selector: { role: 'heading', name: 'Teams' },
  },
  {
    url: '/app/settings/my-admins',
    selector: { role: 'heading', name: 'My Admins' },
  },
];

export const ALL_MY_SETTING_NESTED_ROUTES: any = [
  {
    url: '/app/firms/47610/funds/8496/profile/monitor',
    selector: { role: 'heading', name: 'Relationship Summary' },
  },
];
