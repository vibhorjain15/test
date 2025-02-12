import { Injectable } from '@angular/core';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { AddVerifierModal } from 'src/app2/shared/modals/add-verifier/add-verifier.component';
import { ApproveExtensionModal } from 'src/app2/shared/modals/approve-extension/approve-extension.component';
import { CopyVerifiersModal } from 'src/app2/shared/modals/copy-verifiers/copy-verifiers.component';
import { ExtendDueDateModal } from 'src/app2/shared/modals/extend-duedate/extend-duedate.component';
import { ManageDiligenceModal } from 'src/app2/shared/modals/manage-diligence/manage-diligence.component';
import { ManageRatingsModal } from 'src/app2/shared/modals/manage-ratings/manage-ratings.component';
import { ShareDocumentModal } from 'src/app2/shared/modals/share-document/share-document.component';
import { AddDomainModal } from '../../shared/components/modal/add-domain/add-domain.component';
import { TagsModal } from '../../modules/firm-settings/tags-modal/tags-modal.component';
import { modalMapKeyTypes } from './customModal.type';
import { ManageThresholdModal } from '../../shared/modals/manage-threshold/manage-threshold.component';
import { MfwRequestModal } from 'src/app2/shared/modals/mfw-request/mfw-request.component';
import { AddIpConfigModal } from 'src/app2/shared/components/modal/add-ipconfig/add-ipconfig.component';
import { ManageWorkflowModal } from 'src/app2/shared/components/modal/manage-workflow/manage-workflow.component';
import { ManageWorkflowStepModal } from 'src/app2/shared/components/modal/manage-workflow-step/manage-workflow-step.component';
import { ManageDisclaimerModal } from 'src/app2/shared/components/modal/manage-disclaimer/manage-disclaimer.comonent';
import { ViewDisclaimerModal } from 'src/app2/shared/components/modal/view-disclaimer/view-disclaimer.component';
import { ManageEmailTemplateModal } from 'src/app2/shared/components/modal/manage-email-template/manage-email-template.component';
import { ViewEmailModal } from 'src/app2/shared/components/modal/view-email-template/view-email-template.component';
import { RatingSchemeModal } from 'src/app2/shared/components/modal/add-rating-scheme/add-rating-scheme.component';
import { ManageRiskRatingModal } from 'src/app2/shared/components/modal/manage-risk-rating-categories/manage-risk-rating-categories.component';
import { AddRatingScaleModal } from 'src/app2/shared/components/modal/add-rating-scale/add-rating-scale.component';
import { ManageRatingScaleModal } from 'src/app2/shared/components/modal/manage-rating-scale/manage-rating-scale.component';
import { UpdateImageModal } from 'src/app2/shared/components/modal/update-image/update-image.component';
import { ManageExportTemplateModal } from 'src/app2/shared/components/modal/manage-export-template/manage-export-template.component';
import { ViewServiceProviderModal } from 'src/app2/shared/components/modal/view-service-provider/view-service-provider.component';
import { ManagePermissionModal } from 'src/app2/shared/components/modal/manage-permission/manage-permission.component';
import { AddTeamModal } from 'src/app2/shared/components/modal/new-team/new-team.component';
import { EditTeamModal } from 'src/app2/shared/components/modal/edit-team/edit-team.component';
import { AddDdqModal } from 'src/app2/shared/modals/add-ddq/add-ddq.component';
import { ManageEventModal } from 'src/app2/shared/modals/manage-event/manage-event.component';
import { TriggerWorkflowModal } from 'src/app2/shared/modals/trigger-workflow/trigger-workflow.component';
import { ManageTaskModal } from 'src/app2/shared/modals/manage-task/manage-task.component';
import { ManageAumModal } from 'src/app2/shared/modals/manage-aum/manage-aum.component';
import { ManageAddressModal } from 'src/app2/shared/modals/manage-address/manage-address.component';
import { ManageFundModal } from 'src/app2/shared/modals/manage-fund/manage-fund.component';
import { ManageVehicleModal } from 'src/app2/shared/modals/manage-vehicle/manage-vehicle.component';
import { ManageFirmModal } from 'src/app2/shared/modals/manage-firm/manage-firm.component';
import { ManageContactModal } from 'src/app2/shared/modals/manage-contact/manage-contact.component';
import { ManageCustomFieldsModal } from 'src/app2/shared/modals/manage-custom-fields/manage-custom-fields.component';
import { InboundCreateConfirmComponent } from 'src/app2/shared/modals/inbound-create-confirm/inbound-create-confirm.component';
import { AssignSmeBulkComponent } from 'src/app2/modules/qa-bank/modal/assign-sme-bulk/assign-sme-bulk.component';
import { AssignNewTagsBulkComponent } from 'src/app2/modules/qa-bank/modal/assign-new-tag-bulk/assign-new-tag-bulk.component';
import { AssignExpiryDateBulkComponent } from 'src/app2/modules/qa-bank/modal/assign-expiry-date-bulk/assign-expiry-date-bulk.component';
import { AddNewUserComponent } from 'src/app2/shared/components/modal/new-user/new-user.component';
import { AddUsersToFuntionsComponent } from 'src/app2/shared/components/modal/add-users-to-functions/add-users-to-functions.component';
import { AddStrategyTagsModal } from 'src/app2/shared/components/modal/add-strategy/add-strategy.component';
import { ManageCategoriesComponent } from 'src/app2/modules/template-builder/modals/manage-categories/manage-categories.component';
import { ManageMoveComponent } from 'src/app2/modules/template-builder/modals/manage-move/manage-move.component';
import { NewQuestionComponent } from 'src/app2/modules/template-builder/modals/new-question/new-question.component';
import { PasteNestedQuestionComponent } from 'src/app2/modules/template-builder/modals/paste-nested-question/paste-nested-question.component';
import { ConfigureGridColumnsComponent } from 'src/app2/modules/template-builder/modals/configure-grid-columns/configure-grid-columns.component';
import { AlertBouncedContactsComponent } from 'src/app2/shared/modals/alert-bounced-contacts/alert-bounced-contacts.component';

