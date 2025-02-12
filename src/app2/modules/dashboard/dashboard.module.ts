import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { FullCalendarModule } from '@fullcalendar/angular';
import { InvestorActivityComponent } from './pages/investor-activity/investor-activity.component';
import { InvestorMonitorComponent } from './pages/investor-monitor/investor-monitor.component';
import { ManagerViewComponent } from './pages/manager-view/manager-view.component';
import { TeamActivityComponent } from './component/team-activity/team-activity.component';
import { MyActionsComponent } from './component/my-actions/my-actions.component';
import { DiligenceActivityComponent } from './component/diligence-activity/diligence-activity.component';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { DiligenceByStatusComponent } from './component/diligence-by-status/diligence-by-status.component';
import { ImportantFullCalendarComponent } from './component/important-full-calendar/important-full-calendar.component';
import { RecentDiligencesComponent } from './component/recent-diligences/recent-diligences.component';
import { RecentDocumentsComponent } from './component/recent-documents/recent-documents.component';
import { RecentFlagsScoresRatingComponent } from './component/recent-flags-scores-rating/recent-flags-scores-rating.component';
import { RecentNotesComponent } from './component/recent-notes/recent-notes.component';
import { RecentSecAdvUpdatesComponent } from './component/recent-sec-adv-updates/recent-sec-adv-updates.component';
import { WorkflowProcessComponent } from './component/workflow-process/workflow-process.component';
import { InvestorViewComponent } from './pages/investor-view/investor-view.component';
import { HeaderCardComponent } from './component/header-cards/header-cards.component';
import { SidePanelCardComponent } from './component/side-panel-card/side-panel-card.component';
import { MyWorkComponent } from './pages/my-work/my-work.component';
import { ManagerDashboardComponent } from './pages/manager-dashboard/manager-dashboard.component';
import { EmptyStateContentComponent } from './component/empty-state-content/empty-state-content.component';
import { DashTabComponent } from './component/dash-tab/dash-tab.component';
import { RouterModule } from '@angular/router';
import { DASHBOARD_ROUTES } from './dashboard.routes';
import { DashboardViewComponent } from './pages/dashboard-container/dashboard-container.component';

@NgModule({
  declarations: [
    DashboardViewComponent,
    InvestorActivityComponent,
    InvestorMonitorComponent,
    ManagerViewComponent,
    TeamActivityComponent,
    MyActionsComponent,
    DiligenceActivityComponent,
    WorkflowProcessComponent,
    DiligenceByStatusComponent,
    RecentDocumentsComponent,
    RecentSecAdvUpdatesComponent,
    RecentDiligencesComponent,
    RecentNotesComponent,
    RecentFlagsScoresRatingComponent,
    ImportantFullCalendarComponent,
    InvestorViewComponent,
    HeaderCardComponent,
    SidePanelCardComponent,
    MyWorkComponent,
    ManagerDashboardComponent,
    EmptyStateContentComponent,
    DashTabComponent,
  ],
  imports: [CommonModule, SharedModule, RecommendationModule, FullCalendarModule,RouterModule.forChild(DASHBOARD_ROUTES)]
})
export class DashboardModule {}
