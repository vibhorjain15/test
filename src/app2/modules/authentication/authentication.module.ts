import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { ActivateComponent } from './components/activate/activate.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ForgetPasswordComponent } from './components/forget-password/forget-password.component';
import { LoginComponent } from './components/login/login.component';
import { InboundSignupComponent } from './components/inbound-signup/inbound-signup.component';
import { NgxCaptchaModule } from 'ngx-captcha';
@NgModule({
  declarations: [
    ActivateComponent,
    ResetPasswordComponent,
    ForgetPasswordComponent,
    LoginComponent,
    InboundSignupComponent,
  ],
  imports: [CommonModule, SharedModule, NgxCaptchaModule],
})
export class AuthenticationModule {}