import { RejectPendingRequestComponent } from 'src/app2/shared/modals/reject-pending-request/reject-pending-request.component';
import { ViewApproverNotesComponent } from 'src/app2/shared/modals/view-approver-notes/view-approver-notes.component';
import { PartnersDetailComponent } from 'src/app2/modules/partership-portal';
import {
  AddDisclaimerComponent,
  AutofillComponent,
  EncryptModal,
  ExportModal,
  GeneratePresentationReportModal,
  TemplateInfoComponent,
  ReviewCommentsComponent,
  ImportGridModal,
  EsAutofillComponent,
  AutofillHistoryComponent,
} from 'src/app2/modules/questionnaire/modals';
import { AssignReviwerComponent } from 'src/app2/modules/questionnaire/modals';
import { UploadAumFileModal } from 'src/app2/shared/modals/upload-aum-file/upload-aum-file.component';
import { AddInternalContactsModal } from 'src/app2/shared/modals/add-internal-contacts/add-internal-contacts.component';
import { ConfirmPendingRequestComponent } from 'src/app2/shared/modals/confirm-pending-request/confirm-pending-request.component';
import { DvAddRuleComponent } from 'src/app2/modules/template-builder/components/rule-builder/dv-add-rule/dv-add-rule.component';
import {
  EditQuestionFAQ,
  EditTemplateModalComponent,
  FormulaSetupComponent,
  ImportingFirmsComponent,
  ManageWidgetComponent,
  NewTemplateComponent,
  RatingMapComponent,
} from 'src/app2/modules/template-builder/modals';
import { ManageQuestionSelectionModal } from 'src/app2/shared/modals/manage-question-selection/manage-question-selection.component';
import { ManageExcelTemplateComponent } from 'src/app2/modules/new-parser/modals/manage-excel-template.component';
import { UploadQaFileComponent } from 'src/app2/modules/new-parser/upload-qa-file/upload-qa-file.component';
import { ViewUnmarkedItemsComponent } from 'src/app2/modules/new-parser/modals/view-unmarked-items/view-unmarked-items.component';
import { ManageExcelSheetsComponent } from 'src/app2/modules/new-parser/modals/manage-excel-sheets/manage-excel-sheets.component';
import { ManageExcelFileComponent } from 'src/app2/modules/new-parser/manage-excel-file/manage-excel-file.component';
import { FullResponseModal } from 'src/app2/modules/questionnaire/modals';
import { AddStandardResponseComponent } from 'src/app2/shared/modals/add-standard-response/add-standard-response.component';
import { ViewRelatedDiligencesComponent } from 'src/app2/modules/questionnaire/modals/view-related-diligences/view-related-diligences.component';
import { CreateCustomViewModal } from 'src/app2/modules/advanced-reporting/modals/create-customview/create-customview.component';
import { CreateCustomviewGroupModal } from 'src/app2/modules/advanced-reporting/modals/create-customview-group/create-customview-group.component';
import { UploadCrdComponent } from 'src/app2/shared/modals/upload-crd/upload-crd.component';
import { InboundAddEditComponent } from 'src/app2/shared/modals/inbound-add-edit/inbound-add-edit.component';
import { ViewQuestionTagsComponent } from 'src/app2/shared/modals/view-question-tags/view-question-tags.component';
import {} from 'src/app2/shared/components/modal/existing-documents/existing-documents.component';
import { ManageSubscribersModal } from 'src/app2/shared/modals/manage-subscribers/manage-subscribers.component';
import { ExistingDocumentsComponent } from 'src/app2/shared/components/modal/existing-documents/existing-documents.component';
import { NewDocumentsComponent } from 'src/app2/shared/components/modal/new-documents/new-documents.component';
import { NewReviewDefinitionModal } from 'src/app2/shared/components/modal/new-review-definition/new-review-definition.component';
import { FeedbackComponent } from 'src/app2/shared/common/feedback/feedback.component';
import { ManageQuestionCustomSearchComponent } from 'src/app2/modules/qa-bank/modal/manage-question-custom-search/manage-question-custom-search.component';
import { AssignAccessLevelModal } from 'src/app2/shared/components/modal/assign-access-level/assign-access-level.component';
import { AccessLevelConfigModal } from 'src/app2/shared/components/modal/new-access-level-config/new-access-level-config.component';
import { AccessLevelDescriptionModal } from 'src/app2/shared/components/modal/new-access-level-description/new-access-level-description.component';
import { AddNotesComponent } from 'src/app2/shared/modals/add-notes/add-notes.component';
import { SaveBulkUploadMapping } from 'src/app2/shared/components/modal/save-bulk-upload-mapping/save-bulk-upload-mapping.component';
import { ManageCustomSearchComponent } from 'src/app2/shared/modals/manage-custom-search/manage-custom-search.component';
import { ManagePublicContactComponent } from 'src/app2/shared/modals/manage-public-contact/manage-public-contact.component';
import { QuestionnaireUploadImageComponent } from 'src/app2/shared/modals/questionnaire-upload-image/questionnaire-upload-image.component';
import { ManageBulkDocumentComponent } from 'src/app2/shared/modals/manage-bulk-document/manage-bulk-document.component';
import { ViewDuplicateFirmsComponent } from 'src/app2/shared/modals/view-duplicate-firms/view-duplicate-firms.component';
import { AddReportTemplateComponent } from 'src/app2/modules/reports/modal/add-report-template/add-report-template.component';
import { ManageWordFileComponent } from 'src/app2/modules/new-parser/modals/manage-word-file/manage-word-file.component';
import { ManageDocumentComponent } from 'src/app2/shared/modals/manage-document/manage-document.component';
import { BulkActionMappingPreview } from 'src/app2/modules/firm-settings/bulk-actions-mappings-preview/bulk-actions-mappings-preview.component';
import { ManageDocumentsComponent } from 'src/app2/shared/components/modal/manage-documents/manage-documents.component';
import { BulkActionMappingCountPreview } from 'src/app2/modules/firm-settings/bulk-actions-mapping-count-preview/bulk-actions-mapping-count-preview.component';
import { ExcelSyncModal } from 'src/app2/modules/questionnaire/modals/excel-sync/excel-sync.component';
import { ReleaseNoteModalTemplateComponent } from 'src/app2/shared/components/modal/release-note-modal-template/release-note-modal-template.component';
import { EucModalComponent } from 'src/app2/shared/modals/euc/euc-modal.component';
import { SaveViewModal } from 'src/app2/shared/modals/save-view/save-view.component';
import { SaveViewDetailsModal } from 'src/app2/shared/modals/save-view-details/save-view-details.component';
import { DvDocumentOperationModalComponent } from 'src/app2/shared/components/modal/dv-document-operation-modal/dv-document-operation-modal.component';
import { CreateDocumentComponent } from 'src/app2/shared/modals/create-document/create-document.component';
import { UploadDocumentFolderComponent } from 'src/app2/shared/modals/upload-document-folder/upload-document-folder.component';
import { UseExsistingDocumentComponent } from 'src/app2/shared/modals/use-exsisting-document/use-exsisting-document.component';
import { BulkEditDocumentsModalComponent } from 'src/app2/shared/components/modal/bulk-edit-documents-modal/bulk-edit-documents-modal.component';
import { BulkOrganizeAttachmentsModal } from 'src/app2/shared/components/modal/bulk-organize-attachments/bulk-organize-attachments.component';
import { PopupMessageComponent } from 'src/app2/shared/modals/popup-message/popup-message.component';
import { ViewSelectedEntitiesComponent } from 'src/app2/shared/modals/view-selected-entities/view-selected-entities.component';

