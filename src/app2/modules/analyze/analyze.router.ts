import { PortfolioAnalyticsComponent } from './analytics/portfolio-analytics/portfolio-analytics.component';
import { AnalyzeTemplateCategoriesComponent } from './benchmarking/templates/categories/categories.component';
import { AnalyzeTemplatesComponent } from './benchmarking/templates/templates.component';
import { DueDiligenceList } from './compare/due-diligence-list/due-diligence-list.component';
import { CompareDueDiligences } from './compare/due-diligences/due-diligences.component';
import { ScorecardComponent } from './scorecard/scorecard.component';

export const analyzeRoutesNames = {
  SCORECARD: 'scorecard',
  DUE_DILI_LIST: 'compare/due_diligence_list',
  COMPARE: 'compare',
  DUE_DILI: 'compare/due_diligences',
  TEMPLATES: 'templates',
  PORFOLIO: 'portfolio',
};

export const ANALYZE_ROUTES = [
  {
    path: analyzeRoutesNames.SCORECARD,
    component: ScorecardComponent,
  },
  {
    path: analyzeRoutesNames.DUE_DILI_LIST,
    component: DueDiligenceList,
  },
  {
    path: analyzeRoutesNames.DUE_DILI,
    component: CompareDueDiligences,
  },
  {
    path: analyzeRoutesNames.TEMPLATES,
    component: AnalyzeTemplatesComponent,
    // onSameUrlNavigation: 'reload',
    children: [
      {
        path: ':templateId/categories',
        component: AnalyzeTemplateCategoriesComponent,
      },
      {
        path: ':templateId/categories/:categoryId/responses',
        component: AnalyzeTemplateCategoriesComponent,
      },
    ],
  },
  {
    path: analyzeRoutesNames.PORFOLIO,
    component: PortfolioAnalyticsComponent,
  },
];
