import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

import { RelatedEntitiesComponent } from './firm/related-entities/related-entities.component';
import { FilingsHistoryComponent } from './firm/filings-history/filings-history.component';
import { ServiceProviderComponent } from './firm/service-provider/service-provider.component';
import { ExploreTrackComponent } from './regulatory_monitor/explore/explore-track/explore-track.component';
import { MonitorPortfolioComponent } from './regulatory_monitor/portfolio/monitor-portfolio/monitor-portfolio.component';
import { PotentialFlagsComponent } from './firm/potential-flags/potential-flags.component';
import { PrivateFundsComponent } from './firm/private-funds/private-funds.component';
import { SnapshotComponent } from './firm/snapshot/snapshot.component';
import { PrivateFundComponent } from './private-fund/private-fund.component';
import { SharedModule } from 'src/app2/shared/shared.module';
import { QuestionHistoryComponent } from './firm/question-history/question-history.component';
import { RegulatoryTabsComponent } from './regulatory_monitor/regulatory-tabs/regulatory-tabs.component';
import { AdvFirmTabsComponent } from './firm/adv-firm-tabs/adv-firm-tabs.component';
import { RouterModule } from '@angular/router';
import { FORMADV_ROUTES } from './form_adv.routes';
import {
  AdvFrimFundCellRenderComponent,
  AdvSearchComponent,
  ManageThresholdsComponent,
} from 'data-hub';
import { AdvAumMillionComponent } from 'src/app2/shared/components/adv-aum-million/adv-aum-million.component';
import { AdvFilingDateComponent } from 'src/app2/shared/components/adv-filing-date/adv-filing-date.component';
import { privateFundsService } from './firm/private-funds/private-funds.service';

export const components = [
  ExploreTrackComponent,
  MonitorPortfolioComponent,
  PrivateFundComponent,
  SnapshotComponent,
  PotentialFlagsComponent,
  PrivateFundsComponent,
  RelatedEntitiesComponent,
  FilingsHistoryComponent,
  ServiceProviderComponent,
  RegulatoryTabsComponent,
  AdvFirmTabsComponent,
  AdvSearchComponent,
  ManageThresholdsComponent,
  AdvFrimFundCellRenderComponent,
  AdvFilingDateComponent,
  AdvAumMillionComponent,
];

@NgModule({
  declarations: [...components, QuestionHistoryComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(FORMADV_ROUTES)],
  exports: [QuestionHistoryComponent],
  providers: [privateFundsService, DecimalPipe],
})
export class AdvPortfolioModule {}
