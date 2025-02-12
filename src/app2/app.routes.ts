import { NgModule } from '@angular/core';
import {
  Routes,
  RouterModule,
  ExtraOptions,
  UrlSegment,
} from '@angular/router';
import { appRoutesNames, baseAuthenticatedRoute } from './app.routes.name';
import { DvHomeComponent } from './pages/dv-home/dv-home.component';
import { AuthCanActivateGuard } from './guards';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { TemplateGridComponent } from './modules/template-builder/page';
import { HomeReRoutePageComponent } from './pages/home-reroute/home.reroute.component';
import { ForgetPasswordComponent } from './modules/authentication/components/forget-password/forget-password.component';
import { ResetPasswordComponent } from './modules/authentication/components/reset-password/reset-password.component';
import { LoginComponent } from './modules/authentication/components/login/login.component';
import { ActivateComponent } from './modules/authentication/components/activate/activate.component';
import { TermsAndConditionsComponent } from './shared/components/terms-and-conditions/terms-and-conditions.component';
import { MyDownloadsComponent } from './shared/components/my-downloads/my-downloads.component';
import { WordToTemplateComponent } from './modules/new-parser/word-to-template/word-to-template.component';
import { ExcelToTemplateComponent } from './modules/new-parser/excel-to-template/excel-to-template.component';
import { EucRouteComponent } from './pages/euc-route/euc-route.component';
import { FormulaComponent } from './pages/help/formula/formula.component';
import { DiligenceInviteInvestor } from './modules/invite/investor/investor.component';
import { DiligenceNewddqComponent } from './modules/invite/new-ddq/new-ddq.component';
import { PlatformActivityPanelComponent } from './shared/components/platform-activity-panel/platform-activity-panel.component';
import { DocumentDetailComponent } from './shared/components/document-detail/document-detail.component';
import { FundReRoutePageComponent } from './pages/fund-reroute/fund-reroute.component';
import { StrategyReRoutePageComponent } from './pages/strategy-reroute/strategy-reroute.component';
import { VehicleReRoutePageComponent } from './pages/vehicle-reroute/vehicle-reroute.component';
import { ClearTokenGaurd } from './guards/clear-token.gaurd';
import { CanAccessGaurd } from './guards/canAccess.gaurd';
import {
  AiTermsOfUseComponent,
  PremiumResponderPageComponent,
} from './shared/components';
import { InboundSignupComponent } from './modules/authentication/components/inbound-signup/inbound-signup.component';
import { PublicRoutesRedirectsGuard } from './guards/public-routes-redirect';
import { ProjectsLayoutComponent } from './modules/projects-grid/projects-layout/projects-layout.component';
import { DocumentsGridComponent } from './modules/documents/documents-grid/documents-grid.component';

