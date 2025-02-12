import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BulkActionsComponent } from './bulk-actions/bulk-actions.component';
import { ContactTagsComponent } from './contact-tags/contact-tags.component';
import { DesignPreferencesComponent } from './design-preferences/design-preferences.component';
import { DocumentClassificationComponent } from './document-classification/document-classification.component';
import { DocumentGroupsComponent } from './document-groups/document-groups.component';
import { DomainComponent } from './domain/domain.component';
import { EmailTemplatesComponent } from './email-templates/email-templates.component';
import { ExportPreferencesComponent } from './export-preferences/export-preferences.component';
import { FirmActivityComponent } from './firm-activity/firm-activity.component';
import { FirmPreferencesComponent } from './firm-preferences/firm-preferences.component';
import { FirmProfileComponent } from './firm-profile/firm-profile.component';
import { FirmTagsComponent } from './firm-tags/firm-tags.component';
import { GenericTagsComponent } from './generic-tags/generic-tags.component';
import { IpConfigurationsComponent } from './ip-configurations/ip-configurations.component';
import { OpenApiComponent } from './open-api/open-api.component';
import { PermissionDetailComponent } from './permission-detail/permission-detail.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { ProductTagsComponent } from './product-tags/product-tags.component';
import { ProjectTagsComponent } from './project-tags/project-tags.component';
import { RatingDefinitionComponent } from './rating-definition/rating-definition.component';
import { RatingScalesComponent } from './rating-scales/rating-scales.component';
import { SsoProfileComponent } from './sso-profile/sso-profile.component';
import { StrategyTagsComponent } from './strategy-tags/strategy-tags.component';
import { TeamsComponent } from './teams/teams.component';
import { UsersComponent } from './users/users.component';
import { VehicleTagsComponent } from './vehicle-tags/vehicle-tags.component';
import { WorkflowBuilderComponent } from './workflow-builder/workflow-builder.component';
import { WorkflowDetailsComponent } from './workflow-details/workflow-details.component';
import { WorkflowListComponent } from './workflow-list/workflow-list.component';
import { WorkflowPreviewComponent } from './workflow-preview/workflow-preview.component';
import { SharedModule } from 'src/app2/shared/shared.module';
import { ReportExportsComponent } from './report-exports/report-exports.component';
import { DocumentTypesComponent } from './document-types/document-types.component';
import { PreApprovedContentComponent } from './pre-approved-content/pre-approved-content.component';
import { DisclaimersComponent } from './disclaimers/disclaimers.component';
import { FunctionsComponent } from './functions/functions.component';
import { PasswordPreferencesComponent } from './password-preferences/password-preferences.component';
import { DynamicsCrmComponent } from './dynamics-crm/dynamics-crm.component';
import { SalesforceCrmComponent } from './salesforce-crm/salesforce-crm.component';
import { BulkUploadMappingInformationComponent } from './bulk-actions-mapping-information/bulk-upload-mapping-information.component';

import { AccessLevelsComponent } from './access-levels/access-levels.component';

import { ReviewDefinitionsList } from './review-definitions-list/review-definitions-list.component';
import { ReviewDefinitionsDetails } from './review-definitions-details/review-definitions-details.component';
import { ReleasesListComponent } from './releases-list/releases-list.component';
import { ReleaseDetailsComponent } from './release-details/release-details.component';
import { DownloadAudit } from './download_audits/download_audits.component';
import { RouterModule } from '@angular/router';
import { FIRM_SETTINGS_ROUTES } from './firm-settings.routes';
import { FirmSettingsComponent } from './page/firm-settings.component';
import { PremiumComponent } from 'src/app2/shared/components/premium/premium.component';
import { InboundManagementPrivateModule } from '../inbound-management/inbound-management.module';
import { BannersListComponent } from './banners-list/banners-list.component';
import { BannerDetailsComponent } from './banner-details/banner-details.component';
@NgModule({
  declarations: [
    FirmSettingsComponent,
    FirmProfileComponent,
    FirmActivityComponent,
    UsersComponent,
    DomainComponent,
    IpConfigurationsComponent,
    SsoProfileComponent,
    FirmPreferencesComponent,
    DesignPreferencesComponent,
    ExportPreferencesComponent,
    DocumentTypesComponent,
    DocumentGroupsComponent,
    DocumentClassificationComponent,
    TeamsComponent,
    BulkActionsComponent,
    GenericTagsComponent,
    FirmTagsComponent,
    StrategyTagsComponent,
    ProductTagsComponent,
    VehicleTagsComponent,
    ContactTagsComponent,
    ProjectTagsComponent,
    RatingDefinitionComponent,
    RatingScalesComponent,
    OpenApiComponent,
    PermissionsComponent,
    WorkflowListComponent,
    EmailTemplatesComponent,
    PermissionDetailComponent,
    WorkflowDetailsComponent,
    WorkflowBuilderComponent,
    WorkflowPreviewComponent,
    ReportExportsComponent,
    PreApprovedContentComponent,
    DisclaimersComponent,
    FunctionsComponent,
    PasswordPreferencesComponent,
    DynamicsCrmComponent,
    SalesforceCrmComponent,
    BulkUploadMappingInformationComponent,
    AccessLevelsComponent,
    ReviewDefinitionsList,
    ReviewDefinitionsDetails,
    ReleasesListComponent,
    ReleaseDetailsComponent,
    DownloadAudit,
    PremiumComponent,
    BannerDetailsComponent,
    BannersListComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    InboundManagementPrivateModule,
    RouterModule.forChild(FIRM_SETTINGS_ROUTES),
  ],
})
export class FirmSettingsModule {}
