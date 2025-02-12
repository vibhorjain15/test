import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-function-users',
  templateUrl: './function-users.component.html',
  styleUrls: ['./function-users.component.css']
})
export class FunctionUsersComponent implements ICellRendererAngularComp {
  params: any;
  constructor() {}

  refresh(): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  formatUsersTooltip(usersArray: Array<any>): string {
    let users = usersArray.map(x => x);
    users.splice(0,4);
    return users.join(', ');
  }
}
