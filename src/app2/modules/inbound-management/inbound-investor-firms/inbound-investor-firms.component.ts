import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { InboundService } from '../inbound.service';
@Component({
  selector: 'app-inbound-investor-firms',
  templateUrl: './inbound-investor-firms.component.html',
  styleUrls: ['./inbound-investor-firms.component.css']
})
export class InboundInvestorFirmsComponent implements ICellRendererAngularComp {

  params;
  constructor(private readonly inboundService: InboundService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
