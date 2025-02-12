import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { InboundService } from '../inbound.service';
@Component({
  selector: 'app-inbound-email-template',
  templateUrl: './inbound-email-template.component.html',
  styleUrls: ['./inbound-email-template.component.css']
})
export class InboundEmailTemplateComponent implements ICellRendererAngularComp {

  params;
  constructor(private readonly inboundService: InboundService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

}
