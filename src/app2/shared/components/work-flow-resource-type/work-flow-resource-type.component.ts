import { Component } from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants } from '../../constants/constant';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-work-flow-resource-type',
  templateUrl: './work-flow-resource-type.component.html'
})
export class WorkFlowResourceTypeComponent implements ICellRendererAngularComp {

  constructor(private readonly UtilsService: UtilsService,) { }
  is_manager;
  params;

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.is_manager = this.UtilsService.isManager();
  }

  getEntityTypeName(type) {
    let displayName = this.UtilsService.getDisplayEntityType(
      type
    );
    if (this.is_manager && displayName === keywordConstants.Firm) {
      displayName = 'Investor';
    }
    return displayName;
  }

}
