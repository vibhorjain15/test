import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app2/shared/shared.module';
import { RatingsComponent } from './ratings/ratings.component';
import { ResponseHistoryComponent } from './response-history/response-history.component';
import { AssignmentsComponent } from './assignments/assignments.component';
import { ProjectSummaryComponent } from './summary/project-summary.component';
import { InvestorSummaryComponent } from './summary/investor-summary/investor-summary.component';
import { ManagerSummaryComponent } from './summary/manager-summary/manager-summary.component';
import { ProjectNotesComponent } from './notes/notes.component';
import { NotApprovalReasonsComponent } from './not-approval-reasons/not-approval-reasons.component';
import { ShareComponent } from './share/share.component';
import { ShareActionComponent } from './share/share-action/share-action.component';
import { ShareStatusComponent } from './share/share-status/share-status.component';
import { MappedEntitiesComponent } from './summary/mapped-entities/mapped-entities.component';
import { ProjectRecommendationsComponent } from './project-recommendations/project-recommendations.component';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { ShareAtComponent } from './share/share-at/share-at.component';
import { QuestionnaireModule } from '../questionnaire/questionnaire.module';
import { PROJECT_ROUTES } from './project.routes';
import { ProjectComponent } from './Page/project.component';
import { ProjectOutletComponent } from './Page/project-outlet.component';

@NgModule({
  declarations: [
    RatingsComponent,
    ResponseHistoryComponent,
    AssignmentsComponent,
    ProjectSummaryComponent,
    InvestorSummaryComponent,
    ManagerSummaryComponent,
    ProjectNotesComponent,
    NotApprovalReasonsComponent,
    ShareComponent,
    ShareActionComponent,
    ShareStatusComponent,
    ProjectRecommendationsComponent,
    MappedEntitiesComponent,
    ProjectComponent,
    ProjectOutletComponent,
    ProjectRecommendationsComponent,
    ShareAtComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RecommendationModule,
    QuestionnaireModule,
    RouterModule.forChild(PROJECT_ROUTES),
  ],
})
export class ProjectModule {}
