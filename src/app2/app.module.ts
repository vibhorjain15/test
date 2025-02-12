import { ErrorHandler, forwardRef, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
// import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { AppComponent } from './app.component';
import { ToastrModule } from 'ngx-toastr';
import { InterpolatePipe } from './shared/pipes/interpolate.pipe';
import { CommonModule, DatePipe } from '@angular/common';
import { InterceptorService } from './services/interceptor.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgSelectModule } from '@ng-select/ng-select';
import { UiSwitchModule } from 'ngx-ui-switch';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { NgxsModule } from '@ngxs/store';
import { UserState } from './store/user/user.state';
import 'ag-grid-enterprise';
import { LicenseManager } from 'ag-grid-enterprise';
import { environment } from 'src/environments/environment';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ColorPickerModule } from 'ngx-color-picker';
import { TagInputModule } from 'ngx-chips';
import { RatingModule } from 'ngx-bootstrap/rating';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { HotTableModule } from '@handsontable/angular';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ProjectsGridModule } from './modules/projects-grid/projects-grid.module';
import { EncodeHttpParamsInterceptor } from './services/encodeHttpParamsInterceptor.service';
import { AutosizeModule } from 'ngx-autosize';
import { AuthService } from './services/auth.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ModalModule } from 'ngx-bootstrap/modal';
import { DataService } from './services/data.service';

// AoT requires an exported function for factories
// export function HttpLoaderFactory(httpClient: HttpClient) {
//   return new TranslateHttpLoader(httpClient);
// }
import { CdkStepperModule } from '@angular/cdk/stepper';

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}
import { ProprietoryLicenses } from './shared/constants/constant';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
import { QAState } from './modules/qa-bank/store/qa.state';
// import { ReportsModule } from './modules/reports/reports.module';
import { SharedModule } from './shared/shared.module';
import { GridState } from './store/grid/grid.state';
import { TemplateState } from './modules/template-builder/store/template-builder.state';
import { QuestionState } from './modules/questionnaire/store/questionnaire.state';
import { PowerBIEmbedModule } from 'powerbi-client-angular';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { NewParserModule } from './modules/new-parser/new-parser.module';

import { BsModalRef } from 'ngx-bootstrap/modal';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { RecommendationState } from './modules/recommendation/store/recommendation.state';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { NgxsLoggerPluginModule } from '@ngxs/logger-plugin';
import { ErrorHandlerService } from './services/error-handler.service';
import { NgxsWebsocketPluginModule } from '@ngxs/websocket-plugin';
import { WebsocketMessageState } from './store/download/download.state';
import { ReportState } from './modules/reports/store/reports.state';
import { CustomModalService } from './services/modal/customModal.service';
import { AppRoutingModule } from './app.routes';
import { DvHomeComponent } from './pages/dv-home/dv-home.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { ProjectReRoutePageComponent } from './pages/project-reroute.ts/project-reroute.component';
import { HomeReRoutePageComponent } from './pages/home-reroute/home.reroute.component';
import { DocumentsModule } from './modules/documents/documents.module';
import { InviteModule } from 'invite';
import { DiligenceDataSaveService } from './services/diligence-data-save.service';
import { FundReRoutePageComponent } from './pages/fund-reroute/fund-reroute.component';
import { StrategyReRoutePageComponent } from './pages/strategy-reroute/strategy-reroute.component';
import { VehicleReRoutePageComponent } from './pages/vehicle-reroute/vehicle-reroute.component';
import { TemplateGridComponent } from './modules/template-builder/page';
import { AddReportTemplateComponent } from './modules/reports/modal/add-report-template/add-report-template.component';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, '/i18n/', '.json');
}
LicenseManager.setLicenseKey(ProprietoryLicenses.AGGRID);
@NgModule({
  declarations: [
    AppComponent,
    DvHomeComponent,
    PageNotFoundComponent,
    ProjectReRoutePageComponent,
    HomeReRoutePageComponent,
    FundReRoutePageComponent,
    StrategyReRoutePageComponent,
    VehicleReRoutePageComponent,
    TemplateGridComponent,
    AddReportTemplateComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    CdkStepperModule,
    HttpClientModule,
    ToastrModule.forRoot(),
    ModalModule.forRoot(),
    UpgradeModule,
    AutosizeModule,
    // AutosizeModule,
    AutosizeModule,
    NewParserModule,
    UiSwitchModule,
    NgxsModule.forRoot(
      [
        UserState,
        GridState,
        TemplateState,
        RecommendationState,
        QuestionState,
        ReportState,
        QAState,
        WebsocketMessageState,
      ],
      {
        developmentMode: !environment.production,
      }
    ),
    NgxsLoggerPluginModule.forRoot({ disabled: true }),
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        // useFactory: HttpLoaderFactory,
        useFactory: createTranslateLoader,
        deps: [HttpClient],
      },
    }),
    NgSelectModule,
    InviteModule,
    ProjectsGridModule,
    DocumentsModule,
    FormsModule,
    ReactiveFormsModule,
    NgxFileDropModule,
    ColorPickerModule,
    TagInputModule,
    // ngx-bootstrap modules
    NgxDaterangepickerMd.forRoot(),
    AccordionModule.forRoot(),
    BsDropdownModule.forRoot(),
    PopoverModule.forRoot(),
    RatingModule.forRoot(),
    NgxDaterangepickerMd.forRoot(),
    BsDatepickerModule.forRoot(),
    ProgressbarModule.forRoot(),
    HotTableModule.forRoot(),
    // TODO: Remove after topnav migration
    SharedModule,
    TooltipModule.forRoot(),
    // QaBankModule,
    // ExcelSyncModule,
    PowerBIEmbedModule,
    EditorModule,
    // AnalyzeModule,
    NgxsReduxDevtoolsPluginModule.forRoot({ disabled: false }),
    RecommendationModule,
    //AdvancedReportingModule,
    //InboundManagementModule,
    NgxsWebsocketPluginModule.forRoot(),
    //DashboardModule,
    AppRoutingModule,
    AuthenticationModule,
  ],
  providers: [
    BsModalRef,
    DataService,
    DiligenceDataSaveService,
    AuthService,
    CustomModalService,
    InterpolatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EncodeHttpParamsInterceptor,
      multi: true,
    },
    {
      // processes all errors
      provide: ErrorHandler,
      useClass: ErrorHandlerService,
    },
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {}
  ngDoBootstrap() {}
}
