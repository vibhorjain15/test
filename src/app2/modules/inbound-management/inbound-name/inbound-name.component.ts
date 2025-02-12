import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { InboundService } from '../inbound.service';
@Component({
  selector: 'app-inbound-name',
  templateUrl: './inbound-name.component.html',
  styleUrls: ['./inbound-name.component.css']
})
export class InboundNameComponent implements ICellRendererAngularComp {

  params;
  constructor(private readonly inboundService: InboundService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

}
