import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { CreateInboundComponent } from './create-inbound/create-inbound.component';
import { ManageInboundComponent } from './manage-inbound/manage-inbound.component';
import { InboundGridComponent } from './inbound-grid/inbound-grid.component';
import { InboundContactsComponent } from './inbound-contacts/inbound-contacts.component';
import { InboundLinksComponent } from './inbound-links/inbound-links.component';
import { InboundViewComponent } from './inbound-view/inbound-view.component';
import { InboundActionsComponent } from './inbound-actions/inbound-actions.component';
import { ViewInboundComponent } from './view-inbound/view-inbound.component';
import { InvestorPitchComponent } from './investor-pitch/investor-pitch.component';
import { ReviewRequestComponent } from './review-request/review-request.component';
import { InvestorPitchGridComponent } from './investor-pitch-grid/investor-pitch-grid.component';
import { InvestorPitchActionComponent } from './investor-pitch-action/investor-pitch-action.component';
import { InboundNameComponent } from './inbound-name/inbound-name.component';
import { InboundVisiblityComponent } from './inbound-visiblity/inbound-visiblity.component';
import { InboundTemplateNameComponent } from './inbound-template-name/inbound-template-name.component';
import { InboundEmailTemplateComponent } from './inbound-email-template/inbound-email-template.component';
import { InboundInvestorFirmsComponent } from './inbound-investor-firms/inbound-investor-firms.component';
import { RouterModule } from '@angular/router';
import { INVESTOR_PITCH_ROUTES } from './investor-pitch.routes';

@NgModule({
  declarations: [
    CreateInboundComponent,
    ManageInboundComponent,
    InboundContactsComponent,
    InboundLinksComponent,
    InboundViewComponent,
    InboundActionsComponent,
    ViewInboundComponent,
    InvestorPitchComponent,
    ReviewRequestComponent,
    InvestorPitchGridComponent,
    InvestorPitchActionComponent,
    InboundNameComponent,
    InboundVisiblityComponent,
    InboundTemplateNameComponent,
    InboundEmailTemplateComponent,
    InboundInvestorFirmsComponent,
    InboundGridComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    CreateInboundComponent,
    ManageInboundComponent,
    InboundContactsComponent,
    InboundLinksComponent,
    InboundViewComponent,
    InboundActionsComponent,
    ViewInboundComponent,
    InvestorPitchComponent,
    ReviewRequestComponent,
    InvestorPitchGridComponent,
    InvestorPitchActionComponent,
    InboundNameComponent,
    InboundVisiblityComponent,
    InboundTemplateNameComponent,
    InboundEmailTemplateComponent,
    InboundInvestorFirmsComponent,
    InboundGridComponent,
  ],
})
export class InboundManagementCommonModule {}

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    InboundManagementCommonModule,
    RouterModule.forChild(INVESTOR_PITCH_ROUTES),
  ],
})
export class InboundManagementModule {}

@NgModule({
  declarations: [],
  imports: [CommonModule, SharedModule, InboundManagementCommonModule],
})
export class InboundManagementPrivateModule {}
