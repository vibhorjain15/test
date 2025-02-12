import { Injectable } from '@angular/core';
import { AgGridSideBarComponent } from '../shared/components/ag-grid-side-bar/ag-grid-side-bar.component';
import { ActionsCellRendererComponent } from '../shared/components/actions-cell-renderer/actions-cell-renderer.component';
import { DeleteActionCellRendererComponent } from './../shared/components/delete-action-cell-renderer/delete-action-cell-renderer.component';
import { EmailTemplateActionsComponent } from '../shared/components/email-template-actions/email-template-actions.component';
import { ProjectStatusRendererComponent } from '../shared/components/project-status-renderer/project-status-renderer.component';
import { ProjectTypeRendererComponent } from '../shared/components/project-type-renderer/project-type-renderer.component';
import { ProjectStatusIconRendererComponent } from '../shared/components/project-status-icon-renderer/project-status-icon-renderer.component';
import { ProgressBarRendererComponent } from '../shared/components/progress-bar-renderer/progress-bar-renderer.component';
import { ProjectActionsSentTabRendererComponent } from '../shared/components/project-actions-sent-tab-renderer/project-actions-sent-tab-renderer.component';
import { DisclaimerActionsComponent } from '../shared/components/disclaimer-actions/disclaimer-actions.component';
import { MyAccountsActionsComponent } from '../shared/components/my-accounts-actions/my-accounts-actions.component';
import { EntityActionComponent } from '../shared/components/entity-action/entity-action.component';
import { MyAdminEmailActionComponent } from '../shared/components/my-admin-email-action/my-admin-email-action.component';
import { EmailTemplateContentComponent } from '../shared/components/email-template-content/email-template-content.component';
import { EmailTemplateNameComponent } from '../shared/components/email-template-name/email-template-name.component';
import { DocumentNameCellRendererComponent } from '../shared/components/document-name-cell-renderer/document-name-cell-renderer.component';
import { GroupableFieldNameComponent } from '../shared/components/groupable-field-name/groupable-field-name.component';
import { GroupableGroupNameComponent } from '../shared/components/groupable-group-name/groupable-group-name.component';
import { DocumentActionComponent } from '../shared/components/document-action/document-action.component';
import { EntityStatusComponent } from '../shared/components/entity-status/entity-status.component';
import { ContactNameComponent } from '../shared/components/contact-name/contact-name.component';
import { HttpClient } from '@angular/common/http';
import { WorkflowTagsComponent } from '../shared/components/workflow-tags/workflow-tags.component';
import { WorkflowNameComponent } from '../shared/components/workflow-name/workflow-name.component';
import { DisclaimerNameComponent } from '../shared/components/disclaimer-name/disclaimer-name.component';
import { ExcelSyncUploadActionComponent } from '../shared/components/excel-sync-upload-action/excel-sync-upload-action.component';
import { ExcelSyncStatusComponent } from '../shared/components/excel-sync-status/excel-sync-status.component';
import { PaginationBarComponent } from '../shared/components/dv-grid/pagination-bar/pagination-bar.component';
import { Subject } from 'rxjs';
import { FunctionsActionsRendererComponent } from '../shared/components/functions-actions-renderer/functions-actions-renderer.component';
import { FunctionUsersComponent } from '../shared/components/function-users/function-users.component';
import { TextFloatingFilterComponent } from '../shared/components/text-floating-filter-component/text-floating-filter-component.component';
import { Store } from '@ngxs/store';
import { GridLabelCellComponent } from '../modules/invite/investor/component/gridLabelcell/gridLabelcell.component';
import { GridStatusCellComponent } from '../modules/invite/investor/component/gridStatusCell/gridStatusCell.component';
import { EntityNameLinkCellRendererComponent } from '../modules/invite/investor/component/entity-name-link/entity-name-link.component';
import { ReportListActionCellComponent } from '../modules/reports/components/report-list-action-cell/report-list-action-cell.component';
import { MyAdminNameActionComponent } from '../shared/components/my-admin-name-action/my-admin-name-action.component';
import { ExcelSyncFileNameComponent } from '../shared/components/excel-sync-file-name/excel-sync-file-name.component';
import { DropdownFloatingFilterComponent } from '../shared/components/dropdown-floating-filter/dropdown-floating-filter.component';
import { ProjectEntityNameRendererComponent } from '../shared/components/project-entity-name-renderer/project-entity-name-renderer.component';
import { ProjectClientNameRendererComponent } from '../shared/components/project-client-name-renderer/project-client-name-renderer.component';
import { AssignmentStatusRendererComponent } from '../shared/components/assignment-status-renderer/assignment-status-renderer.component';
import { CustomFieldCellRendererComponent } from '../shared/components/custom-field-cell-renderer/custom-field-cell-renderer.component';
import { CustomFieldCellLinkRendererComponent } from '../shared/components/custom-field-cell-link-renderer/custom-field-cell-link-renderer.component';
import { PermissionVisibilityComponent } from '../shared/components/permission-visibility/permission-visibility.component';
import { DeleteGridState, UpdateGridState } from '../store/grid/grid.action';
import { FormAdvFirmNameComponent } from '../shared/components/form-adv-firm-name/form-adv-firm-name.component';
import { FormAdvActionsComponent } from '../shared/components/form-adv-actions/form-adv-actions.component';
import { FormAdvChangeCountComponent } from '../shared/components/form-adv-change-count/form-adv-change-count.component';
import { FormAdvServiceProviderNameComponent } from '../shared/components/form-adv-service-provider-name/form-adv-service-provider-name.component';
import { FormAdvPrivateFundsNameComponent } from '../shared/components/form-adv-private-funds-name/form-adv-private-funds-name.component';
import { FormAdvPrivateFundsTypeComponent } from '../shared/components/form-adv-private-funds-type/form-adv-private-funds-type.component';
import { FunctionMyActionsActionComponent } from '../shared/components/function-my-actions-action/function-my-actions-action.component';
import { DdDueDateComponent } from '../shared/components/dd-due-date/dd-due-date.component';
import { MyActionsEntityNameComponent } from '../shared/components/my-actions-entity-name/my-actions-entity-name.component';
import { WorkFlowResourceTypeComponent } from '../shared/components/work-flow-resource-type/work-flow-resource-type.component';
import { EmptyCellComponent } from '../shared/components/empty-cell/empty-cell.component';
import { WorkflowLastUpdatedComponent } from '../shared/components/workflow-last-updated/workflow-last-updated.component';
import { WorkflowPercentageComponent } from '../shared/components/workflow-percentage/workflow-percentage.component';
import { WorkflowLastStepComponent } from '../shared/components/workflow-last-step/workflow-last-step.component';
import { ScoresBadgeComponent } from '../shared/components/scores-badge/scores-badge.component';
import { ScoresFlagComponent } from '../shared/components/scores-flag/scores-flag.component';
import { ScoresDdFirmNameComponent } from '../shared/components/scores-dd-firm-name/scores-dd-firm-name.component';
import { ScoresCreationDateComponent } from '../shared/components/scores-creation-date/scores-creation-date.component';

