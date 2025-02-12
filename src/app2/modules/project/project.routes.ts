import { Routes } from '@angular/router';

import { ProjectComponent } from './Page/project.component';
import { ProjectOutletComponent } from './Page/project-outlet.component';
import { ProjectRecommendationsComponent } from './project-recommendations/project-recommendations.component';
import { AssignmentsComponent } from './assignments/assignments.component';
import { ProjectSummaryComponent } from './summary/project-summary.component';
import { ResponseHistoryComponent } from './response-history/response-history.component';
import { EntityDocumentsComponent } from '../../shared/components/entity-documents/entity-documents.component';
import { ProjectNotesComponent } from './notes/notes.component';
import { ShareComponent } from './share/share.component';
import { RatingsComponent } from './ratings/ratings.component';
import { PrintPreviewComponent } from '../questionnaire/page';
import { NotApprovalReasonsComponent } from './not-approval-reasons/not-approval-reasons.component';
import { QuestionSearchReviewComponent } from '../questionnaire/components/question-search-review/question-search-review.component';
import { CanAccessGaurd } from 'src/app2/guards/canAccess.gaurd';

const PROJECT_ENTITY_ROUTE_NAMES = {
  FUNDS: 'funds/:fundId/projects/:diligenceId',
  FUNDS_VEHICLE: 'funds/:fundId/vehicles/:vehicleId/projects/:diligenceId',
  STRATEGIES: 'strategies/:strategyId/projects/:diligenceId',
  STRATEGIES_FUNDS:
    'strategies/:strategyId/funds/:fundId/projects/:diligenceId',
  FIRMS: 'projects/:diligenceId',
} as const;

const PROJECT_ENTITY_TAB_ROUTE_NAMES = {
  RECOMMENDATIONS: 'recommendations',
  ASSIGNMENT_STATUS: 'assignment_status',
  SUMMARY: 'summary',
  QUESTIONNAIRE: 'questionnaire',
  RES_HISTORY: 'response_history',
  DOC_LIST: 'documents/list',
  NOTES: 'notes',
  SHARE: 'share',
  INVESTMENT_RATING: 'investment_ratings',
  PRINT_PREVIEW: 'print_preview',
  NOT_APPROVAL_REASONS: 'not_approval_reasons',
  SEARCH_N_REVIEW_QUESTIONS: 'search_n_review_questions',
} as const;

const PROJECT_TAB_ROUTES: Routes = [
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.RECOMMENDATIONS,
    component: ProjectRecommendationsComponent,
  },
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.ASSIGNMENT_STATUS,
    component: AssignmentsComponent,
  },
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.SUMMARY,
    component: ProjectSummaryComponent,
  },
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.RES_HISTORY,
    component: ResponseHistoryComponent,
  },
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.DOC_LIST,
    component: EntityDocumentsComponent,
  },
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.NOTES,
    component: ProjectNotesComponent,
  },
  {
    canActivate: [CanAccessGaurd],
    data: { hidden_from: ['investor'] },
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.SHARE,
    component: ShareComponent,
  },
  {
    canActivate: [CanAccessGaurd],
    data: { hidden_from: ['manager', 'FreeSubscription'] },
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.INVESTMENT_RATING,
    component: RatingsComponent,
  },
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.QUESTIONNAIRE,
    loadChildren: () =>
      import('../questionnaire/questionnaire.module').then(
        (m) => m.QuestionnaireModule
      ),
  },
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.PRINT_PREVIEW,
    component: PrintPreviewComponent,
  },
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.NOT_APPROVAL_REASONS,
    component: NotApprovalReasonsComponent,
  },
  {
    path: PROJECT_ENTITY_TAB_ROUTE_NAMES.SEARCH_N_REVIEW_QUESTIONS,
    component: QuestionSearchReviewComponent,
  },
];

export const PROJECT_ROUTES: Routes = [
  {
    path: '',
    component: ProjectComponent,
    children: [
      // This path is not needed as we dont have any such routes
      {
        path: '',
        component: ProjectOutletComponent,
        children: PROJECT_TAB_ROUTES,
      },
      {
        path: PROJECT_ENTITY_ROUTE_NAMES.FUNDS,
        component: ProjectOutletComponent,
        children: PROJECT_TAB_ROUTES,
      },
      {
        path: PROJECT_ENTITY_ROUTE_NAMES.FUNDS_VEHICLE,
        component: ProjectOutletComponent,
        children: PROJECT_TAB_ROUTES,
      },
      {
        path: PROJECT_ENTITY_ROUTE_NAMES.STRATEGIES,
        component: ProjectOutletComponent,
        children: PROJECT_TAB_ROUTES,
      },
      {
        path: PROJECT_ENTITY_ROUTE_NAMES.STRATEGIES_FUNDS,
        component: ProjectOutletComponent,
        children: PROJECT_TAB_ROUTES,
      },
      {
        path: PROJECT_ENTITY_ROUTE_NAMES.FIRMS,
        component: ProjectOutletComponent,
        children: PROJECT_TAB_ROUTES,
      },
    ],
  },
];
