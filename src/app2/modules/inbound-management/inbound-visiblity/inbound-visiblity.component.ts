import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { InboundService } from '../inbound.service';
@Component({
  selector: 'app-inbound-visiblity',
  templateUrl: './inbound-visiblity.component.html',
  styleUrls: ['./inbound-visiblity.component.css']
})
export class InboundVisiblityComponent implements ICellRendererAngularComp {

  params;
  constructor(private readonly inboundService: InboundService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

}
