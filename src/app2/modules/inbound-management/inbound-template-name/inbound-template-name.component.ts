import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { InboundService } from '../inbound.service';
@Component({
  selector: 'app-inbound-template-name',
  templateUrl: './inbound-template-name.component.html',
  styleUrls: ['./inbound-template-name.component.css'],
})
export class InboundTemplateNameComponent implements ICellRendererAngularComp {
  params;
  constructor(private readonly inboundService: InboundService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
