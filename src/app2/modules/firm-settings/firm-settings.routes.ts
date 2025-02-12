import { DomainComponent } from './domain/domain.component';
import { FirmProfileComponent } from './firm-profile/firm-profile.component';
// import { firmSettingsRoutesNames } from './firm-settings.routes.names';
// import { FirmSettingsComponent } from './page/firm-settings.component';
import { UsersComponent } from './users/users.component';
// import { AuthCanActivateGuard } from 'src/app2/guards/auth.can-activate.gaurd';
import { FirmActivityComponent } from './firm-activity/firm-activity.component';
import { TeamsComponent } from './teams/teams.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { FunctionsComponent } from './functions/functions.component';
import { IpConfigurationsComponent } from './ip-configurations/ip-configurations.component';
import { SsoProfileComponent } from './sso-profile/sso-profile.component';
// import { PasswordPreferencesComponent } from './password-preferences/password-preferences.component';
import { FirmPreferencesComponent } from './firm-preferences/firm-preferences.component';
import { DesignPreferencesComponent } from './design-preferences/design-preferences.component';
import { ExportPreferencesComponent } from './export-preferences/export-preferences.component';
import { WorkflowListComponent } from './workflow-list/workflow-list.component';
import { EmailTemplatesComponent } from './email-templates/email-templates.component';
import { DynamicsCrmComponent } from './dynamics-crm/dynamics-crm.component';
import { SalesforceCrmComponent } from './salesforce-crm/salesforce-crm.component';
import { BulkActionsComponent } from './bulk-actions/bulk-actions.component';
import { DocumentTypesComponent } from './document-types/document-types.component';
import { DocumentGroupsComponent } from './document-groups/document-groups.component';
import { DocumentClassificationComponent } from './document-classification/document-classification.component';
import { GenericTagsComponent } from './generic-tags/generic-tags.component';
import { FirmTagsComponent } from './firm-tags/firm-tags.component';
import { StrategyTagsComponent } from './strategy-tags/strategy-tags.component';
import { ProductTagsComponent } from './product-tags/product-tags.component';
import { VehicleTagsComponent } from './vehicle-tags/vehicle-tags.component';
import { ContactTagsComponent } from './contact-tags/contact-tags.component';
import { ProjectTagsComponent } from './project-tags/project-tags.component';
import { RatingDefinitionComponent } from './rating-definition/rating-definition.component';
import { RatingScalesComponent } from './rating-scales/rating-scales.component';
import { ReportExportsComponent } from './report-exports/report-exports.component';
import { OpenApiComponent } from './open-api/open-api.component';
import { PermissionDetailComponent } from './permission-detail/permission-detail.component';
import { WorkflowDetailsComponent } from './workflow-details/workflow-details.component';
import { firmSettingsRoutesNames } from './firm-settings.routes.names';
import { FirmSettingsComponent } from './page/firm-settings.component';
import { ReviewDefinitionsList } from './review-definitions-list/review-definitions-list.component';
import { ReviewDefinitionsDetails } from './review-definitions-details/review-definitions-details.component';
import { PasswordPreferencesComponent } from './password-preferences/password-preferences.component';
import { Routes } from '@angular/router';
import { ManageInboundComponent } from '../inbound-management/manage-inbound/manage-inbound.component';
import { InboundAddEditComponent } from 'src/app2/shared/modals/inbound-add-edit/inbound-add-edit.component';
import { ViewInboundComponent } from '../inbound-management/view-inbound/view-inbound.component';
import { ReleasesListComponent } from './releases-list/releases-list.component';
import { ReleaseDetailsComponent } from './release-details/release-details.component';
import { DisclaimersComponent } from './disclaimers/disclaimers.component';
import { DownloadAudit } from './download_audits/download_audits.component';
import { PreApprovedContentComponent } from './pre-approved-content/pre-approved-content.component';
import { BulkUploadMappingInformationComponent } from './bulk-actions-mapping-information/bulk-upload-mapping-information.component';
import { WorkflowBuilderComponent } from './workflow-builder/workflow-builder.component';
import { WorkflowPreviewComponent } from './workflow-preview/workflow-preview.component';
import { CanAccessGaurd } from 'src/app2/guards/canAccess.gaurd';
import { AccessLevelsComponent } from './access-levels/access-levels.component';
import { BannersListComponent } from './banners-list/banners-list.component';
import { BannerDetailsComponent } from './banner-details/banner-details.component';