import { DvStatusTagComponent } from '../shared/components/dv-status-tag/dv-status-tag.component';
import { MyAdminTypeComponent } from '../shared/components/my-admin-type-cell-renderer/my-admin-type-cell-renderer.component';
import { InvestorPitchActionComponent } from '../modules/inbound-management/investor-pitch-action/investor-pitch-action.component';
import { InboundActionsComponent } from '../modules/inbound-management/inbound-actions/inbound-actions.component';
import { InboundViewComponent } from '../modules/inbound-management/inbound-view/inbound-view.component';
import { InboundLinksComponent } from '../modules/inbound-management/inbound-links/inbound-links.component';
import { InboundContactsComponent } from '../modules/inbound-management/inbound-contacts/inbound-contacts.component';
import { InboundNameComponent } from '../modules/inbound-management/inbound-name/inbound-name.component';
import { InboundVisiblityComponent } from '../modules/inbound-management/inbound-visiblity/inbound-visiblity.component';
import { InboundTemplateNameComponent } from '../modules/inbound-management/inbound-template-name/inbound-template-name.component';
import { InboundEmailTemplateComponent } from '../modules/inbound-management/inbound-email-template/inbound-email-template.component';
import { InboundInvestorFirmsComponent } from '../modules/inbound-management/inbound-investor-firms/inbound-investor-firms.component';
import { ShareActionComponent } from '../modules/project/share/share-action/share-action.component';
import { ShareStatusComponent } from '../modules/project/share/share-status/share-status.component';
import {
  IssueLevelTagComponent,
  IssueTagComponent,
  IssueTagsComponent,
  MediumDateCellRendererComponent,
  CellHtmlComponent,
} from '../modules/recommendation/ag-cell-renderers';
import { ReviewedByNameComponent } from '../shared/components/reviewed-by-name/reviewed-by-name.component';
import { DvTemplateDateComponent } from '../shared/components/dv-template-date/dv-template-date.component';
import { AdvFrimFundCellRenderComponent } from '../modules/data-hub/adv-frim-fund-cell-render/adv-frim-fund-cell-render.component';
import { AssociatedNameComponent } from '../shared/components/associated-name/associated-name.component';
import { ReportTypeCellRendererComponent } from '../modules/reports/templates/report-type-cell-renderer/report-type-cell-renderer.component';
import { ShareAtComponent } from '../modules/project/share/share-at/share-at.component';
import { EmptyCellRenderer } from '../shared/components/empty-cell-renderer/empty-cell-renderer.component';
import { MyDownloadFileNameRenderer } from '../shared/components/my-downloads-filename-renderer/my-downloads-filename-renderer.component';
import { MyDownloadExpiryRenderer } from '../shared/components/my-downloads-expiry-renderer/my-downloads-expiry-renderer.component';
import { CommonTagsRenderer } from '../shared/components/common-tags-renderer/common-tags-renderer.component';
import { FormAdvBrochureUrlComponent } from '../shared/components/form-adv-brochure-url/form-adv-brochure-url.component';
import { AccessLevelCellActionsRendererComponent } from '../shared/components/access-level-cell-actions/access-level-cell-actions.component';
import { DescriptionCellRendererComponent } from '../shared/components/description-cell-renderer/description-cell-renderer.component';
import { DvRelationshipStatusTagComponent } from '../shared/components/dv-relationship-status-tag/dv-relationship-status-tag.component';
import { ReviewDefinitionNameComponent } from '../shared/components/review-definitions-name/review-definitions-name.component';
import { reviewAssignmentsStatusRenderer } from '../shared/components/review-assignments-status-renderer/review-assignments-status-renderer';
import { ReviewNameRendererComponent } from '../shared/components/review-name-renderer/review-name-renderer.component';
import { ProjectTemplateNameRendererComponent } from '../shared/components/project-template-name-renderer/project-template-name-renderer.component';
import { DropdownFloatingYesnoFilterComponent } from '../shared/components/dropdown-floating-yesno-filter/dropdown-floating-yesno-filter.component';
import { ReleasesActionCellRendererComponent } from '../shared/components/releases-action-cell-renderer/releases-action-cell-renderer.component';
import { TemplateRatingSchemeRendererComponent } from '../shared/components/dv-template-rating-scheme-renderer/dv-template-rating-scheme-renderer.component';
import { TemplateRatingSchemeCustomFieldsRendererComponent } from '../shared/components/dv-template-rating-scheme-custom-fields-renderer/dv-template-rating-scheme-custom-fields-renderer.component';
import { ReleaseNotesDescriptionTemplateComponent } from '../shared/components/release-notes-description-template/release-notes-description-template.component';
import { EntityNameCellRendererComponent } from '../shared/components/entity-name-cell-renderer/entity-name-cell-renderer.component';
import { NameWithIconCellRendererComponent } from '../shared/components/name-with-icon-cell-renderer/name-with-icon-cell-renderer.component';
import { FolderCellRendererComponent } from '../shared/components/folder-cell-renderer/folder-cell-renderer.component';
import { DvFolderSelectionCellRendererComponent } from '../shared/components/dv-folder-selection-grid/dv-folder-selection-cell-renderer/dv-folder-selection-cell-renderer.component';
import { AdvFilingDateComponent } from '../shared/components/adv-filing-date/adv-filing-date.component';
import { AdvAumMillionComponent } from '../shared/components/adv-aum-million/adv-aum-million.component';
import { RatingCustomFieldCellRendererComponent } from '../shared/components/rating-custom-field-cell-renderer/rating-custom-field-cell-renderer.component';
import { TaskTypeComponent } from '../shared/components/task_type/task_type.component';
import { WorkflowProgressCellRendererComponent } from '../shared/components/grid-cell-workflow-progress/grid-cell-workflow-progress.component';
import { WorkflowActivityCellRendererComponent } from '../shared/components/grid-cell-workflow-activity/grid-cell-workflow-activity.component';
import { WorkflowOwnersCellRendererComponent } from '../shared/components/grid-cell-workflow-owners/grid-cell-workflow-owners.component';
import { MyWorkRowBadgeComponent } from '../shared/components/my-work-row-badge/my-work-row-badge.component';
import { BannersActionCellRendererComponent } from '../shared/components/banners-action-cell-renderer/banners-action-cell-renderer.component';
import { NumericCellRendererComponent } from '../shared/components/numeric-cell-renderer/numeric-cell-renderer.component';

