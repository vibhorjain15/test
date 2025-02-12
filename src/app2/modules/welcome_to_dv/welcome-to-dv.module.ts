import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { WelcomeToDvComponent } from './welcome-to-dv.component';
import { RouterModule } from '@angular/router';
import { WELCOME_TO_ROUTES } from './welcome-to-dv.routes';

@NgModule({
  declarations: [
    WelcomeToDvComponent
  ],
  imports: [CommonModule, SharedModule,RouterModule.forChild( WELCOME_TO_ROUTES)]
})
export class WelocmeToDvModule {}
