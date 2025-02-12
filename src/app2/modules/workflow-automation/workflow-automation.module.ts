import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from 'src/app2/shared/shared.module';
import { WorkflowAutomationRoutingModule } from './workflow-automation.routes';

@NgModule({
  declarations: [],
  imports: [CommonModule, WorkflowAutomationRoutingModule, SharedModule],
})
export class WorkflowAutomationModule {}
