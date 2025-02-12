import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-inbound-links',
  templateUrl: './inbound-links.component.html',
  styleUrls: ['./inbound-links.component.css'],
})
export class InboundLinksComponent implements ICellRendererAngularComp {
  params;
  constructor(private readonly toaster: ToastrService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  copyToClipboard() {
    navigator.clipboard.writeText(this.params.data.links);
    this.toaster.success('Link copied successfully');
  }
}
