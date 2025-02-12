import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ButtonDirective } from './directives/button.directive';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { ColDirective } from './directives/col.directive';
import { IconDirective } from './directives/icon.directive';
import { OffsetDirective } from './directives/offset.directive';
import { HtmlDiffCompareDirective } from './directives/html-diff.directive';
import { FilterByPipe } from './pipes/filter-by.pipe';
import { FilterPipe } from './pipes/filter.pipe';
import { InterpolatePipe } from './pipes/interpolate.pipe';
import { OrderByPipe } from './pipes/order-by.pipe';
import { SearchHighLightPipe } from './pipes/search-highlight.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AgGridSideBarComponent } from './components/ag-grid-side-bar/ag-grid-side-bar.component';
import { DvCheckboxComponent } from './components/dv-checkbox/dv-checkbox.component';
import { CheckboxComponent } from './components/checkbox/checkbox.component';
import { CustomFieldViewerComponent } from './components/custom-field-viewer/custom-field-viewer.component';
import { DvGridComponent } from './components/dv-grid/dv-grid.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { FormGroupComponent } from './components/form-group/form-group.component';
//import { HomeComponent } from './components/home/home.component';
import { RadioComponent } from './components/radio/radio.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { TagsManagerComponent } from './components/tags-manager/tags-manager.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
import { AgGridModule } from 'ag-grid-angular';
import { UiSwitchModule } from 'ngx-ui-switch';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { MenuItemComponent } from './components/menu-item/menu-item.component';
import { MenuItemPlusComponent } from './components/menu-item-plus/menu-item-plus.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PlatformActivityPanelComponent } from './components/platform-activity-panel/platform-activity-panel.component';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ColorPickerModule } from 'ngx-color-picker';
import { TagInputModule } from 'ngx-chips';
import { RatingModule } from 'ngx-bootstrap/rating';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { LimitToPipe } from './pipes/limit-to.pipe';
import { AttachmentIconComponent } from './components/attachment-icon/attachment-icon.component';
import { StandardPluralizePipe } from './pipes/standard-pluralize.pipe';
import { TilesAdjusterDirective } from './directives/tiles-adjuster.directive';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { HotTableModule } from '@handsontable/angular';
import { DateRangePickerComponent } from './components/date-range-picker/date-range-picker.component';
import { ActionsCellRendererComponent } from './components/actions-cell-renderer/actions-cell-renderer.component';
import { DeleteActionCellRendererComponent } from './components/delete-action-cell-renderer/delete-action-cell-renderer.component';
import { EmailTemplateActionsComponent } from './components/email-template-actions/email-template-actions.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ProjectStatusRendererComponent } from './components/project-status-renderer/project-status-renderer.component';
import { ProjectTypeRendererComponent } from './components/project-type-renderer/project-type-renderer.component';
import { ProjectStatusIconRendererComponent } from './components/project-status-icon-renderer/project-status-icon-renderer.component';
import { ProgressBarRendererComponent } from './components/progress-bar-renderer/progress-bar-renderer.component';
import { ProjectActionsSentTabRendererComponent } from './components/project-actions-sent-tab-renderer/project-actions-sent-tab-renderer.component';
import { DisclaimerActionsComponent } from './components/disclaimer-actions/disclaimer-actions.component';
import { MyAccountsActionsComponent } from './components/my-accounts-actions/my-accounts-actions.component';
import { ModalComponent } from './components/modal/modal.component';
import { ModalModule } from 'ngx-bootstrap/modal';
import { FieldPreviewComponent } from './components/field-preview/field-preview.component';
import { DvOptionSelectorComponent } from './components/dv-option-selector/dv-option-selector.component';
import { DvBulkListBuilderNewComponent } from './components/dv-bulk-list-builder/dv-bulk-list-builder.component';
import { NgListNewDirective } from './directives/ng-list.directive';
import { EntityActionComponent } from './components/entity-action/entity-action.component';
import { MyAdminEmailActionComponent } from './components/my-admin-email-action/my-admin-email-action.component';
import { EmailTemplateContentComponent } from './components/email-template-content/email-template-content.component';
import { PrintSectionDirective } from './directives/print-section.directive';
import { EmailTemplateNameComponent } from './components/email-template-name/email-template-name.component';
import { ManageThresholdModal } from './modals/manage-threshold/manage-threshold.component';

