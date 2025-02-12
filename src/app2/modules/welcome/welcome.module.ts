import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { WelcomeComponent } from './welcome.component';
import { RouterModule } from '@angular/router';
import { WELCOME_ROUTES } from './welcome.routes';

@NgModule({
  declarations: [
    WelcomeComponent
  ],
  imports: [CommonModule, SharedModule,RouterModule.forChild( WELCOME_ROUTES)],
})
export class WelcomeModule {}
