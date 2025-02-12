import { Component} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-permission-visibility',
  templateUrl: './permission-visibility.component.html',
  styleUrls: ['./permission-visibility.component.css'],
})
export class PermissionVisibilityComponent implements ICellRendererAngularComp {
  value: string;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.value = !params.node.group ? params.data.visibility : params.value;
  }
}