import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyProfileComponent } from './my-profile/my-profile.component';
import { MyAccountsComponent } from './my-accounts/my-accounts.component';
import { PasswordSettingsComponent } from './password-settings/password-settings.component';
import { TfaIntroComponent } from './tfa-intro/tfa-intro.component';
import { TfaSetupComponent } from './tfa-setup/tfa-setup.component';
import { TfaStatusComponent } from './tfa-status/tfa-status.component';
import { AccountActivityComponent } from './account-activity/account-activity.component';
import { EmailNotificationsComponent } from './email-notifications/email-notifications.component';
import { MyPermissionsComponent } from './my-permissions/my-permissions.component';
import { MyAdminsComponent } from './my-admins/my-admins.component';
import { MyProfileEditComponent } from './my-profile-edit/my-profile-edit.component';
import { SharedModule } from 'src/app2/shared/shared.module';
import { UserRolesComponent } from './user-roles/user-roles.component';
import { MyTokenComponent } from './my-token/my-token.component';
import { MyPreferencesComponent } from './my-preferences/my-preferences.component';
import { MySettingsComponent } from './my-settings/my-settings.component';
import { RouterModule } from '@angular/router';
import { MY_SETTINGS_ROUTES } from './my-settings.routes';

@NgModule({
  declarations: [
    MySettingsComponent,
    MyProfileComponent,
    MyProfileEditComponent,
    MyAccountsComponent,
    PasswordSettingsComponent,
    TfaIntroComponent,
    TfaSetupComponent,
    TfaStatusComponent,
    AccountActivityComponent,
    EmailNotificationsComponent,
    MyPermissionsComponent,
    MyAdminsComponent,
    UserRolesComponent,
    MyTokenComponent,
    MyPreferencesComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(MY_SETTINGS_ROUTES),
  ],
})
export class MySettingsModule {}
