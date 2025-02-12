import { Routes } from '@angular/router';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { MySettingsComponent } from './my-settings/my-settings.component';
import { MyAccountsComponent } from './my-accounts/my-accounts.component';
import { PasswordSettingsComponent } from './password-settings/password-settings.component';
import { MyPermissionsComponent } from './my-permissions/my-permissions.component';
import { MyAdminsComponent } from './my-admins/my-admins.component';
import { EmailNotificationsComponent } from './email-notifications/email-notifications.component';
import { TfaStatusComponent } from './tfa-status/tfa-status.component';
import { AccountActivityComponent } from './account-activity/account-activity.component';
import { MyTokenComponent } from './my-token/my-token.component';
import { TfaIntroComponent } from './tfa-intro/tfa-intro.component';
import { TfaSetupComponent } from './tfa-setup/tfa-setup.component';
import { UserRolesComponent } from './user-roles/user-roles.component';
import { MyPreferencesComponent } from './my-preferences/my-preferences.component';

const mySettingsRoutesNames = {
  PROFILE: 'profile',
  MY_ACCOUNTS: 'my-accounts',
  PREF: 'preferences',
  ACCOUNT: 'account',
  EMAIL: 'email_notifications',
  MY_PERMISSIONS: 'my-permissions',
  MY_ADMINS: 'my-admins',
  ACCESS_LEVEL_MAP: 'access-level-map',
  SECURITY: {
    TWO_FACTOR_AUTHENTICATION: 'security/two_factor_authentication/status',
    ACCOUNT_ACTIVITY: 'security/account_activity',
    MY_TOKEN: 'security/my_token',
    TF_AUTHENTICATION_INTRO: 'security/two_factor_authentication/intro',
    TF_AUTHENTICATION_SETUP: 'security/two_factor_authentication/setup',
  },
};

export const MY_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: MySettingsComponent,
    children: [
      {
        path: mySettingsRoutesNames.PROFILE,
        component: MyProfileComponent,
      },
      {
        path: mySettingsRoutesNames.PREF,
        component: MyPreferencesComponent,
      },
      {
        path: mySettingsRoutesNames.MY_ACCOUNTS,
        component: MyAccountsComponent,
      },
      {
        path: mySettingsRoutesNames.ACCOUNT,
        component: PasswordSettingsComponent,
      },
      {
        path: mySettingsRoutesNames.MY_PERMISSIONS,
        component: MyPermissionsComponent,
      },
      {
        path: mySettingsRoutesNames.EMAIL,
        component: EmailNotificationsComponent,
      },
      {
        path: mySettingsRoutesNames.MY_ADMINS,
        component: MyAdminsComponent,
      },
      {
        path: mySettingsRoutesNames.SECURITY.TWO_FACTOR_AUTHENTICATION,
        component: TfaStatusComponent,
      },
      {
        path: mySettingsRoutesNames.SECURITY.ACCOUNT_ACTIVITY,
        component: AccountActivityComponent,
      },
      {
        path: mySettingsRoutesNames.SECURITY.MY_TOKEN,
        component: MyTokenComponent,
      },
      {
        path: mySettingsRoutesNames.SECURITY.TF_AUTHENTICATION_INTRO,
        component: TfaIntroComponent,
      },
      {
        path: mySettingsRoutesNames.SECURITY.TF_AUTHENTICATION_SETUP,
        component: TfaSetupComponent,
      },
      {
        path: mySettingsRoutesNames.ACCESS_LEVEL_MAP,
        component: UserRolesComponent,
      },
    ],
  },
];
