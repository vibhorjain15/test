import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { InboundService } from '../inbound.service';

@Component({
  selector: 'app-inbound-contacts',
  templateUrl: './inbound-contacts.component.html',
  styleUrls: ['./inbound-contacts.component.css'],
})
export class InboundContactsComponent implements ICellRendererAngularComp {
  params;
  constructor(private readonly inboundService: InboundService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  formatUsersTooltip(): string {
    return this.params.data.contacts
      .slice(2)
      .map((contact) => contact.name)
      .join(', ');
  }
}