@Injectable({
  providedIn: 'root',
})
export class GridService {
  private gridPaginationChanges = new Subject<any>();
  gridPaginationChanged$ = this.gridPaginationChanges.asObservable();
  private gridPageSizeChanged = new Subject<any>();
  gridPageSizeChanged$ = this.gridPageSizeChanged.asObservable();

  private clearFilterTrigger = new Subject<any>();
  clearFilterTriggered$ = this.clearFilterTrigger.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly store: Store
  ) {}

  getFrameWorkComponents() {
    return {
      agGridSideBarComponent: AgGridSideBarComponent,
      actionsCellRenderer: ActionsCellRendererComponent,
      accessLevelCellActions: AccessLevelCellActionsRendererComponent,
      descriptionCellRenderer: DescriptionCellRendererComponent,
      deleteActionsCellRenderer: DeleteActionCellRendererComponent,
      emailTemplateActionsCellRenderer: EmailTemplateActionsComponent,
      projectStatusRenderer: ProjectStatusRendererComponent,
      projectTypeRenderer: ProjectTypeRendererComponent,
      projectStatusIconRenderer: ProjectStatusIconRendererComponent,
      ProjectTemplateNameRenderer: ProjectTemplateNameRendererComponent,
      progressBarRenderer: ProgressBarRendererComponent,
      newProgressBarRenderer: WorkflowProgressCellRendererComponent,
      workflowActivityRenderer: WorkflowActivityCellRendererComponent,
      workflowOwnersRenderer: WorkflowOwnersCellRendererComponent,
      projectActionsSentTabRenderer: ProjectActionsSentTabRendererComponent,
      disclaimerTemplateActionsCellRenderer: DisclaimerActionsComponent,
      myAccountsActionsCellRenderer: MyAccountsActionsComponent,
      permissionEntityActionsCellRenderer: EntityActionComponent,
      myAdminEmailActionCellRenderer: MyAdminEmailActionComponent,
      myAdminNameActionCellRenderer: MyAdminNameActionComponent,
      emailTemplateContentComponentCellRenderer: EmailTemplateContentComponent,
      releaseNotesDescriptionTemplateCellRenderer:
        ReleaseNotesDescriptionTemplateComponent,
      emailTemplateNameCellRenderer: EmailTemplateNameComponent,
      workflowTagsCellRenderer: WorkflowTagsComponent,
      workflowNameCellRenderer: WorkflowNameComponent,
      associatedNameCellRenderer: AssociatedNameComponent,
      reviewDefinitionsNameRenderer: ReviewDefinitionNameComponent,
      disclaimerNameCellRenderer: DisclaimerNameComponent,
      excelSyncUploadActionCellRenderer: ExcelSyncUploadActionComponent,
      excelSyncStatusCellRenderer: ExcelSyncStatusComponent,
      documentNameCellRendererComponent: DocumentNameCellRendererComponent,
      folderCellRendererComponent: FolderCellRendererComponent,
      groupableFieldNameCellRenderer: GroupableFieldNameComponent,
      groupableGroupNameCellRenderer: GroupableGroupNameComponent,
      documentActionCellRenderer: DocumentActionComponent,
      entityStatusCellRenderer: EntityStatusComponent,
      contactNameCellRenderer: ContactNameComponent,
      paginationBarComponent: PaginationBarComponent,
      functionUsersRenderer: FunctionUsersComponent,
      functionsActionsRenderer: FunctionsActionsRendererComponent,
      textFloatingFilterComponent: TextFloatingFilterComponent,
      excelSyncFileNameComponent: ExcelSyncFileNameComponent,
      dropdownFloatingFilterComponent: DropdownFloatingFilterComponent,
      dropdownFloatingYesnoFilterComponent:
        DropdownFloatingYesnoFilterComponent,
      projectEntityNameRenderer: ProjectEntityNameRendererComponent,
      projectClientNameRenderer: ProjectClientNameRendererComponent,
      GridLabelCellComponent: GridLabelCellComponent,
      GridStatusCellComponent: GridStatusCellComponent,
      EntityNameLinkCellRendererComponent: EntityNameLinkCellRendererComponent,
      ReportListActionCellComponent: ReportListActionCellComponent,
      assignmentStatusRenderer: AssignmentStatusRendererComponent,
      customFieldCellRenderer: CustomFieldCellRendererComponent,
      ratingCustomFieldCellRenderer: RatingCustomFieldCellRendererComponent,
      ReviewedByNameComponentRenderer: ReviewedByNameComponent,
      customFieldCellLinkRenderer: CustomFieldCellLinkRendererComponent,
      permissionVisibilityRenderer: PermissionVisibilityComponent,
      formAdvFirmNameComponent: FormAdvFirmNameComponent,
      FormAdvBrochureUrlComponent: FormAdvBrochureUrlComponent,
      formAdvActionsComponent: FormAdvActionsComponent,
      formAdvChangeCountComponent: FormAdvChangeCountComponent,
      formAdvServiceProviderNameComponent: FormAdvServiceProviderNameComponent,
      formAdvPrivateFundsName: FormAdvPrivateFundsNameComponent,
      formAdvPrivateFundsType: FormAdvPrivateFundsTypeComponent,
      functionMyActionsActionRenderer: FunctionMyActionsActionComponent,
      functionDDDdueDateRenderer: DdDueDateComponent,
      functionEntryNameRenderer: MyActionsEntityNameComponent,
      WorkFlowResourceType: WorkFlowResourceTypeComponent,
      emptyCell: EmptyCellComponent,
      lastUpdated: WorkflowLastUpdatedComponent,
      percentageRender: WorkflowPercentageComponent,
      workflowLastStep: WorkflowLastStepComponent,
      scoresBadge: ScoresBadgeComponent,
      scoresFlag: ScoresFlagComponent,
      scoresDDFirmName: ScoresDdFirmNameComponent,
      scoresCreationDate: ScoresCreationDateComponent,
      DvStatusTagComponentRenderer: DvStatusTagComponent,
      myAdminTypeCellRenderer: MyAdminTypeComponent,
      investorPitchAction: InvestorPitchActionComponent,
      inboundActionsCellRenderer: InboundActionsComponent,
      inboundViewCellRenderer: InboundViewComponent,
      inboundLinksCellRenderer: InboundLinksComponent,
      inboundContactsCellRenderer: InboundContactsComponent,
      inboundNameCellRender: InboundNameComponent,
      inboundVisibilityCellRenderer: InboundVisiblityComponent,
      InboundTemplateCellRender: InboundTemplateNameComponent,
      InboundEmailTemplateCellRenderer: InboundEmailTemplateComponent,
      InboundInvestorFirmsCellRenderer: InboundInvestorFirmsComponent,
      ShareActionRenderer: ShareActionComponent,
      ShareStatusComponentRenderer: ShareStatusComponent,
      IssueLevelTagComponentRenderer: IssueLevelTagComponent,
      IssueTagsComponentRenderer: IssueTagsComponent,
      IssueTagComponentRenderer: IssueTagComponent,
      TaskTypeComponentRenderer: TaskTypeComponent,
      MyWorkRowBadgeComponentRenderer: MyWorkRowBadgeComponent,
      MediumDateCellRenderer: MediumDateCellRendererComponent,
      CellHtmlRenderer: CellHtmlComponent,
      DvTemplateDateComponentRenderer: DvTemplateDateComponent,
      reportTypeCellRenderer: ReportTypeCellRendererComponent,
      AdvFrimFundCellRenderer: AdvFrimFundCellRenderComponent,
      EmptyTextCellRenderer: EmptyCellRenderer,
      ShareAtComponentRenderer: ShareAtComponent,
      DvRelationshipStatusTagComponentRenderer:
        DvRelationshipStatusTagComponent,
      myDownloadFileNameRenderer: MyDownloadFileNameRenderer,
      myDownloadExpiryRenderer: MyDownloadExpiryRenderer,
      commonTagsRenderer: CommonTagsRenderer,
      ReviewRenderer: reviewAssignmentsStatusRenderer,
      ReviewNameRenderer: ReviewNameRendererComponent,
      NameWithIconCellRenderer: NameWithIconCellRendererComponent,
      releasesActionCellRenderer: ReleasesActionCellRendererComponent,
      TemplateRatingSchemeRenderer: TemplateRatingSchemeRendererComponent,
      TemplateRatingSchemeCustomFieldsRenderer:
        TemplateRatingSchemeCustomFieldsRendererComponent,
      entityNameCellRenderer: EntityNameCellRendererComponent,
      dvFolderSelectionCellRendererComponent:
        DvFolderSelectionCellRendererComponent,
      AdvFilingDateRenderer: AdvFilingDateComponent,
      AdvAumMillionRenderer: AdvAumMillionComponent,
      bannersActionCellRenderer: BannersActionCellRendererComponent,
      NumericCellRenderer: NumericCellRendererComponent,
    };
  }
  getSidebar() {
    return {
      toolPanels: [
        {
          id: 'columns',
          labelDefault: 'Edit Columns',
          labelKey: 'columns',
          iconKey: 'columns',
          toolPanel: 'agColumnsToolPanel',
          toolPanelParams: {
            suppressRowGroups: true,
            suppressValues: true,
            suppressPivots: true,
            suppressPivotMode: true,
            suppressColumnFilter: true,
            suppressColumnSelectAll: true,
            suppressColumnExpandAll: true,
          },
        },
        {
          id: 'agGridSideBar',
          labelDefault: 'Export',
          labelKey: 'agGridSideBar',
          iconKey: 'menu',
          toolPanel: 'agGridSideBarComponent',
        },
      ],
    };
  }

  filterRowData(array: any[], key: string, character: string): any[] {
    return array?.filter((row) => {
      return row[key].toLowerCase().startsWith(character);
    });
  }

  getGridSates() {
    return this.http.get(`V2/GridStates`);
  }

  getGridStatesByType(name) {
    return this.http.get('gridviews', {
      params: {
        grid_name: name,
      },
    });
  }

  saveCurrentView(columnDefs, gridName) {
    const params = {
      [gridName]: JSON.stringify(columnDefs),
    };
    return this.store.dispatch(new UpdateGridState(params));
  }

  deleteCurrentView(gridName) {
    this.store.dispatch(new DeleteGridState(gridName));
  }

  saveView(params) {
    return this.http.post('gridviews', params);
  }

  updateView(params) {
    return this.http.put(`gridviews/${params.id}`, params);
  }

  updateDefaultView(viewId, params) {
    return this.http.patch(`gridviews/${viewId}`, params);
  }

  updateGridStates(params) {
    return this.http.put(`V2/GridStates`, params);
  }

  onPaginationChanged() {
    this.gridPaginationChanges.next();
  }

  onGridPageSizeChanged(value) {
    this.gridPageSizeChanged.next(value);
  }

  onClearFilterTrigger() {
    this.clearFilterTrigger.next();
  }

  deleteSavedView(params) {
    return this.http.put(`V2/GridStates`, params);
  }

  saveDownloadAudit(params) {
    return this.http.post(`service/dvapi_service/download_audit`, params);
  }

  getGridDownloadName(gridName: any) {
    return {
      contacts: 'contacts',
      manage_firm: 'firms',
      manage_product: 'products',
      manage_strategy: 'strategies',
      manage_vehicle: 'vehicles',
      excel_sync: 'excel sync',
      'access-levels': 'access levels',
      disclaimers: 'disclaimers',
      admin_downloads: 'admin downloads',
      admin_downloads_active: 'admin downloads active',
      admin_downloads_expired: 'admin downloads expired',
      dynamicsFirmDataGrid: 'dynamics firms data',
      dynamicsContactDataGrid: 'dynamics contacts data',
      'email-templates': 'email templates',
      functions: 'functions',
      'permission-teams': 'permission teams',
      'permission-teammembers': 'permission team members',
      'permission-resource': 'permission resources',
      permissions: 'permissions',
      reviewDefinitions: 'review definitions',
      salesforceFirmDataGrid: 'salesforce firm data',
      salesforceContactDataGrid: 'salesforce contact data',
      teams: 'teams',
      workflows: 'workflows',
      request_approval: 'request approval',
      request_review: 'request review',
      'investor-scheduled': 'scheduled review',
      requests_grid: 'pending requests',
      'my-accounts': 'my accounts',
      'my-admins': 'my admins',
      'my-permissions': 'my permissions',
      'project-assignments': 'projects assignments',
      project_share: 'project share',
      'my projects-projects-grid': 'my projects-projects-grid',
      'in-progress-projects-grid': 'in-progress-projects-grid',
      'closed-projects-grid': 'closed-projects-grid',
      'sent-projects-grid': 'sent-projects-grid',
      'all-projects-grid': 'all-projects-grid',
      recommendations: 'recommendations',
      report_list: 'reports list',
      templates: 'templates',
      'duediligence-document-list': 'duediligence documents',
      firm_documents_myattachments: 'firm documents',
      vehicle_documents_myattachments: 'vehicle documents',
      fund_documents_myattachments: 'fund documents',
      strategy_documents_myattachments: 'strategy documents',
      firm_documents_folderview_myattachments: 'firm documents',
      vehicle_documents_folderview_myattachments: 'vehicle documents',
      fund_documents_folderview_myattachments: 'fund documents',
      strategy_documents_folderview_myattachments: 'strategy documents',
      firm_documents_received: 'firm documents',
      vehicle_documents_received: 'vehicle documents',
      fund_documents_received: 'fund documents',
      strategy_documents_received: 'strategy documents',
      firm_documents_folderview_received: 'firm documents',
      vehicle_documents_folderview_received: 'vehicle documents',
      fund_documents_folderview_received: 'fund documents',
      strategy_documents_folderview_received: 'strategy documents',
      'firm-document-list': 'firm documents',
      'vehicle-document-list': 'vehicle documents',
      'fund-document-list': 'fund documents',
      'strategy-document-list': 'strategy documents',
      firm_documents_folderview_all: 'firm documents',
      vehicle_documents_folderview_all: 'vehicle documents',
      fund_documents_folderview_all: 'fund documents',
      strategy_documents_folderview_all: 'strategy documents',
      my_downloads: 'my downloads',
      my_downloads_expired: 'my downloads expired',
      benchmarking_report: 'benchmarking report',
      'investor-my-actions': 'dashboard my-actions',
      'investor-recent-flags-scores': 'dashboard recent flags scores',
      'investor-dash-workflow-process': 'dashboard workflow process',
      'firm-adv-search': 'firm adv search',
      'fund-adv-search': 'fund adv search',
      mfw: 'mfw',
      'formadv-private-funds': 'formadv private funds',
      'formadv-related-entities': 'formadv related entities',
      'formadv-firm-service-providers': 'formadv firm service providers',
      'formadv-firm-regulators': 'formadv firm regulators',
      'formadv-private-fund-service-provider':
        'formadv private fund service provider',
      'formadv-regulatory-monitor-explore':
        'formadv regulatory monitor explore',
      'formadv-regulatory-monitor-portfolio':
        'formadvregulatory monitor portfolio',
      inbound: 'inbound',
      'investor-pitch': 'investor-pitch',
      releasesList: 'releases list',
      mappings: 'Mapping',
      bannersList: 'banners list',
      documents_myattachments: 'uploaded documents',
      documents_received: 'received documents',
      documents: 'all documents',
      documents_folderview_myattachments: 'uploaded documents',
      documents_folderview_received: 'received documents',
      documents_folderview_all: 'all documents',
      bipsyncFirmDataGrid: 'Bipsync Firms Data',
      bipsyncContactDataGrid: 'Bipsync Contacts Data',
      bipsyncProductDataGrid: 'Bipsync Products Data',
      'my-work-projects': 'My Projects',
      'my-work-tasks': 'My Tasks',
      'my-work-recommendations': 'My Recommendations',
      'my-work-workflows': 'My Workflows',
    }[gridName];
  }

  deleteView(view) {
    return this.http.delete(`gridviews/${view}`);
  }
}
