import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app2/shared/shared.module';
import {
  RecommendationDescriptionComponent,
  RecommendationPanelComponent,
  NewRecommendaitonPanelComponent,
  RecommendationGridComponent,
  RecommendationsComponent,
} from './components';
import {
  IssueLevelTagComponent,
  IssueTagComponent,
  IssueTagsComponent,
  MediumDateCellRendererComponent,
  CellHtmlComponent,
} from './ag-cell-renderers';
@NgModule({
  declarations: [
    RecommendationDescriptionComponent,
    RecommendationPanelComponent,
    IssueLevelTagComponent,
    IssueTagComponent,
    IssueTagsComponent,
    NewRecommendaitonPanelComponent,
    RecommendationGridComponent,
    RecommendationsComponent,
    MediumDateCellRendererComponent,
    CellHtmlComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    RecommendationDescriptionComponent,
    RecommendationPanelComponent,
    IssueLevelTagComponent,
    IssueTagComponent,
    IssueTagsComponent,
    NewRecommendaitonPanelComponent,
    RecommendationGridComponent,
    RecommendationsComponent,
    MediumDateCellRendererComponent,
    CellHtmlComponent,
  ],
})
export class RecommendationModule {}