import { AutosizeModule } from 'ngx-autosize';
import { MfwRequestModal } from './modals/mfw-request/mfw-request.component';
import { DocumentNameCellRendererComponent } from './components/document-name-cell-renderer/document-name-cell-renderer.component';
import { GroupableFieldNameComponent } from './components/groupable-field-name/groupable-field-name.component';
import { GroupableGroupNameComponent } from './components/groupable-group-name/groupable-group-name.component';
import { DocumentActionComponent } from './components/document-action/document-action.component';
import { DocumentDetailComponent } from './components/document-detail/document-detail.component';
import { DvMeetingsComponent } from './common/dv-meetings/dv-meetings.component';
import { MeetingsDetailComponent } from './common/dv-meetings/meetings-detail/meetings-detail.component';
import { DvDocumentsComponent } from './common/dv-documents/dv-documents.component';
import { DvNotesComponent } from './common/dv-notes/dv-notes.component';
import { DvTasksComponent } from './common/dv-tasks/dv-tasks.component';
import { DvWorkflowsComponent } from './common/dv-workflows/dv-workflows.component';
import { FundReturnComponent } from './common/fund-return/fund-return.component';
import { SearchInputComponent } from './common/search-input/search-input.component';
import { ShareClassTableComponent } from './common/share-class-table/share-class-table.component';
import { StrategyDdqsComponent } from './common/strategy-ddqs/strategy-ddqs.component';
import { ContactNameComponent } from './components/contact-name/contact-name.component';
import { EntityStatusComponent } from './components/entity-status/entity-status.component';
import { DocumentViewerDirective } from './directives/document-viewer.directive';
import { AuthorizedViewDirective } from './directives/authorized-view.directive';
import { AddDomainModal } from './components/modal/add-domain/add-domain.component';
import { AddIpConfigModal } from './components/modal/add-ipconfig/add-ipconfig.component';
import { ManageWorkflowModal } from './components/modal/manage-workflow/manage-workflow.component';
import { ManageWorkflowStepModal } from './components/modal/manage-workflow-step/manage-workflow-step.component';
import { ManageDisclaimerModal } from './components/modal/manage-disclaimer/manage-disclaimer.comonent';
import { ViewDisclaimerModal } from './components/modal/view-disclaimer/view-disclaimer.component';
import { ManageEmailTemplateModal } from './components/modal/manage-email-template/manage-email-template.component';
import { ViewEmailModal } from './components/modal/view-email-template/view-email-template.component';
import { RatingSchemeModal } from './components/modal/add-rating-scheme/add-rating-scheme.component';
import { ManageRiskRatingModal } from './components/modal/manage-risk-rating-categories/manage-risk-rating-categories.component';
import { AddRatingScaleModal } from './components/modal/add-rating-scale/add-rating-scale.component';
import { ManageRatingScaleModal } from './components/modal/manage-rating-scale/manage-rating-scale.component';
import { UpdateImageModal } from './components/modal/update-image/update-image.component';
import { ManageExportTemplateModal } from './components/modal/manage-export-template/manage-export-template.component';
import { ViewServiceProviderModal } from './components/modal/view-service-provider/view-service-provider.component';
import { ClipboardModule } from 'ngx-clipboard';
import { ManagePermissionModal } from './components/modal/manage-permission/manage-permission.component';
import { AddTeamPermissionComponent } from './components/add-team-permissions/add-team-permissions.component';
import { DvSelectorListComponent } from './components/dv-selector-list/dv-selector-list.component';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { AddTeamModal } from './components/modal/new-team/new-team.component';
import { EditTeamModal } from './components/modal/edit-team/edit-team.component';
import { DvHeatmapDirective } from './directives/heatmap/heatmap.directive';
import { HeatMapComponent } from './components/heatmap/heatmap.component';
import { AddInternalContactsModal } from './modals/add-internal-contacts/add-internal-contacts.component';
import { DvSubscriberSelectionComponent } from './components/dv-subscriber-selection/dv-subscriber-selection.component';
import { GetFirstLetterPipe } from './pipes/get-first-letter.pipe';
import { DvTeamMemberSelectorComponent } from './components/dv-team-member-selector/dv-team-member-selector.component';
import { ManageAddressModal } from './modals/manage-address/manage-address.component';
import { WorkflowTagsComponent } from './components/workflow-tags/workflow-tags.component';
import { WorkflowNameComponent } from './components/workflow-name/workflow-name.component';
import { DisclaimerNameComponent } from './components/disclaimer-name/disclaimer-name.component';
import { ExcelSyncUploadActionComponent } from './components/excel-sync-upload-action/excel-sync-upload-action.component';
import { ExcelSyncStatusComponent } from './components/excel-sync-status/excel-sync-status.component';
import { PaginationBarComponent } from './components/dv-grid/pagination-bar/pagination-bar.component';
import { FunctionUsersComponent } from './components/function-users/function-users.component';
import { FunctionsActionsRendererComponent } from './components/functions-actions-renderer/functions-actions-renderer.component';
import { HoverClassDirective } from './directives/hover-class.directive';
import { TextFloatingFilterComponent } from './components/text-floating-filter-component/text-floating-filter-component.component';
import { AddDdqModal } from './modals/add-ddq/add-ddq.component';
import { ManageEventModal } from './modals/manage-event/manage-event.component';
import { TriggerWorkflowModal } from './modals/trigger-workflow/trigger-workflow.component';
import { ManageTaskModal } from './modals/manage-task/manage-task.component';
import { ManageAumModal } from './modals/manage-aum/manage-aum.component';
import { MyAdminNameActionComponent } from './components/my-admin-name-action/my-admin-name-action.component';
import { DvButtonComponent } from './components/dv-button/dv-button.component';
import { RemoveUnderscoresPipe } from './pipes/remove-underscores.pipe';
import { DvCustomFieldsComponent } from './common/dv-custom-fields/dv-custom-fields.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { DvStepperComponent } from './components/dv-stepper/dv-stepper.component';
import { DatePickerComponent } from './components/date-picker/date-picker.component';
import { DvStepLabel } from './components/dv-stepper/dv-step-label/dv-step-label.directive';
import {
  DvStepButonNext,
  DvStepButonPrevious,
} from './components/dv-stepper/dv-step-button/dv-step-button.directive';
import { DvStepComponent } from './components/dv-stepper/dv-step/dv-step.component';
import { TinymceEditorComponent } from './components/tinymce-editor/tinymce-editor.component';
import { InboundCreateConfirmComponent } from './modals/inbound-create-confirm/inbound-create-confirm.component';
import { CleanHtmlPipe } from './pipes/clean-html.pipe';
import { ExcelSyncFileNameComponent } from './components/excel-sync-file-name/excel-sync-file-name.component';
import { DropdownFloatingFilterComponent } from './components/dropdown-floating-filter/dropdown-floating-filter.component';
import { ProjectEntityNameRendererComponent } from './components/project-entity-name-renderer/project-entity-name-renderer.component';
import { ProjectClientNameRendererComponent } from './components/project-client-name-renderer/project-client-name-renderer.component';
import { JsDiffCompareDirective } from './directives/jsdiff-compare.directive';
import { JsDiffDirective } from './directives/jsdiff.directive';
import { AssignmentStatusRendererComponent } from './components/assignment-status-renderer/assignment-status-renderer.component';
import { ProjectInfoComponent } from './components/project-info/project-info.component';
import { AbsoluteNumberPipe } from './pipes/absolute-number.pipe';
import { ProjectStatsComponent } from './components/project-stats/project-stats.component';
import { DvAuditComponent } from './components/dv-audit/dv-audit.component';
import { DvRelatedDiligencesComponent } from './components/dv-related-diligences/dv-related-diligences.component';
import { DvQuestionnaireSubmitButtonComponent } from './components/dv-questionnaire-submit-button/dv-questionnaire-submit-button.component';
import { DvSentToContactSelectorComponent } from './components/dv-sent-to-contact-selector/dv-sent-to-contact-selector.component';
import { ManageDiligenceModal } from './modals/manage-diligence/manage-diligence.component';
import { ExtendDueDateModal } from './modals/extend-duedate/extend-duedate.component';
import { ApproveExtensionModal } from './modals/approve-extension/approve-extension.component';
import { CopyVerifiersModal } from './modals/copy-verifiers/copy-verifiers.component';
import { CustomFieldSelectionComponent } from './components/custom-field-selection/custom-field-selection.component';
import { ManageRatingsModal } from './modals/manage-ratings/manage-ratings.component';
import { EditableOnlyScoreComponent } from './components/editable-only-score/editable-only-score.component';
import { AddVerifierModal } from './modals/add-verifier/add-verifier.component';
import { ShareDocumentModal } from './modals/share-document/share-document.component';
import { WebsitePipe } from './pipes/website.pipe';
import { EntityDocumentsComponent } from './components/entity-documents/entity-documents.component';
import { TeamSelectionComponent } from './modals/team-selection/team-selection.component';
import { ManageVehicleModal } from './modals/manage-vehicle/manage-vehicle.component';
import { ManageFirmModal } from './modals/manage-firm/manage-firm.component';
import { EntityContactsComponent } from './components/entity-contacts/entity-contacts.component';
import { ManageContactModal } from './modals/manage-contact/manage-contact.component';
import { ManageCustomFieldsModal } from './modals/manage-custom-fields/manage-custom-fields.component';
import { IntInputDirective } from './directives/int-input.directive';
import { DecimalInputDirective } from './directives/decimal-input.directive';
import { CustomFieldCellRendererComponent } from './components/custom-field-cell-renderer/custom-field-cell-renderer.component';
import { CustomFieldCellLinkRendererComponent } from './components/custom-field-cell-link-renderer/custom-field-cell-link-renderer.component';
import { DvFormElementComponent } from './components/dv-form-element/dv-form-element.component';
import { AddNewUserComponent } from './components/modal/new-user/new-user.component';
import { AddUsersToFuntionsComponent } from './components/modal/add-users-to-functions/add-users-to-functions.component';
import { AddStrategyTagsModal } from './components/modal/add-strategy/add-strategy.component';
import { DvUploaderComponent } from './components/dv-uploader/dv-uploader.component';
import { TagsModal } from '../modules/firm-settings/tags-modal/tags-modal.component';
import { AlertBouncedContactsComponent } from './modals/alert-bounced-contacts/alert-bounced-contacts.component';
import { RejectPendingRequestComponent } from './modals/reject-pending-request/reject-pending-request.component';
import { ViewApproverNotesComponent } from './modals/view-approver-notes/view-approver-notes.component';
import { TruncatePipe } from './pipes/trucate.pipe';
import { AutofocusDirective } from './directives/autoFocus.directive';

import { ScoresDdFirmNameComponent } from './components/scores-dd-firm-name/scores-dd-firm-name.component';
import { ScoresFlagComponent } from './components/scores-flag/scores-flag.component';
import { ScoresBadgeComponent } from './components/scores-badge/scores-badge.component';
import { ScoresCreationDateComponent } from './components/scores-creation-date/scores-creation-date.component';
import { FormAdvFirmNameComponent } from './components/form-adv-firm-name/form-adv-firm-name.component';
import { FormAdvActionsComponent } from './components/form-adv-actions/form-adv-actions.component';
import { FormAdvChangeCountComponent } from './components/form-adv-change-count/form-adv-change-count.component';
import { FormAdvServiceProviderNameComponent } from './components/form-adv-service-provider-name/form-adv-service-provider-name.component';
import { FormAdvPrivateFundsNameComponent } from './components/form-adv-private-funds-name/form-adv-private-funds-name.component';
import { FormAdvPrivateFundsTypeComponent } from './components/form-adv-private-funds-type/form-adv-private-funds-type.component';
import { FormadvFilingComparisonComponent } from './components/formadv-filing-comparison/formadv-filing-comparison.component';
import { DvNoteSideBarComponent } from './components/dv-note-side-bar/dv-note-side-bar.component';
import { DdDueDateComponent } from './components/dd-due-date/dd-due-date.component';
import { WorkFlowResourceTypeComponent } from './components/work-flow-resource-type/work-flow-resource-type.component';
import { EmptyCellComponent } from './components/empty-cell/empty-cell.component';
import { WorkflowLastUpdatedComponent } from './components/workflow-last-updated/workflow-last-updated.component';
import { WorkflowPercentageComponent } from './components/workflow-percentage/workflow-percentage.component';
import { WorkflowLastStepComponent } from './components/workflow-last-step/workflow-last-step.component';
import { MyActionsEntityNameComponent } from './components/my-actions-entity-name/my-actions-entity-name.component';
import { FunctionMyActionsActionComponent } from './components/function-my-actions-action/function-my-actions-action.component';

//import { TeamActivityComponent } from './modules/dashboard/activity/team-activity/team-activity.component';

import { HumanizeDirective } from './directives/humanize.directive';
import { DdScoreDirective } from './directives/dd-score.directive';
import { DdRatedScoreDirective } from './directives/dd-rated-score.directive';
import { DvNavTabsDropdownDirective } from './directives/dv-nav-tabs-dropdown.directive';
import { DiligenceTypeIconDirective } from './directives/diligence-type-icon.directive';
import { LimitWordDirective } from './directives/limit-word.directive';

