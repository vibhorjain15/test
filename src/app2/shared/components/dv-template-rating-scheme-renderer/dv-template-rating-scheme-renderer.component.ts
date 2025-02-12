import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'dv-template-rating-scheme-renderer',
  templateUrl: './dv-template-rating-scheme-renderer.component.html',
  styleUrls: ['./dv-template-rating-scheme-renderer.component.css'],
})
export class TemplateRatingSchemeRendererComponent
  implements ICellRendererAngularComp
{
  params: any;
  url: any;
  constructor(private router: RouterService) {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.url = this.getUrl();
  }

  getUrl() {
    if (this.params.data && this.params.data.rating_scheme_id)
      return this.router.href('app.firm.settings.investment_rating.types', {
        rating_id: this.params.data.rating_scheme_id,
      });
  }
}
