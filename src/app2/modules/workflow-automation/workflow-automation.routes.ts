import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WorkflowAutomationDetailComponent } from 'src/app2/shared/components/workflow-automation/workflow-automation-detail/workflow-automation-detail.component';
import { WorkflowAutomationPreview } from 'src/app2/shared/components/workflow-automation/workflow-automation-preview/workflow-automation-preview.component';

const WORKFLOW_AUTOMATION_ROUTE_NAMES = {
  DETAIL: 'detail',
  PREVIEW: 'preview',
} as const;

const routes: Routes = [
  {
    path: WORKFLOW_AUTOMATION_ROUTE_NAMES.DETAIL,
    component: WorkflowAutomationDetailComponent,
  },
  {
    path: WORKFLOW_AUTOMATION_ROUTE_NAMES.PREVIEW,
    component: WorkflowAutomationPreview,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WorkflowAutomationRoutingModule {}
