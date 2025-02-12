import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { PowerBIEmbedModule } from 'powerbi-client-angular';
import { SharedModule } from 'src/app2/shared/shared.module';
import { AdvancedReportingComponent } from './components/advanced-reporting/advanced-reporting.component';
import { CreateCustomviewGroupModal } from './modals/create-customview-group/create-customview-group.component';
import { CreateCustomViewModal } from './modals/create-customview/create-customview.component';
import { RouterModule } from '@angular/router';
import { ADVANCED_REPORTING_ROUTES } from './advanced-reporting.routes';

@NgModule({
  declarations: [
    AdvancedReportingComponent,
    CreateCustomViewModal,
    CreateCustomviewGroupModal,
  ],
  imports: [CommonModule, SharedModule, HttpClientModule, PowerBIEmbedModule,RouterModule.forChild(ADVANCED_REPORTING_ROUTES)],
})
export class AdvancedReportingModule {}
