import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-scores-dd-firm-name',
  templateUrl: './scores-dd-firm-name.component.html',
})
export class ScoresDdFirmNameComponent implements ICellRendererAngularComp {
  params: any;
  value: number;
  field: string;
  constructor(private readonly routerService: RouterService) {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.field = this.params.colDef.field;
  }
  navigateToUrl(diligenceId, status, event) {
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
    this.routerService.navigateWithParams(
      'app.diligence.project.questionnaire',
      {
        diligenceId: diligenceId,
        status: status,
      }
    );
  }
}
