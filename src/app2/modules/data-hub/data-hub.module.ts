import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { ManageThresholdsComponent } from './manage-thresholds/manage-thresholds.component';
import { SharedModule } from 'src/app2/shared/shared.module';
import { ResourcesComponent } from './resources/resources.component';
import { MfwComponent } from './mfw/mfw.component';
import { AdvFrimFundCellRenderComponent } from './adv-frim-fund-cell-render/adv-frim-fund-cell-render.component';
import { RouterModule } from '@angular/router';
import { DATAHUB_ROUTES } from './data-hub.routes';

@NgModule({
  declarations: [
    ResourcesComponent,
    MfwComponent,
    ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(DATAHUB_ROUTES)
  ],
  providers: [DatePipe]
})
export class DataHubModule { }