const routes: Routes = [
  { path: '', redirectTo: appRoutesNames.LOGIN, pathMatch: 'full' },
  {
    path: appRoutesNames.LOGIN,
    canActivate: [PublicRoutesRedirectsGuard],
    component: LoginComponent,
  },
  {
    path: appRoutesNames.CONFIRM_PASSWORD_RESET,
    canActivate: [ClearTokenGaurd],
    component: ResetPasswordComponent,
  },
  {
    path: appRoutesNames.FORGOT_PASSWORD,
    component: ForgetPasswordComponent,
  },
  {
    path: appRoutesNames.ACTIVATE,
    canActivate: [ClearTokenGaurd],
    component: ActivateComponent,
  },
  {
    path: appRoutesNames.SIGNUP,
    canActivate: [PublicRoutesRedirectsGuard],
    component: InboundSignupComponent,
  },
  { path: 'app', redirectTo: '/app/home', pathMatch: 'full' },
  {
    path: 'app',
    canActivate: [AuthCanActivateGuard],
    component: DvHomeComponent,
    children: [
      {
        path: appRoutesNames.PARTNERSHIP,
        loadChildren: () =>
          import('./modules/partership-portal/partnership.module').then(
            (m) => m.PartnerShipModule
          ),
      },
      {
        path: appRoutesNames.RELEASES,
        loadChildren: () => import('releases').then((m) => m.ReleasesModule),
      },
      {
        canActivate: [CanAccessGaurd],
        data: {
          accessible_to: [
            'ProductiveSubscription',
            'FormADVAnalyticsSubscription',
            'PowerBISubscription',
          ],
          hidden_from: ['securityAdmin'],
        },
        path: appRoutesNames.ANALYZE,
        loadChildren: () => import('analyze').then((m) => m.AnalyzeModule),
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['securityAdmin', 'manager'] },
        path: appRoutesNames.REPORTS,
        loadChildren: () => import('reports').then((m) => m.ReportModule),
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['securityAdmin', 'investor'] },
        path: appRoutesNames.INBOUND,
        loadChildren: () =>
          import('./modules/inbound-management/inbound-management.module').then(
            (m) => m.InboundManagementModule
          ),
      },
      {
        path: appRoutesNames.CONTENT,
        children: [
          {
            path: appRoutesNames.QUESTIONS,
            canActivate: [CanAccessGaurd],
            data: { hidden_from: ['securityAdmin', 'investor'] },
            loadChildren: () => import('qa-bank').then((m) => m.QaBankModule),
          },
          {
            path: appRoutesNames.DOCUMENT,
            component: DocumentsGridComponent,
          },
          {
            path: appRoutesNames.DOCUMENT_DETAIL,
            component: DocumentDetailComponent,
          },
          {
            path: appRoutesNames.MANAGE_AUM_TR,
            loadComponent: () =>
              import(
                './modules/standalone/manage-aum-tr/manage-aum-tr.component'
              ).then((m) => m.ManageAumTrComponent),
          },
        ],
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['securityAdmin'] },
        path: appRoutesNames.WORKFLOW_AUTOMATION,
        loadChildren: () =>
          import(
            './modules/workflow-automation/workflow-automation.module'
          ).then((m) => m.WorkflowAutomationModule),
      },
      {
        path: appRoutesNames.MONITOR,
        loadChildren: () => import('entity').then((m) => m.EntityModule),
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['securityAdmin'] },
        path: appRoutesNames.FIRMS,
        loadChildren: () => import('entity').then((m) => m.EntityModule),
      },
      {
        matcher: (url: UrlSegment[]) => {
          if (url.length && url[0].path == appRoutesNames.FUNDS)
            return {
              consumed: url,
              posParams: {
                fundId: new UrlSegment(url[1].path, {}),
              },
            };
          else return null;
        },
        component: FundReRoutePageComponent,
      },
      {
        matcher: (url: UrlSegment[]) => {
          if (url.length && url[0].path == appRoutesNames.STRATEGY)
            return {
              consumed: url,
              posParams: {
                strategyId: new UrlSegment(url[1].path, {}),
              },
            };
          else return null;
        },
        component: StrategyReRoutePageComponent,
      },
      {
        matcher: (url: UrlSegment[]) => {
          if (url.length && url[0].path == appRoutesNames.VEHICLE)
            return {
              consumed: url,
              posParams: {
                vehicleId: new UrlSegment(url[1].path, {}),
              },
            };
          else return null;
        },
        component: VehicleReRoutePageComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['securityAdmin'] },
        path: appRoutesNames.CONTACTS,
        loadComponent: () => import('entity').then((m) => m.ContactsComponent),
      },
      {
        path: appRoutesNames.HOME,
        component: HomeReRoutePageComponent,
      },
      {
        path: appRoutesNames.DILIGENCE,
        children: [
          {
            path: appRoutesNames.INVITE,
            component: DiligenceInviteInvestor,
          },
          {
            canActivate: [CanAccessGaurd],
            data: {
              hidden_from: ['FreeInvestor', 'FreeManager'],
              can_upgrade: true,
            },
            path: appRoutesNames.INVITE_MANAGER,
            component: DiligenceNewddqComponent,
          },
          {
            path: appRoutesNames.ACTIVITY_INPROGRESS,
            component: ProjectsLayoutComponent,
          },

          {
            canActivate: [CanAccessGaurd],
            data: {
              hidden_from: ['securityAdmin', 'FreeInvestor', 'FreeManager'],
              can_upgrade: true,
            },
            path: appRoutesNames.TEMPLATE,
            loadChildren: () =>
              import('./modules/template-builder/template-builder.module').then(
                (m) => m.TemplateBuilderModule
              ),
          },
          {
            canActivate: [CanAccessGaurd],
            data: {
              hidden_from: ['securityAdmin', 'FreeInvestor', 'FreeManager'],
              can_upgrade: true,
            },
            path: appRoutesNames.TEMPLATES,
            component: TemplateGridComponent,
          },

          {
            path: appRoutesNames.DILIGENCE_PROJECT_GEN,
            loadChildren: () => import('project').then((m) => m.ProjectModule),
          },
          {
            path: appRoutesNames.EXCEL_SYNC,
            loadChildren: () =>
              import('./modules/excel-sync/excel-sync.module').then(
                (m) => m.ExcelSyncModule
              ),
          },
          {
            path: appRoutesNames.EXCELTOTEMPLATE,
            component: ExcelToTemplateComponent,
            canActivate: [CanAccessGaurd],
            data: { hidden_from: ['investor'] },
            loadChildren: () =>
              import('./modules/new-parser/new-parser.module').then(
                (m) => m.NewParserModule
              ),
          },
          {
            path: appRoutesNames.WORDTOTEMPLATE,
            canActivate: [CanAccessGaurd],
            data: { hidden_from: ['investor', 'FreeSubscription'] },
            component: WordToTemplateComponent,
            loadChildren: () =>
              import('./modules/new-parser/new-parser.module').then(
                (m) => m.NewParserModule
              ),
          },
          {
            canActivate: [CanAccessGaurd],
            data: { hidden_from: ['securityAdmin'] },
            path: appRoutesNames.DILIGENCE_PROJECT,
            loadChildren: () => import('project').then((m) => m.ProjectModule),
          },
          {
            path: appRoutesNames.PLATFORM_ACTIVITY,
            component: PlatformActivityPanelComponent,
          },
          {
            path: appRoutesNames.TOEXTERNAL,
            loadComponent: () =>
              import('entity').then((m) => m.SendToManagerComponent),
          },
        ],
      },
      {
        path: appRoutesNames.EUC,
        component: EucRouteComponent,
      },
      {
        path: appRoutesNames.TERMS_AND_CONDITIONS,
        component: TermsAndConditionsComponent,
      },
      {
        path: appRoutesNames.AI_TERMS_AND_CONDITIONS,
        component: AiTermsOfUseComponent,
      },
      {
        path: appRoutesNames.WELCOME,
        loadChildren: () =>
          import('./modules/welcome/welcome.module').then(
            (m) => m.WelcomeModule
          ),
      },
      {
        path: appRoutesNames.WELCOME_TO_DV,
        loadChildren: () =>
          import('./modules/welcome_to_dv/welcome-to-dv.module').then(
            (m) => m.WelocmeToDvModule
          ),
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['securityAdmin'] },
        path: appRoutesNames.HELP,
        children: [
          {
            path: appRoutesNames.FORMULA,
            component: FormulaComponent,
          },
        ],
      },
      {
        path: appRoutesNames.ADVANCED_REPORTING,
        loadChildren: () =>
          import('./modules/advanced-reporting/advanced-reporting.module').then(
            (m) => m.AdvancedReportingModule
          ),
      },
      {
        path: appRoutesNames.MY_DOWNLOADS,
        component: MyDownloadsComponent,
      },
      {
        path: appRoutesNames.DASH,
        loadChildren: () => import('dv-dashboard').then((m) => m.DashboardModule),
      },
      {
        path: appRoutesNames.FORMADV,
        loadChildren: () =>
          import('form_adv').then((m) => m.AdvPortfolioModule),
      },
      {
        path: appRoutesNames.DATA_HUB,
        children: [
          {
            path: appRoutesNames.RESOURCES,
            loadChildren: () => import('data-hub').then((m) => m.DataHubModule),
          },
        ],
      },
      {
        path: appRoutesNames.PROFILE,
        loadChildren: () =>
          import('my-settings').then((m) => m.MySettingsModule),
      },
      {
        path: appRoutesNames.FIRM_SETTING,
        loadChildren: () =>
          import('firm-settings').then((m) => m.FirmSettingsModule),
      },
      {
        canActivate: [CanAccessGaurd],
        data: { accessible_to: ['FreeManager'] },
        path: appRoutesNames.PREMIUM,
        component: PremiumResponderPageComponent,
      },
    ],
  },

  // Redirect logic to handle older routes
  {
    redirectTo: `${baseAuthenticatedRoute}/${appRoutesNames.CONTENT}/${appRoutesNames.DOCUMENT_DETAIL}`,
    path: `${baseAuthenticatedRoute}/${appRoutesNames.DILIGENCE}/${appRoutesNames.DOCUMENT_DETAIL}`,
    pathMatch: 'full',
  },
  {
    redirectTo: `${baseAuthenticatedRoute}/${appRoutesNames.CONTENT}/${appRoutesNames.DOCUMENT}`,
    path: `${baseAuthenticatedRoute}/${appRoutesNames.DILIGENCE}/${appRoutesNames.DOCUMENT}`,
    pathMatch: 'full',
  },
  {
    path: '**',
    component: PageNotFoundComponent,
  },
  // {
  //   path: '**',
  //   canActivate: [AuthCanActivateGuard],
  //   component: PageNotFoundComponent,
  // },
];

const routerOptions: ExtraOptions = {
  anchorScrolling: 'enabled',
  useHash: true,
  onSameUrlNavigation: 'reload',
} as const;

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
