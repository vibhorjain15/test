import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-contact-name',
  templateUrl: './contact-name.component.html',
  styleUrls: ['./contact-name.component.css'],
})
export class ContactNameComponent implements ICellRendererAngularComp {
  // required properties
  readonly entityTypeProperty: string = 'entityType';

  params: any;
  entityType: string = '';
  url: string = '';

  constructor() {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (this.params?.data) {
      this.entityType = this.params[this.entityTypeProperty];
    }

    this.generateURL();
  }

  generateURL(): void {
    if (this.entityType === 'Contact') {
      this.url = `/app/contacts/${this.params.data.entity.id}`;
    }
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
