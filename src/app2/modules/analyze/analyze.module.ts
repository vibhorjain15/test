import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app2/shared/shared.module';
import { PortfolioAnalyticsComponent } from './analytics/portfolio-analytics/portfolio-analytics.component';
import { DashboardComponent } from './analytics/dashboard/dashboard.component';
import { DashboardRowComponent } from './analytics/dashboard-row/dashboard-row.component';
import { DashboardColumnComponent } from './analytics/dashboard-column/dashboard-column.component';
import { DashboardPanelComponent } from './analytics/dashboard-panel/dashboard-panel.component';
import { DonutChartComponent } from './analytics/donut-chart/donut-chart.component';
import { WorldMapComponent } from './analytics/world-map/world-map.component';
import { ScorecardComponent } from './scorecard/scorecard.component';
import { AnalyzeTemplatesComponent } from './benchmarking/templates/templates.component';
import { AnalyzeTemplateCategoriesComponent } from './benchmarking/templates/categories/categories.component';
import { CompareDueDiligences } from './compare/due-diligences/due-diligences.component';
import { DueDiligenceList } from './compare/due-diligence-list/due-diligence-list.component';
import { DueDiligenceListComponent } from './compare/due-diligence-list-card/due-diligence-list-card.component';
import { RouterModule } from '@angular/router';
import { ANALYZE_ROUTES } from './analyze.router';

@NgModule({
  declarations: [
    PortfolioAnalyticsComponent,
    DashboardComponent,
    DashboardRowComponent,
    DashboardColumnComponent,
    DashboardPanelComponent,
    DonutChartComponent,
    WorldMapComponent,
    ScorecardComponent,
    AnalyzeTemplatesComponent,
    AnalyzeTemplateCategoriesComponent,
    CompareDueDiligences,
    DueDiligenceList,
    DueDiligenceListComponent,
  ],
  imports: [CommonModule, SharedModule, RouterModule.forChild(ANALYZE_ROUTES)],
})
export class AnalyzeModule {}
