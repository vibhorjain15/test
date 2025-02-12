import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-workflow-name',
  templateUrl: './workflow-name.component.html',
  styleUrls: ['./workflow-name.component.css'],
})
export class WorkflowNameComponent implements ICellRendererAngularComp {
  params;
  url = '';
  constructor(private readonly routerService: RouterService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (!params?.node.group) {
      this.url = `/#/app/workflow_automation/${this.params.data.id}/detail`;
    }
  }

  navigateToUrl(workflowId) {
    this.routerService.navigateWithParams('app.workflow_automation.detail', {
      Id: workflowId,
    });
  }

  click(event: any) {
    event.stopPropagation();
    event.preventDefault();
    const rowNode = this.params.node;
    const api = this.params.api;

    if (rowNode && api) {
      api.dispatchEvent({
        type: 'rowClicked',
        event: event,
        rowIndex: rowNode.rowIndex,
        rowNode: rowNode,
        data: rowNode.data,
      });
    }
  }
}
