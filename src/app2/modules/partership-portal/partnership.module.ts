import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app2/shared/shared.module';
import {
  PartnershipCardComponent,
  PartnershipListComponent,
  PartnersDetailComponent,
  PartnershipPortalComponent,
  LeftMenuPanelComponent,
} from './index';
import { PARTNERSHIP_ROUTES } from './partnership.routes';
import { RouterModule } from '@angular/router';
@NgModule({
  declarations: [
    PartnershipCardComponent,
    PartnershipListComponent,
    PartnersDetailComponent,
    PartnershipPortalComponent,
    LeftMenuPanelComponent,
  ],
  imports: [
    SharedModule,
    CommonModule,
    RouterModule.forChild(PARTNERSHIP_ROUTES),
  ],
  exports: [RouterModule],
})
export class PartnerShipModule {}