export const FIRM_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: FirmSettingsComponent,
    children: [
      {
        path: '',
        redirectTo: firmSettingsRoutesNames.PROFILE,
        pathMatch: 'full',
      },
      {
        path: firmSettingsRoutesNames.PROFILE,
        component: FirmProfileComponent,
      },
      {
        path: firmSettingsRoutesNames.ACTIVITY,
        component: FirmActivityComponent,
      },

      // User and teams
      {
        path: firmSettingsRoutesNames.EMPLYOEES,
        component: UsersComponent,
      },
      {
        path: firmSettingsRoutesNames.TEAMS,
        component: TeamsComponent,
      },
      {
        path: firmSettingsRoutesNames.PERMISSIONS,
        component: PermissionsComponent,
      },
      {
        path: firmSettingsRoutesNames.FUNCTIONS,
        component: FunctionsComponent,
      },
      {
        path: firmSettingsRoutesNames.ACCESS_LEVELS,
        component: AccessLevelsComponent,
      },
      {
        path: firmSettingsRoutesNames.DOWNLOAD_AUDITS,
        component: DownloadAudit,
      },
      {
        path: firmSettingsRoutesNames.PERMISSIONS_DETAIL,
        component: PermissionDetailComponent,
      },

      // Security
      {
        path: firmSettingsRoutesNames.DOMAIN,
        component: DomainComponent,
      },
      {
        path: firmSettingsRoutesNames.IP_CONFIG,
        component: IpConfigurationsComponent,
      },
      {
        path: firmSettingsRoutesNames.SSO_CONFIG,
        component: SsoProfileComponent,
      },
      {
        path: firmSettingsRoutesNames.PASSWORD,
        component: PasswordPreferencesComponent,
      },

      // Preference Settings
      {
        path: firmSettingsRoutesNames.PREFERENCES,
        component: FirmPreferencesComponent,
      },
      {
        path: firmSettingsRoutesNames.DESIGN_PREFERENCES,
        component: DesignPreferencesComponent,
      },
      {
        path: firmSettingsRoutesNames.EXPORT_PREFERENCES,
        component: ExportPreferencesComponent,
      },

      // Workflow List
      {
        path: firmSettingsRoutesNames.WORKFLOWS_LIST,
        component: WorkflowListComponent,
      },
      {
        path: firmSettingsRoutesNames.WORKFLOW,
        component: WorkflowDetailsComponent,
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['securityAdmin'] },
        children: [
          {
            path: firmSettingsRoutesNames.WORKFLOW_EDIT,
            component: WorkflowBuilderComponent,
          },
          {
            path: firmSettingsRoutesNames.WORKFLOW_PREVIEW,
            component: WorkflowPreviewComponent,
            data: {
              entityType: null,
            },
          },
        ],
      },
      {
        path: firmSettingsRoutesNames.EMAIL_TEMPLATES,
        component: EmailTemplatesComponent,
      },
      {
        path: firmSettingsRoutesNames.REVIEW_DEFINITIONS,
        component: ReviewDefinitionsList,
      },
      {
        path: firmSettingsRoutesNames.REVIEW_DEFINITION_DETAILS,
        component: ReviewDefinitionsDetails,
      },

      //CRM
      {
        path: firmSettingsRoutesNames.DYNAMICS_CRM,
        component: DynamicsCrmComponent,
      },
      {
        path: firmSettingsRoutesNames.SALESFORCE_CRM,
        component: SalesforceCrmComponent,
      },
      {
        path: firmSettingsRoutesNames.WORKFLOW,
        component: WorkflowDetailsComponent,
      },

      {
        path: firmSettingsRoutesNames.BULK_UPLOAD,
        component: BulkActionsComponent,
      },
      {
        path: firmSettingsRoutesNames.BULK_UPLOAD_PREAPPROVED,
        component: PreApprovedContentComponent,
      },
      {
        path: firmSettingsRoutesNames.BULK_UPLOAD_MAPPING_INFO,
        component: BulkUploadMappingInformationComponent,
      },

      //Documents

      {
        path: firmSettingsRoutesNames.DOCUMENT_TAGS,
        component: DocumentTypesComponent,
      },
      {
        path: firmSettingsRoutesNames.DOCUMENT_GROUP_TAGS,
        component: DocumentGroupsComponent,
      },
      {
        path: firmSettingsRoutesNames.DOCUMENT_CLASSIFICATIONS,
        component: DocumentClassificationComponent,
      },

      //Tags
      {
        path: firmSettingsRoutesNames.ALL_TAGS,
        component: GenericTagsComponent,
      },
      {
        path: firmSettingsRoutesNames.FIRM_TAGS,
        component: FirmTagsComponent,
      },
      {
        path: firmSettingsRoutesNames.STRATEGY_TAGS,
        component: StrategyTagsComponent,
      },
      {
        path: firmSettingsRoutesNames.PRODUCT_TAGS,
        component: ProductTagsComponent,
      },
      {
        path: firmSettingsRoutesNames.VEHICLE_TAGS,
        component: VehicleTagsComponent,
      },
      {
        path: firmSettingsRoutesNames.CONTACT_TAGS,
        component: ContactTagsComponent,
      },
      {
        path: firmSettingsRoutesNames.PROJECT_TAGS,
        component: ProjectTagsComponent,
      },

      //Rating
      {
        path: firmSettingsRoutesNames.INVESTMENT_RATING_TYPES,
        component: RatingDefinitionComponent,
      },
      {
        path: firmSettingsRoutesNames.INVESTMENT_RATING_SCALES,
        component: RatingScalesComponent,
      },

      //Integration
      {
        path: firmSettingsRoutesNames.INTEGRATIONS_EXPORT_IMPORT,
        component: ReportExportsComponent,
      },
      {
        path: firmSettingsRoutesNames.INTEGRATIONS_API,
        component: OpenApiComponent,
      },
      {
        path: firmSettingsRoutesNames.MANAGE_OPPORTUNITY,
        component: ManageInboundComponent,
      },
      {
        path: firmSettingsRoutesNames.VIEW_OPPORTUNITY,
        component: ViewInboundComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['securityAdmin', 'manager', 'FreeSubscription'] },
        path: firmSettingsRoutesNames.CONFIGURE_OPPORTUNITY,
        component: InboundAddEditComponent,
      },
      {
        path: firmSettingsRoutesNames.RELEASE_LIST,
        component: ReleasesListComponent,
      },
      {
        path: firmSettingsRoutesNames.ADD_RELEASE,
        component: ReleaseDetailsComponent,
      },
      {
        path: firmSettingsRoutesNames.EDIT_RELEASE,
        component: ReleaseDetailsComponent,
      },
      {
        path: firmSettingsRoutesNames.BANNER_LIST,
        component: BannersListComponent,
      },
      {
        path: firmSettingsRoutesNames.ADD_BANNER,
        component: BannerDetailsComponent,
      },
      {
        path: firmSettingsRoutesNames.EDIT_BANNER,
        component: BannerDetailsComponent,
      },
      {
        path: firmSettingsRoutesNames.DISCLAIMERS,
        component: DisclaimersComponent,
      },
    ],
  },
];