import { toMillionPipe } from './pipes/to-million.pipe';
import { TrustHtmlPipe } from './pipes/trust-html.pipe';
import { DvButtonGroupComponent } from './components/dv-button-group/dv-button-group.component';
import { SourceProjectSelector } from './components/source-project-selector/source-project-selector.component';
import { NgInitDirective } from './directives/ngInit.directive';
import { ScrollToTopDirective } from './directives/scrollToTop.directive';
import {
  DvDropdownComponent,
  DvRadioComponent,
  DvDividerComponent,
  DvDividerWithLabelComponent,
  DvSelectComponent,
  DvLogoLabelComponent,
  DvLabelComponent,
  DvStatusTagComponent,
  DvTabelComponent,
  DvRatingChipComponent,
  SidePanelWrapperComponent,
  SidePanelComponent,
  DvLinkComponent,
  DvLinkGroupComponent,
  DvIconGroupComponent,
  DvCategoryAccordionListComponent,
  DvQuestionCardComponent,
  DvQuestionCardGroupComponent,
  DvQuestionCommentComponent,
  DvRadioGroupComponent,
  DvButtonRadioGroupComponent,
  DvCheckboxListComponent,
  DvHandsontableComponent,
  HelperTextComponent,
  DvRatingComponent,
  TemplateSegmentComponent,
  DvRatingDropdownComponent,
  DvInfoComponent,
  DvFiltersComponent,
  ReviewDefinitionNameComponent,
  InitialBubblesComponent,
  ReviewDefinitionMandatoryComponent,
  ReviewDefinitionStepsComponent,
  ReviewDefinitionStepsMultipleComponent,
  MultipleReviewerAccordionComponent,
  DvShowMoreComponent,
  ReviewNameRendererComponent,
  DvTabsComponent,
  DvRelationshipStatusTagComponent,
  ResponseHistoryDisplayComponent,
  ReleasesActionCellRendererComponent,
  DvPaginationComponent,
  ScrollTopButtonComponent,
  TemplateRatingSchemeRendererComponent,
  TemplateRatingSchemeCustomFieldsRendererComponent,
  ReleaseNotesDescriptionTemplateComponent,
  EntityNameCellRendererComponent,
  AiTextGeneratorComponent,
  BannersActionCellRendererComponent,
  DvDocumentGridComponent,
  GlobalGridFilterComponent,
  ToggleButtonSwitchComponent,
  DocumentBreadCrumbsComponent,
  DvGridEmptyStateComponent,
  DvGridLoadingStateComponent,
  PremiumResponderPageComponent,
  PremiumPopoverComponent,
  DvEditorComponent,
  AiTermsOfUseComponent,
  RatingCustomFieldCellRendererComponent,
} from './components';

import { DiligenceStatusDirective } from './directives/diligence-status.directive';
import { MyAdminTypeComponent } from './components/my-admin-type-cell-renderer/my-admin-type-cell-renderer.component';
import { PermissionVisibilityComponent } from './components/permission-visibility/permission-visibility.component';
import { AddAttachmentDocumentComponent } from '../modules/template-builder/components';
// import { GeneratePresentationReportModal } from '../modules/questionnaire/modals';
import { AddStandardResponseComponent } from './modals/add-standard-response/add-standard-response.component';
import { DragDropDirective } from './directives/drag-drop.directive';
import { UploadAumFileModal } from './modals/upload-aum-file/upload-aum-file.component';
import { DocumentNotesSidebarComponent } from './components/entity-documents/document-notes-sidebar/document-notes-sidebar.component';
import { ScoringEngineScaleSelectionComponent } from './components/scoring-engine-scale-selection/scoring-engine-scale-selection.component';
import { ConfirmPendingRequestComponent } from './modals/confirm-pending-request/confirm-pending-request.component';
import { ManageQuestionSelectionModal } from './modals/manage-question-selection/manage-question-selection.component';
import { DDRatedScoreComponent } from './components/dv-dd-rated-score/dv-dd-rated-score.component';
import { BenchmarkingQuestionnaireComponent } from './components/questionnaire/questionnaire/benchmarking-questionnaire.component';
import { DocumentNameComponent } from './components/document-name/document-name.component';
import { RecommendationTrackerService } from '../apis/recommendationTracker.service';
import { AutoScrollDirective } from './directives/auto-scroll.directive';
import { AutoSelectAllDirective } from './directives/auto-select-all.directive';
import { TabComponent } from './components/tab/tab.component';
import { SyncSettingsComponent } from '../modules/firm-settings/sync-settings/sync-settings.component';
import { DvTimepickerComponent } from './components/dv-timepicker/dv-timepicker.component';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { DvMultiheaderTableComponent } from './components/dv-multiheader-table/dv-multiheader-table.component';
import {
  ImportingFirmsComponent,
  NewTemplateComponent,
} from '../modules/template-builder/modals';
import { DvDragpanelListComponent } from './components/dv-drag-panel-list/dv-drag-panel-list.component';
import { DvTemplateDateComponent } from './components/dv-template-date/dv-template-date.component';
import { EntitySelectorComponent } from '../modules/invite/investor/component/entity-selector/entity-selector.component';
import { ContactsWithContactTag } from '../modules/invite/investor/pipe/contacts-with-contact-tag.pipe';
import { EntitiesWithContactTag } from '../modules/invite/investor/pipe/entities-with-contact-tag.pipe';
import { StickyDivDirective } from './directives/StickyDiv.directive';
import { WhiteSpaceValidatorDirective } from './directives/white-space-validator.directive';
import { ExistingDocumentsComponent } from './components/modal/existing-documents/existing-documents.component';
import { NewDocumentsComponent } from './components/modal/new-documents/new-documents.component';
import { ManageDocumentsComponent } from './components/modal/manage-documents/manage-documents.component';
import { DvInputComponent } from './components/dv-input/dv-input.component';
import { EmptyCellRenderer } from './components/empty-cell-renderer/empty-cell-renderer.component';
import { InfiniteScrollDirective } from '../modules/template-builder/directive/infinite-scroll.directive';
import { UploadCrdComponent } from './modals/upload-crd/upload-crd.component';
import { DvIntegerOnlyDirective } from './directives/dv-integer-only.directive';
import { ManageSubscribersModal } from './modals/manage-subscribers/manage-subscribers.component';
import { DvSentToInfoComponent } from './components/dv-sent-to-info/dv-sent-to-info.component';
import { BenchmarkingQueTableComponent } from './components/questionnaire/questionnaire/benchmarking-que-table/benchmarking-que-table.component';
import { BenchmarkingQueGraphComponent } from './components/questionnaire/questionnaire/benchmarking-que-graph/benchmarking-que-graph.component';
import { BenchmarkingQuestionnaireSectionComponent } from './components/questionnaire/questionnaire/benchmarking-questionnaire-section/benchmarking-questionnaire-section.component';
import { DvReportsViewGridComponent } from './components/dv-reports-view-grid/dv-reports-view-grid.component';
import { DvTableViewGridComponent } from './components/dv-table-view-grid/dv-table-view-grid.component';
import { CommaSeparatorPipe } from './pipes/commaSeparator.pipe';
import { NewReviewDefinitionModal } from './components/modal/new-review-definition/new-review-definition.component';
import { VirtualScrollDirective } from './directives/scroll.directive';
import { FAQsComponent } from './common/faqs/faqs.component';
import { FeedbackComponent } from './common/feedback/feedback.component';
import { ManageFundModal } from './modals/manage-fund/manage-fund.component';
import { DvOwnersComponent } from './components/dv-owners/dv-owners.component';
import { FormAdvBrochureUrlComponent } from './components/form-adv-brochure-url/form-adv-brochure-url.component';
import { UploadQaFileComponent } from './modals/upload-qa-file/upload-qa-file.component';
import { AccessLevelCellActionsRendererComponent } from './components/access-level-cell-actions/access-level-cell-actions.component';
import { AssignAccessLevelModal } from './components/modal/assign-access-level/assign-access-level.component';
import { AccessLevelConfigModal } from './components/modal/new-access-level-config/new-access-level-config.component';
import { AccessLevelDescriptionModal } from './components/modal/new-access-level-description/new-access-level-description.component';
import { reviewAssignmentsStatusRenderer } from './components/review-assignments-status-renderer/review-assignments-status-renderer';
import { WorkflowAutomationPreview } from './components/workflow-automation/workflow-automation-preview/workflow-automation-preview.component';
import { WorkflowAutomationDetailComponent } from './components/workflow-automation/workflow-automation-detail/workflow-automation-detail.component';
import { NoteComponent } from './components/note/note.component';
import { AddNotesComponent } from './modals/add-notes/add-notes.component';
import {
  QuestionResponseComponent,
  AttachmentResponseComponent,
  BooleanResponseComponent,
  AumResponseComponent,
  CheckboxResponseComponent,
  DropdownResponseComponent,
  GridResponseComponent,
  PlainGridComponent,
  ResponseInputComponent,
  TextMultilineResponseComponent,
} from '../modules/questionnaire/components/question-response';
import {
  QuestionsSectionComponent,
  ResponseTrackChangeComponent,
} from '../modules/questionnaire/components';
import { FollowUpPanelComponent } from '../modules/questionnaire/side-panels';
import {
  AddRecommendationComponent,
  CommentsComponent,
  CommentComponent,
} from '../modules/recommendation/components';
import { ManageCustomSearchComponent } from './modals/manage-custom-search/manage-custom-search.component';
// import { ManageCustomFieldsComponent } from './modals/manage-custom-fields/manage-custom-fields.component';
import { ManagePublicContactComponent } from './modals/manage-public-contact/manage-public-contact.component';
import { QuestionnaireUploadImageComponent } from './modals/questionnaire-upload-image/questionnaire-upload-image.component';
import { ManageBulkDocumentComponent } from './modals/manage-bulk-document/manage-bulk-document.component';

