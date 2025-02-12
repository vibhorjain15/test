import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-entity-name-cell-renderer',
  templateUrl: './entity-name-cell-renderer.component.html',
  styleUrls: ['./entity-name-cell-renderer.component.css'],
})
export class EntityNameCellRendererComponent
  implements ICellRendererAngularComp
{
  // required properties
  readonly entityNameProperty: string = 'entityName';
  readonly entityTypeProperty: string = 'entityType';
  readonly isFreeSubscriptionTypeProperty: string = 'isFreeSubscription';

  params: any;
  url: string = '';
  entityName: string = '';
  entityType: string = '';
  isFreeSubscription: boolean = true;

  constructor() {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (this.params?.data) {
      this.entityName = this.params.data[this.params[this.entityNameProperty]];
      this.entityType = this.params[this.entityTypeProperty];
      this.isFreeSubscription =
        this.params[this.isFreeSubscriptionTypeProperty];
    } else {
      this.entityName = this.params?.value;
    }

    this.generateURL();
  }

  generateURL(): void {
    if (this.entityType === 'Firm') {
      this.url = `/app/firms/${this.params.data.id}/profile/monitor`;
    } else if (this.entityType === 'Strategy') {
      this.url = `/app/firms/${this.params.data.strategy.firm_id}/strategies/${this.params.data.strategy.id}/profile/monitor`;
    } else if (this.entityType === 'Product') {
      this.url = `/app/firms/${this.params.data.entity.firm_id}/funds/${this.params.data.entity.id}/profile/monitor`;
    } else if (this.entityType === 'Vehicle') {
      this.url = this.isFreeSubscription
        ? `/app/firms/${this.params.data.entity.firm_id}/funds/${this.params.data.entity.fund_id}/vehicles/${this.params.data.entity.id}/profile/aum_tr`
        : `/app/firms/${this.params.data.entity.firm_id}/funds/${this.params.data.entity.fund_id}/vehicles/${this.params.data.entity.id}/profile/monitor`;
    } else if (this.entityType === 'Template') {
      this.url = `/app/diligence/template/${this.params.data.id}/preview`;
    }
  }

  refresh(params: ICellRendererParams): boolean {
    return false;
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
