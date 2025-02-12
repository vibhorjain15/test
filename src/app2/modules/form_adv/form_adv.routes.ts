import { Routes } from '@angular/router';
import { MonitorPortfolioComponent } from './regulatory_monitor/portfolio/monitor-portfolio/monitor-portfolio.component';
import { ExploreTrackComponent } from './regulatory_monitor/explore/explore-track/explore-track.component';
import { AdvSearchComponent } from 'data-hub';
import { ManageThresholdsComponent } from '../data-hub/manage-thresholds/manage-thresholds.component';
import { SnapshotComponent } from './firm/snapshot/snapshot.component';
import { PotentialFlagsComponent } from './firm/potential-flags/potential-flags.component';
import { PrivateFundsComponent } from './firm/private-funds/private-funds.component';
import { RelatedEntitiesComponent } from './firm/related-entities/related-entities.component';
import { FilingsHistoryComponent } from './firm/filings-history/filings-history.component';
import { ServiceProviderComponent } from './firm/service-provider/service-provider.component';
import { formAdvRoutesNames } from './form_adv.routes.name';
import { RegulatoryTabsComponent } from './regulatory_monitor/regulatory-tabs/regulatory-tabs.component';
import { AdvFirmTabsComponent } from './firm/adv-firm-tabs/adv-firm-tabs.component';
import { PrivateFundComponent } from './private-fund/private-fund.component';
import { CanAccessGaurd } from 'src/app2/guards/canAccess.gaurd';
import { QuestionHistoryComponent } from './firm/question-history/question-history.component';

export const FORMADV_ROUTES: Routes = [
  {
    path: formAdvRoutesNames.REGULATORY_MONITOR,
    component: RegulatoryTabsComponent,
    children: [
      {
        path: formAdvRoutesNames.PORTFOLIO,
        component: MonitorPortfolioComponent,
      },
      {
        path: formAdvRoutesNames.EXPLORE,
        component: ExploreTrackComponent,
      },
    ],
  },
  {
    path: formAdvRoutesNames.SERVICE_PROVIDER,
    component: ServiceProviderComponent,
  },
  {
    path: formAdvRoutesNames.PRIVATEFUND,
    component: PrivateFundComponent,
  },
  {
    path: formAdvRoutesNames.ADV_SEARCH,
    component: AdvSearchComponent,
  },
  {
    canActivate: [CanAccessGaurd],
    data: { can_upgrade: true , hidden_from: ['FreeInvestor','FreeManager'],},
    path: formAdvRoutesNames.THRESHOLDS,
    component: ManageThresholdsComponent,
  },
  {
    path: formAdvRoutesNames.FIRM,
    component: AdvFirmTabsComponent,
    canActivate: [CanAccessGaurd],
    data: { hidden_from: ['securityAdmin'] },
    children: [
      {
        path: formAdvRoutesNames.SNAPSHOT,
        component: SnapshotComponent,
      },
      {
        path: formAdvRoutesNames.POTENTIAL_FLAGS,
        component: PotentialFlagsComponent,
      },
      {
        path: formAdvRoutesNames.PRIVATE_FUNDS,
        component: PrivateFundsComponent,
      },
      {
        path: formAdvRoutesNames.RELATED_ENTITIES,
        component: RelatedEntitiesComponent,
      },
      {
        path: formAdvRoutesNames.FILINGS_HISTORY,
        component: FilingsHistoryComponent,
      },
      {
        path: formAdvRoutesNames.QUESTIONS_HISTORY,
        component: QuestionHistoryComponent,
      },
    ],
  },
];