import { ViewDuplicateFirmsComponent } from './modals/view-duplicate-firms/view-duplicate-firms.component';
import { VehicleDdqsComponent } from './common/vehicle-ddqs/vehicle-ddqs.component';
import { MyDownloadsComponent } from './components/my-downloads/my-downloads.component';
import { MyDownloadFileNameRenderer } from './components/my-downloads-filename-renderer/my-downloads-filename-renderer.component';
import { CommonTagsRenderer } from './components/common-tags-renderer/common-tags-renderer.component';
import { MyDownloadExpiryRenderer } from './components/my-downloads-expiry-renderer/my-downloads-expiry-renderer.component';
import { DvPasswordComponent } from './components/dv-password/dv-password.component';
import { RecaptchaModule } from 'ng-recaptcha';
import { DvNudgeComponent } from './components/dv-nudge/dv-nudge.component';
import { DvSliderComponent } from './components/dv-slider/dv-slider.component';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NumericDiffDirective } from './directives/num-diff/num-diff.directive';

import { ViewQuestionTagsComponent } from 'src/app2/shared/modals/view-question-tags/view-question-tags.component';

import { ClickOutsideDirective } from './directives/click-outside.directive';
import { DynamicIconComponent } from './components/dynamic-icon/dynamic-icon.component';
import { DescriptionCellRendererComponent } from './components/description-cell-renderer/description-cell-renderer.component';
import { ReviewedByNameComponent } from './components/reviewed-by-name/reviewed-by-name.component';
import { ProjectTemplateNameRendererComponent } from './components/project-template-name-renderer/project-template-name-renderer.component';
import { DropdownFloatingYesnoFilterComponent } from './components/dropdown-floating-yesno-filter/dropdown-floating-yesno-filter.component';
import { TermsAndConditionsComponent } from './components/terms-and-conditions/terms-and-conditions.component';
import { InboundAddEditComponent } from './modals/inbound-add-edit/inbound-add-edit.component';
import { ManageDocumentComponent } from './modals/manage-document/manage-document.component';
import { AssociatedNameComponent } from './components/associated-name/associated-name.component';
import { DvHtmlValidatorDirective } from './directives/dv-html-validator.directive';
import { ReleaseNoteModalTemplateComponent } from './components/modal/release-note-modal-template/release-note-modal-template.component';
import { CarouselComponent } from './components/carousel/carousel.component';
import { DateQuarterPickerComponent } from './components/date-quarter-picker/date-quarter-picker.component';
import { ExcelSyncModal } from '../modules/questionnaire/modals/excel-sync/excel-sync.component';
import { DvSafeHtmlPipe } from './pipes/dv-trust-html.pipe';
import { ReleaseNotePanelComponent } from './components/release-note-panel/release-note-panel.component';
import { ResizableSplitComponent } from './components/resizable-split/resizable-split.component';
import { BulkActionMappingPreview } from '../modules/firm-settings/bulk-actions-mappings-preview/bulk-actions-mappings-preview.component';
import { NameWithIconCellRendererComponent } from './components/name-with-icon-cell-renderer/name-with-icon-cell-renderer.component';

import { BulkActionMappingCountPreview } from '../modules/firm-settings/bulk-actions-mapping-count-preview/bulk-actions-mapping-count-preview.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';

import { DvNavBarComponent } from './components/dv-nav-bar/dv-nav-bar.component';
import { DVActionListComponent } from './components/dv-action-list/dv-action-list.component';
import { TippyTooltipDirective } from './directives/tippy-tooltip.directive';
import { DvMenuListComponent } from './components/dv-menu-list/dv-menu-list.component';
import { EucModalComponent } from './modals/euc/euc-modal.component';
import { DvContextMenuComponent } from './components/dv-context-menu/dv-context-menu.component';

import { PopupMessageComponent } from './modals/popup-message/popup-message.component';

import { ViewSelectedEntitiesComponent } from './modals/view-selected-entities/view-selected-entities.component';
import { TrimValueAccessorDirective } from './directives/dv-trim-value.directive';
import { EntitySummaryDocumentsComponent } from './components/entity-summary-documents/entity-summary-documents.component';
import { SaveBulkUploadMapping } from './components/modal/save-bulk-upload-mapping/save-bulk-upload-mapping.component';
import { EditExcelSelectionComponent } from './modals/edit-excel-selection/edit-excel-selection.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { SaveViewModal } from './modals/save-view/save-view.component';
import { SaveViewDetailsModal } from './modals/save-view-details/save-view-details.component';
import { FolderCellRendererComponent } from './components/folder-cell-renderer/folder-cell-renderer.component';
import { DvTreeGridComponent } from './components/dv-tree-grid/dv-tree-grid.component';
import { DvDocumentOperationModalComponent } from './components/modal/dv-document-operation-modal/dv-document-operation-modal.component';
import { CreateDocumentComponent } from './modals/create-document/create-document.component';
import { DvFolderSelectionGridComponent } from './components/dv-folder-selection-grid/dv-folder-selection-grid.component';
import { DvFolderSelectionCellRendererComponent } from './components/dv-folder-selection-grid/dv-folder-selection-cell-renderer/dv-folder-selection-cell-renderer.component';
import { UploadDocumentFolderComponent } from './modals/upload-document-folder/upload-document-folder.component';
import { UseExsistingDocumentComponent } from './modals/use-exsisting-document/use-exsisting-document.component';
import { BulkEditDocumentsModalComponent } from './components/modal/bulk-edit-documents-modal/bulk-edit-documents-modal.component';
import { DvMeetingNotesComponent } from './common/dv-meeting-notes/dv-meeting-notes.component';
import { DvPanelHeadingComponent } from './components/dv-panel-heading/dv-panel-heading.component';
import { BulkOrganizeAttachmentsModal } from './components/modal/bulk-organize-attachments/bulk-organize-attachments.component';
import { DvBadgeComponent } from './components/dv-badge/dv-badge.component';
import { TaskTypeComponent } from './components/task_type/task_type.component';
import { WorkflowProgressCellRendererComponent } from './components/grid-cell-workflow-progress/grid-cell-workflow-progress.component';
import { WorkflowActivityCellRendererComponent } from './components/grid-cell-workflow-activity/grid-cell-workflow-activity.component';
import { WorkflowOwnersCellRendererComponent } from './components/grid-cell-workflow-owners/grid-cell-workflow-owners.component';
import { NewPaginationbarComponent } from './components/dv-grid/new-pagination-bar/new-pagination-bar.component';
import { NumericCellRendererComponent } from './components/numeric-cell-renderer/numeric-cell-renderer.component';
import { DvProgressBarComponent } from './components/dv-progress-bar/dv-progress-bar.component';
import { UiSwitchButtonDirective } from './directives/ui-switch-button.directive';
import { ClickableDirective } from './directives/clickable-element.directive';

