import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'functions-actions-renderer',
  templateUrl: './functions-actions-renderer.component.html',
  styleUrls: ['./functions-actions-renderer.component.css'],
})
export class FunctionsActionsRendererComponent implements ICellRendererAngularComp {
  params: any;

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  edit() {
    this.params.clickedEdit(this.params);
  }
  delete() {
    this.params.clickedRemove(this.params);
  }
}
