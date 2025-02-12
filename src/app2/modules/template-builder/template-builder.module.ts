import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app2/shared/shared.module';
import {
  CategoriesListComponent,
  DvMoveRowComponent,
  QuestionsListComponent,
  NestedQuestionsComponent,
  DvCheckboxGrouptComponent,
  QuestionMappingAccordionComponent,
  DvTemplateHeaderWrapperComponent,
  TemplateHeaderComponent,
  DvResponseTypePreviewComponent,
  AddQuestionComponent,
  AddAttachmentDocumentComponent,
  PreviewQuestionComponent,
  UserActivityCard,
  EditQuestionComponent,
  DvAddRuleComponent,
  SimpleRuleBuilderComponent,
  AdvancedRuleBuilderComponent,
  ReturnTablePreviewComponent,
  AumPreviewComponent,
  PresetDocumentTagsComponent,
} from './components';
import { QuestionTagMapperComponent } from './components/question-tag-mapper/question-tag-mapper.component';
import { DvListBoxDirective, PushBarPanelDirective } from './directive';
import {
  ManageCategoriesComponent,
  ManageMoveComponent,
  NewQuestionComponent,
  PasteNestedQuestionComponent,
  ConfigureGridColumnsComponent,
  EditTemplateModalComponent,
  FormulaSetupComponent,
  // NewTemplateComponent,
  // AddTemplateNoteDescriptionComponent,
  RatingMapComponent,
  EditQuestionFAQ,
} from './modals';

import {
  EditTemplateComponent,
  ScoringComponent,
  TemplateHeaderPageComponent,
  TemplatePreviewComponent,
  TemplatePrintPreviewComponent,
  TemplateBuilderComponent,
} from './page';
import { SearchHighLightPipe } from './pipe';
import {
  ConfigureQuestionMappingComponent,
  ConfigureNestedLogicComponent,
  EditQuestionModalComponent,
  SetSmartTextComponent,
} from './side-panels';
import { HttpClientModule } from '@angular/common/http';
import { ManageWidgetComponent } from './modals/manage-widget/manage-widget.component';
import { RuleCardComponent } from './components/rule-builder/rule-card/rule-card.component';
import { TEMPLATE_BUILDER_ROUTES } from './template-builder.routes';
import { RouterModule } from '@angular/router';
@NgModule({
  declarations: [
    PushBarPanelDirective,
    EditTemplateComponent,
    CategoriesListComponent,
    DvMoveRowComponent,
    SearchHighLightPipe,
    QuestionsListComponent,
    NestedQuestionsComponent,
    DvListBoxDirective,
    DvCheckboxGrouptComponent,
    TemplateHeaderComponent,
    DvTemplateHeaderWrapperComponent,
    QuestionMappingAccordionComponent,
    ConfigureNestedLogicComponent,
    EditQuestionComponent,
    ManageMoveComponent,
    ManageCategoriesComponent,
    DvResponseTypePreviewComponent,
    QuestionTagMapperComponent,
    NewQuestionComponent,
    PasteNestedQuestionComponent,
    ConfigureGridColumnsComponent,
    AddQuestionComponent,
    EditTemplateModalComponent,
    PreviewQuestionComponent,
    DvAddRuleComponent,
    ConfigureQuestionMappingComponent,
    FormulaSetupComponent,
    SetSmartTextComponent,
    ManageWidgetComponent,
    UserActivityCard,
    EditQuestionModalComponent,
    ScoringComponent,
    TemplateHeaderPageComponent,
    RatingMapComponent,
    EditQuestionFAQ,
    SimpleRuleBuilderComponent,
    AdvancedRuleBuilderComponent,
    RuleCardComponent,
    TemplatePreviewComponent,
    ReturnTablePreviewComponent,
    AumPreviewComponent,
    TemplatePrintPreviewComponent,
    PresetDocumentTagsComponent,
    TemplateBuilderComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    HttpClientModule,
    RouterModule.forChild(TEMPLATE_BUILDER_ROUTES),
  ],
})
export class TemplateBuilderModule {}