const IMPORT_EXPORTS_COMPONENTS = [
  DvProgressBarComponent,
  ClickableDirective,
  AccessibleAccordionDirective,
];
import { DateTimePickerComponent } from './components/date-time-picker/date-time-picker.component';
import { ToggleButtonSwitchMultipleComponent } from './components/toggle-button-switch-multiple/toggle-button-switch-multiple.component';
import { SanitizeClassPipe } from './pipes/sanitize-classes.pipe';
import { MyWorkRowBadgeComponent } from './components/my-work-row-badge/my-work-row-badge.component';
import { DvNotificationPanelComponent } from './components/dv-notification-panel/dv-notification-panel.component';
import { externalLinkDirective } from './directives/external-link.directive';
import { AccessibleAnchorButtonDirective } from './directives/accessible-anchor-button.directive';
import { AccessibleAccordionDirective } from './directives/accessible-accordion.directive';
import { PolicyChangesComponent } from './modals/policy-changes/policy-changes.component';
import { EditorComponent } from './components/editor/editor.component';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { DvDatePipe } from './pipes/dv-date.pipe';
import { AddPreApprovedComponent } from './modals/add-pre-approved/add-pre-approved.component';
import { InternalNotesComponent } from './sidepanels/internal-notes/internal-notes.component';
import { QaInfoTab } from './components/qa-info-tab/qa-info-tab.component';
@NgModule({
  declarations: [
    ManageCustomSearchComponent,
    ManagePublicContactComponent,
    QuestionnaireUploadImageComponent,
    ManageBulkDocumentComponent,
    ResizableSplitComponent,
    DvPasswordComponent,
    NgInitDirective,
    FollowUpPanelComponent,
    AddRecommendationComponent,
    ViewQuestionTagsComponent,
    CommentsComponent,
    CommentComponent,
    ButtonDirective,
    ColDirective,
    IconDirective,
    externalLinkDirective,
    AccessibleAnchorButtonDirective,
    HtmlDiffCompareDirective,
    JsDiffCompareDirective,
    JsDiffDirective,
    CleanHtmlPipe,
    OffsetDirective,
    DiligenceStatusDirective,
    DocumentViewerDirective,
    AuthorizedViewDirective,
    FilterByPipe,
    FilterPipe,
    DvDatePipe,
    InterpolatePipe,
    OrderByPipe,
    TruncatePipe,
    TrustHtmlPipe,
    DiligenceStatusDirective,
    //HomeComponent,
    FormGroupComponent,
    HtmlDiffCompareDirective,
    EmptyStateComponent,
    NumericCellRendererComponent,
    DvCheckboxComponent,
    CheckboxComponent,
    RadioComponent,
    CommaSeparatorPipe,
    SpinnerComponent,
    UserAvatarComponent,
    UserProfileComponent,
    AgGridSideBarComponent,
    DvGridComponent,
    DvTreeGridComponent,
    CustomFieldViewerComponent,
    TagsManagerComponent,
    EntitySelectorComponent,
    ContactsWithContactTag,
    EntitiesWithContactTag,
    // Move outside of shared module later
    MenuItemComponent,
    MenuItemPlusComponent,
    PlatformActivityPanelComponent,
    LimitToPipe,
    AttachmentIconComponent,
    StandardPluralizePipe,
    TinymceEditorComponent,
    DvInfoComponent,
    TilesAdjusterDirective,
    DateRangePickerComponent,
    ActionsCellRendererComponent,
    AccessLevelCellActionsRendererComponent,
    DescriptionCellRendererComponent,
    DeleteActionCellRendererComponent,
    EmailTemplateActionsComponent,
    ProjectStatusRendererComponent,
    ProjectTypeRendererComponent,
    ProjectStatusIconRendererComponent,
    ProgressBarRendererComponent,
    ProjectActionsSentTabRendererComponent,
    DisclaimerActionsComponent,
    MyAccountsActionsComponent,
    ModalComponent,
    TagsModal,
    BulkActionMappingPreview,
    BulkActionMappingCountPreview,
    FieldPreviewComponent,
    DvOptionSelectorComponent,
    DvBulkListBuilderNewComponent,
    NgListNewDirective,
    EntityActionComponent,
    MyAdminEmailActionComponent,
    MyAdminNameActionComponent,
    EmailTemplateContentComponent,
    PrintSectionDirective,
    EmailTemplateNameComponent,
    DocumentNameCellRendererComponent,
    NameWithIconCellRendererComponent,
    FolderCellRendererComponent,
    GroupableFieldNameComponent,
    GroupableGroupNameComponent,
    DocumentActionComponent,
    DocumentDetailComponent,
    DvCustomFieldsComponent,
    DvMeetingsComponent,
    MeetingsDetailComponent,
    DvDocumentsComponent,
    DvNotesComponent,
    DvMeetingNotesComponent,
    DvTasksComponent,
    DvWorkflowsComponent,
    FundReturnComponent,
    SearchInputComponent,
    ShareClassTableComponent,
    StrategyDdqsComponent,
    EntityStatusComponent,
    ContactNameComponent,
    ManageThresholdModal,
    MfwRequestModal,
    WorkflowTagsComponent,
    WorkflowNameComponent,
    ReviewDefinitionNameComponent,
    DisclaimerNameComponent,
    ExcelSyncUploadActionComponent,
    ExcelSyncStatusComponent,
    AddIpConfigModal,
    ManageWorkflowModal,
    ManageWorkflowStepModal,
    ManageDisclaimerModal,
    ViewDisclaimerModal,
    ManageEmailTemplateModal,
    ViewEmailModal,
    RatingSchemeModal,
    ManageRiskRatingModal,
    AddRatingScaleModal,
    ManageRatingScaleModal,
    UpdateImageModal,
    ManageExportTemplateModal,
    ViewServiceProviderModal,
    ManagePermissionModal,
    AddTeamPermissionComponent,
    DvSelectorListComponent,
    AddTeamModal,
    SaveBulkUploadMapping,
    AssignAccessLevelModal,
    AccessLevelConfigModal,
    AccessLevelDescriptionModal,
    EditTeamModal,
    DvHeatmapDirective,
    HeatMapComponent,
    AddDomainModal,
    AddDdqModal,
    DatePickerComponent,
    DateTimePickerComponent,
    ManageEventModal,
    TriggerWorkflowModal,
    ManageTaskModal,
    DvSubscriberSelectionComponent,
    DvTeamMemberSelectorComponent,
    ManageAumModal,
    ManageAddressModal,
    WorkflowTagsComponent,
    WorkflowNameComponent,
    ReviewDefinitionNameComponent,
    DisclaimerNameComponent,
    ExcelSyncUploadActionComponent,
    ExcelSyncStatusComponent,
    PaginationBarComponent,
    DvSubscriberSelectionComponent,
    DvTeamMemberSelectorComponent,
    FunctionUsersComponent,
    FunctionsActionsRendererComponent,
    GetFirstLetterPipe,
    HoverClassDirective,
    TextFloatingFilterComponent,
    AddDdqModal,
    DatePickerComponent,
    ManageEventModal,
    TriggerWorkflowModal,
    ManageTaskModal,
    DvSubscriberSelectionComponent,
    DvTeamMemberSelectorComponent,
    ManageAumModal,
    DvRadioComponent,
    DvFormElementComponent,
    DvButtonComponent,
    RemoveUnderscoresPipe,
    ExcelSyncFileNameComponent,
    DropdownFloatingFilterComponent,
    DropdownFloatingYesnoFilterComponent,
    ProjectEntityNameRendererComponent,
    ProjectClientNameRendererComponent,
    DvRatingComponent,
    DvInfoComponent,
    AssignmentStatusRendererComponent,
    reviewAssignmentsStatusRenderer,
    ProjectInfoComponent,
    AbsoluteNumberPipe,
    ProjectStatsComponent,
    DvAuditComponent,
    DvRelatedDiligencesComponent,
    DvQuestionnaireSubmitButtonComponent,
    DvCustomFieldsComponent,
    DvWorkflowsComponent,
    DvSentToContactSelectorComponent,
    EntityDocumentsComponent,
    DocumentActionComponent,
    ManageDiligenceModal,
    ModalComponent,
    DatePickerComponent,
    ExtendDueDateModal,
    ApproveExtensionModal,
    CopyVerifiersModal,
    CustomFieldSelectionComponent,
    ManageRatingsModal,
    EditableOnlyScoreComponent,
    AddVerifierModal,
    ShareDocumentModal,
    PermissionVisibilityComponent,
    DocumentNotesSidebarComponent,
    TinymceEditorComponent,
    WebsitePipe,
    DvStepperComponent,
    DatePickerComponent,
    DvCheckboxComponent,
    DvStepLabel,
    DvStepButonNext,
    DvStepButonPrevious,
    DvStepComponent,
    WebsitePipe,
    InboundCreateConfirmComponent,
    CleanHtmlPipe,
    TrustHtmlPipe,
    DvSafeHtmlPipe,
    SourceProjectSelector,
    NgInitDirective,
    AutofocusDirective,
    ScrollToTopDirective,
    DvUploaderComponent,
    TruncatePipe,
    PermissionVisibilityComponent,
    TeamSelectionComponent,
    ManageVehicleModal,
    ManageFirmModal,
    EntityContactsComponent,
    ManageContactModal,
    ManageCustomFieldsModal,
    IntInputDirective,
    DecimalInputDirective,
    CustomFieldCellRendererComponent,
    CustomFieldCellLinkRendererComponent,
    RatingCustomFieldCellRendererComponent,
    AddNewUserComponent,
    AddUsersToFuntionsComponent,
    AddStrategyTagsModal,
    DvUploaderComponent,
    DragDropDirective,
    TrustHtmlPipe,
    AlertBouncedContactsComponent,
    RejectPendingRequestComponent,
    ViewApproverNotesComponent,
    AutofocusDirective,
    CleanHtmlPipe,
    ScoresDdFirmNameComponent,
    ScoresFlagComponent,
    ScoresBadgeComponent,
    ScoresCreationDateComponent,
    FormAdvFirmNameComponent,
    FormAdvActionsComponent,
    FormAdvChangeCountComponent,
    FormAdvServiceProviderNameComponent,
    FormAdvPrivateFundsNameComponent,
    FormAdvPrivateFundsTypeComponent,
    FormadvFilingComparisonComponent,
    DvNoteSideBarComponent,
    DdDueDateComponent,
    WorkFlowResourceTypeComponent,
    EmptyCellComponent,
    WorkflowLastUpdatedComponent,
    WorkflowPercentageComponent,
    WorkflowLastStepComponent,
    WorkflowPercentageComponent,
    WorkflowPercentageComponent,
    WorkflowLastStepComponent,
    MyActionsEntityNameComponent,
    FunctionMyActionsActionComponent,
    HumanizeDirective,
    DdScoreDirective,
    DdRatedScoreDirective,
    DvNavTabsDropdownDirective,
    DiligenceStatusDirective,
    DiligenceTypeIconDirective,
    JsDiffDirective,
    NumericDiffDirective,
    LimitWordDirective,
    toMillionPipe,
    TrustHtmlPipe,
    AutoScrollDirective,
    StickyDivDirective,
    WhiteSpaceValidatorDirective,
    TrimValueAccessorDirective,
    AddInternalContactsModal,
    DvButtonGroupComponent,
    TrustHtmlPipe,
    DvDropdownComponent,
    DvRadioComponent,
    DvDividerComponent,
    DvDividerWithLabelComponent,
    DvSelectComponent,
    DvLogoLabelComponent,
    DvLabelComponent,
    DvStatusTagComponent,
    DvRelationshipStatusTagComponent,
    DvTabelComponent,
    DvRatingChipComponent,
    SidePanelWrapperComponent,
    SidePanelComponent,
    TemplateSegmentComponent,
    DvLabelComponent,
    DvLinkComponent,
    DvLinkGroupComponent,
    DvIconGroupComponent,
    DvCategoryAccordionListComponent,
    DvQuestionCardComponent,
    DvQuestionCardGroupComponent,
    DvQuestionCommentComponent,
    PermissionVisibilityComponent,
    MyAdminTypeComponent,
    ModalComponent,
    TrustHtmlPipe,
    DvCheckboxComponent,
    DragDropDirective,
    DvRadioGroupComponent,
    DvCheckboxListComponent,
    DvDragpanelListComponent,
    DvButtonRadioGroupComponent,
    QuestionResponseComponent,
    BooleanResponseComponent,
    AddAttachmentDocumentComponent,
    DvHandsontableComponent,
    HelperTextComponent,
    SearchHighLightPipe,
    // GeneratePresentationReportModal,
    SearchHighLightPipe,
    HelperTextComponent,
    DvRatingComponent,
    AddStandardResponseComponent,
    UploadAumFileModal,
    UploadCrdComponent,
    ConfirmPendingRequestComponent,
    SearchHighLightPipe,
    ScoringEngineScaleSelectionComponent,
    ManageQuestionSelectionModal,
    DvRatingDropdownComponent,
    DocumentNameComponent,
    AutoSelectAllDirective,
    TabComponent,
    SyncSettingsComponent,
    DvTimepickerComponent,
    DvMultiheaderTableComponent,
    ImportingFirmsComponent,
    DvDragpanelListComponent,
    DvTemplateDateComponent,
    DvPasswordComponent,
    DvNudgeComponent,
    ExistingDocumentsComponent,
    NewDocumentsComponent,
    ManageDocumentsComponent,
    DvFiltersComponent,
    DvInputComponent,
    EmptyCellRenderer,
    InfiniteScrollDirective,
    ClickOutsideDirective,
    UploadCrdComponent,
    DvIntegerOnlyDirective,
    DvReportsViewGridComponent,
    DvTableViewGridComponent,
    InitialBubblesComponent,
    NewReviewDefinitionModal,
    ReviewDefinitionStepsComponent,
    ReviewDefinitionMandatoryComponent,
    ManageSubscribersModal,
    DvSentToInfoComponent,
    BenchmarkingQueTableComponent,
    BenchmarkingQueGraphComponent,
    BenchmarkingQuestionnaireSectionComponent,
    BenchmarkingQuestionnaireComponent,
    DDRatedScoreComponent,
    NumericDiffDirective,
    VirtualScrollDirective,
    FAQsComponent,
    FeedbackComponent,
    ManageFundModal,
    DvOwnersComponent,
    NoteComponent,
    FormAdvBrochureUrlComponent,
    UploadQaFileComponent,
    ReviewDefinitionStepsMultipleComponent,
    WorkflowAutomationPreview,
    WorkflowAutomationDetailComponent,
    AddNotesComponent,
    QuestionResponseComponent,
    AttachmentResponseComponent,
    AumResponseComponent,
    CheckboxResponseComponent,
    DropdownResponseComponent,
    GridResponseComponent,
    PlainGridComponent,
    ResponseInputComponent,
    TextMultilineResponseComponent,
    QuestionsSectionComponent,
    ResponseTrackChangeComponent,
    DvShowMoreComponent,
    MultipleReviewerAccordionComponent,
    ResponseHistoryDisplayComponent,
    ReviewNameRendererComponent,
    DvTabsComponent,
    ManageCustomSearchComponent,
    // ManageCustomFieldsComponent,
    ManagePublicContactComponent,
    QuestionnaireUploadImageComponent,
    ViewQuestionTagsComponent,
    ManageBulkDocumentComponent,
    ReviewedByNameComponent,
    MyDownloadsComponent,
    MyDownloadFileNameRenderer,
    CommonTagsRenderer,
    MyDownloadExpiryRenderer,
    DvSliderComponent,
    ProjectTemplateNameRendererComponent,
    ReviewedByNameComponent,
    DvPaginationComponent,
    ViewDuplicateFirmsComponent,
    NewTemplateComponent,
    SourceProjectSelector,
    NgInitDirective,
    AutofocusDirective,
    ScrollToTopDirective,
    DvUploaderComponent,
    TruncatePipe,
    VehicleDdqsComponent,
    UploadQaFileComponent,
    ScoringEngineScaleSelectionComponent,
    ReleasesActionCellRendererComponent,
    DvHtmlValidatorDirective,
    ReleaseNotePanelComponent,
    ReleaseNoteModalTemplateComponent,
    CarouselComponent,
    VideoPlayerComponent,
    TermsAndConditionsComponent,
    InboundAddEditComponent,
    ManageDocumentComponent,
    AssociatedNameComponent,
    ManageDocumentComponent,
    ScrollTopButtonComponent,
    ExcelSyncModal,
    TemplateRatingSchemeRendererComponent,
    TemplateRatingSchemeCustomFieldsRendererComponent,
    DateQuarterPickerComponent,
    DynamicIconComponent,
    ReleaseNotesDescriptionTemplateComponent,
    EntityNameCellRendererComponent,
    DvNavBarComponent,
    SaveViewModal,
    SaveViewDetailsModal,
    EditExcelSelectionComponent,
    EntitySummaryDocumentsComponent,
    DVActionListComponent,
    TippyTooltipDirective,
    DvMenuListComponent,
    EucModalComponent,
    DvContextMenuComponent,
    PopupMessageComponent,
    ViewSelectedEntitiesComponent,
    EntitySummaryDocumentsComponent,
    EditExcelSelectionComponent,
    AiTextGeneratorComponent,
    BannersActionCellRendererComponent,
    DvDocumentGridComponent,
    GlobalGridFilterComponent,
    ToggleButtonSwitchComponent,
    DvDocumentOperationModalComponent,
    CreateDocumentComponent,
    DvFolderSelectionGridComponent,
    DvFolderSelectionCellRendererComponent,
    DocumentBreadCrumbsComponent,
    UploadDocumentFolderComponent,
    UseExsistingDocumentComponent,
    BulkEditDocumentsModalComponent,
    DvPanelHeadingComponent,
    BulkOrganizeAttachmentsModal,
    DvGridEmptyStateComponent,
    DvGridLoadingStateComponent,
    AiTextGeneratorComponent,
    ToggleButtonSwitchMultipleComponent,
    SanitizeClassPipe,
    PremiumResponderPageComponent,
    PremiumPopoverComponent,
    EntitySummaryDocumentsComponent,
    EditExcelSelectionComponent,
    DvBadgeComponent,
    TaskTypeComponent,
    WorkflowProgressCellRendererComponent,
    WorkflowActivityCellRendererComponent,
    WorkflowOwnersCellRendererComponent,
    NewPaginationbarComponent,
    UiSwitchButtonDirective,
    ...IMPORT_EXPORTS_COMPONENTS,
    SanitizeClassPipe,
    MyWorkRowBadgeComponent,
    DvNotificationPanelComponent,
    PremiumResponderPageComponent,
    PremiumPopoverComponent,
    AddPreApprovedComponent,
    InternalNotesComponent,
    EditorComponent,
    DvEditorComponent,
    PolicyChangesComponent,
    AiTermsOfUseComponent,
    QaInfoTab,
  ],
  imports: [
    FormsModule,
    RouterModule,
    ReactiveFormsModule,
    TranslateModule,
    NgSelectModule,
    AgGridModule,
    NgSelectModule,
    UiSwitchModule,
    AccordionModule,
    BsDropdownModule,
    PopoverModule,
    NgxFileDropModule,
    ColorPickerModule,
    TagInputModule,
    RatingModule,
    NgxDaterangepickerMd,
    HotTableModule.forRoot(),
    TooltipModule,
    TooltipModule,
    ClipboardModule,
    PaginationModule.forRoot(),
    // BrowserAnimationsModule,
    AutosizeModule,
    CommonModule,
    ModalModule,
    EditorModule,
    BsDatepickerModule.forRoot(),
    ProgressbarModule,
    TimepickerModule.forRoot(),
    NgxSliderModule,
    CKEditorModule,
  ],
  exports: [
    ResizableSplitComponent,
    TippyTooltipDirective,
    FAQsComponent,
    GroupableFieldNameComponent,
    GroupableGroupNameComponent,
    DocumentNameCellRendererComponent,
    TippyTooltipDirective,
    DvPasswordComponent,
    VehicleDdqsComponent,
    NgInitDirective,
    FollowUpPanelComponent,
    AddRecommendationComponent,
    CommentsComponent,
    DvPaginationComponent,
    DVActionListComponent,
    ScrollTopButtonComponent,
    CommentComponent,
    HelperTextComponent,
    DatePickerComponent,
    DateTimePickerComponent,
    AssociatedNameComponent,
    DvRatingComponent,
    ButtonDirective,
    ColDirective,
    IconDirective,
    externalLinkDirective,
    AccessibleAnchorButtonDirective,
    HtmlDiffCompareDirective,
    JsDiffCompareDirective,
    JsDiffDirective,
    DiligenceTypeIconDirective,
    CleanHtmlPipe,
    OffsetDirective,
    MultipleReviewerAccordionComponent,
    DiligenceStatusDirective,
    FilterByPipe,
    FilterPipe,
    HtmlDiffCompareDirective,
    CommaSeparatorPipe,
    DvDatePipe,
    InterpolatePipe,
    OrderByPipe,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    TrustHtmlPipe,
    DvSafeHtmlPipe,
    DiligenceStatusDirective,
    //HomeComponent,
    FormGroupComponent,
    EmptyStateComponent,
    NumericCellRendererComponent,
    DvInfoComponent,
    DvCheckboxComponent,
    CheckboxComponent,
    RadioComponent,
    SpinnerComponent,
    UserAvatarComponent,
    UserProfileComponent,
    AgGridSideBarComponent,
    DvGridComponent,
    DvTreeGridComponent,
    PaginationBarComponent,
    CustomFieldViewerComponent,
    TagsManagerComponent,
    DateRangePickerComponent,
    EntitySelectorComponent,
    ContactsWithContactTag,
    EntitiesWithContactTag,
    TranslateModule,
    NgSelectModule,
    UiSwitchModule,
    // for ngx-bootstrap
    AccordionModule,
    BsDropdownModule,
    PopoverModule,
    NgxFileDropModule,
    ColorPickerModule,
    TagInputModule,
    RatingModule,
    NgxDaterangepickerMd,
    LimitToPipe,
    AttachmentIconComponent,
    TinymceEditorComponent,
    ProgressbarModule,
    HotTableModule,
    TooltipModule,
    AutosizeModule,
    DvCustomFieldsComponent,
    DvMeetingsComponent,
    MeetingsDetailComponent,
    DvDocumentsComponent,
    DvNotesComponent,
    DvMeetingNotesComponent,
    DvTasksComponent,
    DvWorkflowsComponent,
    FundReturnComponent,
    SearchInputComponent,
    ShareClassTableComponent,
    StrategyDdqsComponent,
    StandardPluralizePipe,
    DocumentViewerDirective,
    AuthorizedViewDirective,
    TilesAdjusterDirective,
    ModalComponent,
    FieldPreviewComponent,
    DvOptionSelectorComponent,
    DvBulkListBuilderNewComponent,
    DvInfoComponent,
    NgListNewDirective,
    AddDomainModal,
    AddIpConfigModal,
    ManageWorkflowModal,
    NewReviewDefinitionModal,
    ManageWorkflowStepModal,
    ManageDisclaimerModal,
    ViewDisclaimerModal,
    ManageEmailTemplateModal,
    ViewEmailModal,
    RatingSchemeModal,
    ManageRiskRatingModal,
    AddRatingScaleModal,
    AutosizeModule,
    ManageRatingScaleModal,
    UpdateImageModal,
    ManageExportTemplateModal,
    ViewServiceProviderModal,
    ManagePermissionModal,
    AddTeamPermissionComponent,
    DvSelectorListComponent,
    AddTeamModal,
    SaveBulkUploadMapping,
    AssignAccessLevelModal,
    AccessLevelConfigModal,
    AccessLevelDescriptionModal,
    EditTeamModal,
    DvHeatmapDirective,
    HeatMapComponent,
    ManageThresholdModal,
    AutosizeModule,
    MfwRequestModal,
    DvCustomFieldsComponent,
    StrategyDdqsComponent,
    StandardPluralizePipe,
    ShareClassTableComponent,
    DvSubscriberSelectionComponent,
    DvTeamMemberSelectorComponent,
    GetFirstLetterPipe,
    HoverClassDirective,
    TextFloatingFilterComponent,
    AddDdqModal,
    DatePickerComponent,
    ManageEventModal,
    TriggerWorkflowModal,
    ManageTaskModal,
    ManageAumModal,
    DvSubscriberSelectionComponent,
    DvTeamMemberSelectorComponent,
    ManageAddressModal,
    DvSubscriberSelectionComponent,
    DvTeamMemberSelectorComponent,
    GetFirstLetterPipe,
    HoverClassDirective,
    TextFloatingFilterComponent,
    DvRadioComponent,
    MyAdminNameActionComponent,
    DvFormElementComponent,
    DvButtonComponent,
    RemoveUnderscoresPipe,
    ExcelSyncFileNameComponent,
    ManageQuestionSelectionModal,
    DropdownFloatingFilterComponent,
    ProjectInfoComponent,
    AbsoluteNumberPipe,
    ProjectStatsComponent,
    DvAuditComponent,
    DvRelatedDiligencesComponent,
    DvQuestionnaireSubmitButtonComponent,
    DvCustomFieldsComponent,
    DvWorkflowsComponent,
    EntityDocumentsComponent,
    DocumentActionComponent,
    ModalComponent,
    DatePickerComponent,
    ManageDiligenceModal,
    ExtendDueDateModal,
    ApproveExtensionModal,
    CopyVerifiersModal,
    CustomFieldSelectionComponent,
    ManageRatingsModal,
    EditableOnlyScoreComponent,
    AddVerifierModal,
    ShareDocumentModal,
    DocumentNotesSidebarComponent,
    TinymceEditorComponent,
    WebsitePipe,
    DvStepperComponent,
    DatePickerComponent,
    DvCheckboxComponent,
    DvStepLabel,
    DvStepButonNext,
    DvStepButonPrevious,
    DvStepComponent,
    WebsitePipe,
    InboundCreateConfirmComponent,
    CleanHtmlPipe,
    TrustHtmlPipe,
    TagsModal,
    BulkActionMappingPreview,
    BulkActionMappingCountPreview,
    RejectPendingRequestComponent,
    ScoringEngineScaleSelectionComponent,
    TemplateSegmentComponent,
    DvDropdownComponent,
    DvRadioComponent,
    DvDividerComponent,
    DvDividerWithLabelComponent,
    DvSelectComponent,
    DvLogoLabelComponent,
    DvLabelComponent,
    DvStatusTagComponent,
    DvRelationshipStatusTagComponent,
    DvTabelComponent,
    DvRatingChipComponent,
    SidePanelWrapperComponent,
    SidePanelComponent,
    DvButtonGroupComponent,
    DvUploaderComponent,
    TeamSelectionComponent,
    ClipboardModule,
    InboundCreateConfirmComponent,
    InboundAddEditComponent,
    NewTemplateComponent,
    DvCategoryAccordionListComponent,
    DvRadioGroupComponent,
    DvCheckboxListComponent,
    DvDragpanelListComponent,
    DvButtonRadioGroupComponent,
    AddAttachmentDocumentComponent,
    DvHandsontableComponent,
    DvUploaderComponent,
    AddUsersToFuntionsComponent,
    AddNewUserComponent,
    AddStrategyTagsModal,
    TeamSelectionComponent,
    CustomFieldCellRendererComponent,
    CustomFieldCellLinkRendererComponent,
    RatingCustomFieldCellRendererComponent,
    AutofocusDirective,
    AutoScrollDirective,
    StickyDivDirective,
    WhiteSpaceValidatorDirective,
    TrimValueAccessorDirective,
    TrustHtmlPipe,
    SearchHighLightPipe,
    DvLabelComponent,
    DvDropdownComponent,
    DvRadioComponent,
    DvDividerComponent,
    DvDividerWithLabelComponent,
    DvSelectComponent,
    DvLogoLabelComponent,
    DvStatusTagComponent,
    DvRelationshipStatusTagComponent,
    DvTabelComponent,
    DvRatingChipComponent,
    SidePanelWrapperComponent,
    SidePanelComponent,
    TemplateSegmentComponent,
    DvLabelComponent,
    DvLinkComponent,
    DvLinkGroupComponent,
    DvIconGroupComponent,
    DvCategoryAccordionListComponent,
    DvQuestionCardComponent,
    DvQuestionCardGroupComponent,
    DvQuestionCommentComponent,
    DvRadioGroupComponent,
    DvButtonRadioGroupComponent,
    DvCheckboxListComponent,
    DvHandsontableComponent,
    HelperTextComponent,
    DvRatingComponent,
    DvRatingDropdownComponent,
    DocumentNameComponent,
    TabComponent,
    SyncSettingsComponent,
    DvTimepickerComponent,
    DvMultiheaderTableComponent,
    UploadAumFileModal,
    UploadCrdComponent,
    DragDropDirective,
    ImportingFirmsComponent,
    DvDragpanelListComponent,
    DvTemplateDateComponent,
    DvPasswordComponent,
    RecaptchaModule,
    DvNudgeComponent,
    toMillionPipe,
    FormadvFilingComparisonComponent,
    DdScoreDirective,
    InfiniteScrollDirective,
    LimitWordDirective,
    DvIntegerOnlyDirective,
    DiligenceTypeIconDirective,
    ViewQuestionTagsComponent,
    DvInputComponent,
    ManageSubscribersModal,
    DvSentToInfoComponent,
    BenchmarkingQueTableComponent,
    BenchmarkingQueGraphComponent,
    BenchmarkingQuestionnaireSectionComponent,
    BenchmarkingQuestionnaireComponent,
    DDRatedScoreComponent,
    NumericDiffDirective,
    DvReportsViewGridComponent,
    DvTableViewGridComponent,
    ExistingDocumentsComponent,
    NewDocumentsComponent,
    ManageDocumentsComponent,
    DvFiltersComponent,
    InitialBubblesComponent,
    ReviewDefinitionStepsComponent,
    ReviewDefinitionMandatoryComponent,
    VirtualScrollDirective,
    ClickOutsideDirective,
    QuestionResponseComponent,
    AttachmentResponseComponent,
    BooleanResponseComponent,
    AumResponseComponent,
    CheckboxResponseComponent,
    DropdownResponseComponent,
    GridResponseComponent,
    PlainGridComponent,
    ResponseInputComponent,
    TextMultilineResponseComponent,
    QuestionsSectionComponent,
    DvInputComponent,
    ManageFundModal,
    DvOwnersComponent,
    TeamSelectionComponent,
    ManageVehicleModal,
    ManageFirmModal,
    EntityContactsComponent,
    ManageContactModal,
    ManageCustomFieldsModal,
    IntInputDirective,
    DecimalInputDirective,
    ReviewDefinitionStepsMultipleComponent,
    WorkflowAutomationPreview,
    WorkflowAutomationDetailComponent,
    NoteComponent,
    AddNotesComponent,
    ResponseTrackChangeComponent,
    DvShowMoreComponent,
    ResponseHistoryDisplayComponent,
    DvTabsComponent,
    DvSliderComponent,
    ReviewedByNameComponent,
    DvPaginationComponent,
    ViewDuplicateFirmsComponent,
    NewTemplateComponent,
    TermsAndConditionsComponent,
    SourceProjectSelector,
    NgInitDirective,
    AutofocusDirective,
    ScrollToTopDirective,
    DvUploaderComponent,
    TruncatePipe,
    NewTemplateComponent,
    ManageSubscribersModal,
    DvSentToInfoComponent,
    ExcelSyncModal,
    DvHtmlValidatorDirective,
    TemplateRatingSchemeRendererComponent,
    TemplateRatingSchemeCustomFieldsRendererComponent,
    VideoPlayerComponent,
    CarouselComponent,
    DateQuarterPickerComponent,
    DynamicIconComponent,
    DvNavBarComponent,
    DvMenuListComponent,
    EucModalComponent,
    FeedbackComponent,
    ViewSelectedEntitiesComponent,
    ManageCustomSearchComponent,
    ManagePublicContactComponent,
    QuestionnaireUploadImageComponent,
    ManageBulkDocumentComponent,
    EntitySummaryDocumentsComponent,
    EditExcelSelectionComponent,
    DvContextMenuComponent,
    AiTextGeneratorComponent,
    DvDocumentGridComponent,
    GlobalGridFilterComponent,
    ToggleButtonSwitchComponent,
    CreateDocumentComponent,
    DocumentBreadCrumbsComponent,
    UploadDocumentFolderComponent,
    UseExsistingDocumentComponent,
    DvPanelHeadingComponent,
    BulkOrganizeAttachmentsModal,
    AiTextGeneratorComponent,
    ToggleButtonSwitchMultipleComponent,
    ViewSelectedEntitiesComponent,
    EntitySummaryDocumentsComponent,
    EditExcelSelectionComponent,
    DvBadgeComponent,
    TaskTypeComponent,
    WorkflowProgressCellRendererComponent,
    WorkflowActivityCellRendererComponent,
    WorkflowOwnersCellRendererComponent,
    NewPaginationbarComponent,
    UiSwitchButtonDirective,
    ...IMPORT_EXPORTS_COMPONENTS,
    SanitizeClassPipe,
    MyWorkRowBadgeComponent,
    DvNotificationPanelComponent,
    PremiumResponderPageComponent,
    PremiumPopoverComponent,
    AddInternalContactsModal,
    AddPreApprovedComponent,
    EditorComponent,
    DvEditorComponent,
    PolicyChangesComponent,
    AiTermsOfUseComponent,
    QaInfoTab,
  ],
  providers: [
    ResizableSplitComponent,
    TruncatePipe,
    DatePipe,
    toMillionPipe,
    GetFirstLetterPipe,
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
    TrustHtmlPipe,
    DvSafeHtmlPipe,
    AutofocusDirective,
    CleanHtmlPipe,
    HumanizeDirective,
    DdScoreDirective,
    DdRatedScoreDirective,
    DvNavTabsDropdownDirective,
    DiligenceStatusDirective,
    DiligenceTypeIconDirective,
    JsDiffDirective,
    NumericDiffDirective,
    LimitWordDirective,
    DvNoteSideBarComponent,
    DvDatePipe,
    AutoScrollDirective,
    StickyDivDirective,
    WhiteSpaceValidatorDirective,
    TrimValueAccessorDirective,
    VirtualScrollDirective,
    CommaSeparatorPipe,
    DragDropDirective,
    DvRadioGroupComponent,
    DvDragpanelListComponent,
    AddAttachmentDocumentComponent,
    DvHandsontableComponent,
    SearchHighLightPipe,
    ClipboardModule,
    RecommendationTrackerService,
    NgInitDirective,
    ViewQuestionTagsComponent,
    DescriptionCellRendererComponent,
    MyDownloadsComponent,
    InboundAddEditComponent,
    SanitizeClassPipe,
    StandardPluralizePipe,
    TitleCasePipe,
  ],
})
export class SharedModule {}
