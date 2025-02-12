import { Component } from '@angular/core';

import { IBannerDetailActionCellRendererParams } from 'src/app2/shared/models/banners.model';
import { IDVAngularComp } from 'src/app2/shared/models/dv-grid.model';

@Component({
  selector: 'app-banners-action-cell-renderer',
  templateUrl: './banners-action-cell-renderer.component.html',
  styleUrls: ['./banners-action-cell-renderer.component.css'],
})
export class BannersActionCellRendererComponent
  implements IDVAngularComp<IBannerDetailActionCellRendererParams>
{
  params: IBannerDetailActionCellRendererParams;

  refresh(params: IBannerDetailActionCellRendererParams): boolean {
    return false;
  }

  agInit(params: IBannerDetailActionCellRendererParams): void {
    this.params = params;
  }

  markBannerAsFinal(): void {
    this.params.clickedMarkAsFinal(this.params.data);
  }

  edit(): void {
    this.params.clickedEdit(this.params.data);
  }

  delete(): void {
    this.params.clickedDelete(this.params.data);
  }
}
