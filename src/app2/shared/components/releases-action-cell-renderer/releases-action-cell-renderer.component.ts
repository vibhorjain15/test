import { Component } from '@angular/core';

import { IReleaseDetailActionCellRendererParams } from 'src/app2/shared/models/releases.model';
import { IDVAngularComp } from 'src/app2/shared/models/dv-grid.model';

@Component({
  selector: 'app-releases-action-cell-renderer',
  templateUrl: './releases-action-cell-renderer.component.html',
  styleUrls: ['./releases-action-cell-renderer.component.css']
})
export class ReleasesActionCellRendererComponent implements IDVAngularComp<IReleaseDetailActionCellRendererParams> {
  params: IReleaseDetailActionCellRendererParams;

  refresh(params: IReleaseDetailActionCellRendererParams): boolean {
    return false;
  }

  agInit(params: IReleaseDetailActionCellRendererParams): void {
    this.params = params;
  }

  markReleaseAsFinal(): void {
    this.params.clickedMarkAsFinal(this.params.data);
  }

  edit(): void {
    this.params.clickedEdit(this.params.data);
  }

  delete(): void {
    this.params.clickedDelete(this.params.data);
  }

}