import { EditExcelSelectionComponent } from 'src/app2/shared/modals/edit-excel-selection/edit-excel-selection.component';
import { ProjectSearchComponent } from 'src/app2/modules/projects-grid/projects-layout/modal/project-search/project-search.component';
import { AddPreApprovedComponent } from 'src/app2/shared/modals/add-pre-approved/add-pre-approved.component';
import { PolicyChangesComponent } from 'src/app2/shared/modals/policy-changes/policy-changes.component';

@Injectable()
export class CustomModalService {
  ref: BsModalRef;
  activeModals = [];
  constructor(private modalService: BsModalService) {}

  modalMapper = new Map<modalMapKeyTypes, any>([
    ['manage-diligence', ManageDiligenceModal],
    ['extend-duedate', ExtendDueDateModal],
    ['approve-extension', ApproveExtensionModal],
    ['copy-verifiers', CopyVerifiersModal],
    ['manage-ratings', ManageRatingsModal],
    ['add-verifier', AddVerifierModal],
    ['share-document', ShareDocumentModal],
    ['firm-tags', TagsModal],
    ['add-domain', AddDomainModal],
    ['add-ipconfig', AddIpConfigModal],
    ['manage-workflow', ManageWorkflowModal],
    ['manage-workflow-step', ManageWorkflowStepModal],
    ['manage-disclaimer', ManageDisclaimerModal],
    ['view-disclaimer', ViewDisclaimerModal],
    ['manage-email-template', ManageEmailTemplateModal],
    ['view-email-template', ViewEmailModal],
    ['add-rating-scheme', RatingSchemeModal],
    ['manage-risk-rating-categories', ManageRiskRatingModal],
    ['add-rating-scale', AddRatingScaleModal],
    ['manage-rating-scale', ManageRatingScaleModal],
    ['update-image', UpdateImageModal],
    ['manage-export-template', ManageExportTemplateModal],
    ['view-service-provider', ViewServiceProviderModal],
    ['manage-permissions', ManagePermissionModal],
    ['new-team', AddTeamModal],
    ['edit-team', EditTeamModal],
    ['manage-threshold', ManageThresholdModal],
    ['mfw-request', MfwRequestModal],
    ['add-ddq', AddDdqModal],
    ['euc-modal', EucModalComponent],
    ['manage-event', ManageEventModal],
    ['trigger-workflow', TriggerWorkflowModal],
    ['manage-task', ManageTaskModal],
    ['manage-aum', ManageAumModal],
    ['manage-address', ManageAddressModal],
    ['manage-fund', ManageFundModal],
    ['manage-vehicle', ManageVehicleModal],
    ['manage-firm', ManageFirmModal],
    ['manage-contact', ManageContactModal],
    ['manage-custom-fields', ManageCustomFieldsModal],
    ['inbound-create-confirm', InboundCreateConfirmComponent],
    ['add-report-template', AddReportTemplateComponent],
    ['assign-sme-bulk', AssignSmeBulkComponent],
    ['assign-tag-bulk', AssignNewTagsBulkComponent],
    ['assign-expiry-date-bulk', AssignExpiryDateBulkComponent],
    ['new-user', AddNewUserComponent],
    ['add-users-to-function', AddUsersToFuntionsComponent],
    ['add-strategy', AddStrategyTagsModal],
    ['manage-category', ManageCategoriesComponent],
    ['manage-move', ManageMoveComponent],
    ['new-question', NewQuestionComponent],
    ['paste-nested-question', PasteNestedQuestionComponent],
    ['configure-grid-columns', ConfigureGridColumnsComponent],
    ['alert-bounced-contacts', AlertBouncedContactsComponent],
    ['reject-pending-request', RejectPendingRequestComponent],
    ['view-approver-notes', ViewApproverNotesComponent],
    ['partners-detail', PartnersDetailComponent],
    ['manage-question-selection', ManageQuestionSelectionModal],
    ['add-internal-contacts', AddInternalContactsModal],
    ['upload-aum-file', UploadAumFileModal],
    ['confirm-pending-request', ConfirmPendingRequestComponent],
    ['add-rule', DvAddRuleComponent],
    ['manage-widget', ManageWidgetComponent],
    ['edit-template', EditTemplateModalComponent],
    ['formula-setup', FormulaSetupComponent],
    ['add-notes', AddNotesComponent],
    ['new-template', NewTemplateComponent],
    ['rating-map', RatingMapComponent],
    ['auto-fill', AutofillComponent],
    ['assign-reviewer', AssignReviwerComponent],
    ['export-preferences', ExportModal],
    ['encrypt-questionnaire', EncryptModal],
    ['generate-presentation-report', GeneratePresentationReportModal],
    ['auto-fill', AutofillComponent],
    ['full-response', FullResponseModal],
    ['assign-reviewer', AssignReviwerComponent],
    ['template-info', TemplateInfoComponent],
    ['add-standard-response', AddStandardResponseComponent],
    ['add-disclaimer', AddDisclaimerComponent],
    ['existing-documents', ExistingDocumentsComponent],
    ['review-comments', ReviewCommentsComponent],
    ['import-grid', ImportGridModal],
    ['add-to-preapproved', AddPreApprovedComponent],
    ['view-related-projects', ViewRelatedDiligencesComponent],
    ['new-documents', NewDocumentsComponent],
    ['importing-firms', ImportingFirmsComponent],
    ['powerbi-create-customview', CreateCustomViewModal],
    ['powerbi-create-customview-group', CreateCustomviewGroupModal],
    ['manage-excel-template', ManageExcelTemplateComponent],
    ['upload-qa-file', UploadQaFileComponent],
    ['inbound-add-edit', InboundAddEditComponent],
    // ['manage-excel-template', ManageExcelTemplateComponent],
    ['upload-qa-file', UploadQaFileComponent],
    ['edit-question-faq', EditQuestionFAQ],
    ['view-question-tags', ViewQuestionTagsComponent],
    ['upload-crd', UploadCrdComponent],
    ['manage-subscribers', ManageSubscribersModal],
    ['manage-documents', ManageDocumentsComponent],
    ['save-bulk-upload-mapping', SaveBulkUploadMapping],
    ['feedback-model', FeedbackComponent],
    ['manage-custom-search', ManageCustomSearchComponent],
    ['manage-public-contacts', ManagePublicContactComponent],
    ['questionnaire-upload-image', QuestionnaireUploadImageComponent],
    ['view-question-tags', ViewQuestionTagsComponent],
    ['manage-bulk-document', ManageBulkDocumentComponent],
    ['view-duplicate-firm', ViewDuplicateFirmsComponent],
    ['manage-documents', ManageDocumentsComponent],
    ['add-pre-approved', AddPreApprovedComponent],
    ['manage-question-custom-search', ManageQuestionCustomSearchComponent],
    ['assign-access-level', AssignAccessLevelModal],
    ['access-level-config', AccessLevelConfigModal],
    ['access-level-description', AccessLevelDescriptionModal],
    ['new-review-definition', NewReviewDefinitionModal],
    ['es-autofill', EsAutofillComponent],
    ['autofill-history', AutofillHistoryComponent],
    ['preview-saved-mapping', BulkActionMappingPreview],
    ['view-unmarked-items', ViewUnmarkedItemsComponent],
    ['manage-excel-sheets', ManageExcelSheetsComponent],
    ['manage-excel-file', ManageExcelFileComponent],
    ['manage-word-file', ManageWordFileComponent],
    ['manage-document', ManageDocumentComponent],
    ['preview-mapping-count', BulkActionMappingCountPreview],
    ['release-note-modal-template', ReleaseNoteModalTemplateComponent],
    ['excel-sync-questionnaire', ExcelSyncModal],
    ['popup-message', PopupMessageComponent],
    ['view-selected-entities', ViewSelectedEntitiesComponent],
    ['edit-excel-selection', EditExcelSelectionComponent],
    ['save-view', SaveViewModal],
    ['save-view-details', SaveViewDetailsModal],
    ['dv-document-operation-modal', DvDocumentOperationModalComponent],
    ['create-document', CreateDocumentComponent],
    ['upload-document-folder', UploadDocumentFolderComponent],
    ['use-existing-document', UseExsistingDocumentComponent],
    ['bulk-edit-documents-modal', BulkEditDocumentsModalComponent],
    ['bulk-organize-attachments', BulkOrganizeAttachmentsModal],
    ['project-search', ProjectSearchComponent],
    ['policy-changes', PolicyChangesComponent],
  ]);

  close() {
    this.ref.hide();
    this.activeModals.pop();
  }

  invoke(modalName: any, modalConfig?: ModalOptions) {
    const modal = this.modalMapper.get(modalName);
    if (!modal) {
      throw new Error(`Modal name "${modalName}" not found.`);
    }

    this.ref = this.modalService.show(this.modalMapper.get(modalName), {
      class: modalName == 'feedback-model' ? 'modal-dialog-custom' : '',
      initialState: { ...modalConfig?.initialState },
      ignoreBackdropClick: true,
      ...modalConfig,
    });
    this.activeModals.push(this.ref);
    return this.ref;
  }

  closeAllActiveModals() {
    this.activeModals.forEach((modal) => {
      modal.hide();
    });
  }
}
