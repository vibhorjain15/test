import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-project-status-renderer',
  templateUrl: './project-status-renderer.component.html',
  styleUrls: ['./project-status-renderer.component.css'],
})
export class ProjectStatusRendererComponent
  implements ICellRendererAngularComp
{
  params: any;
  secondaryStatus: string;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (!params.node.group) {
      const value: string = this.params.value;
      const followupString: string = 'Follow-up';
      if (value.endsWith(followupString) && !value.startsWith(followupString)) {
        // primary status with follow-up text
        this.params.value = value.replace(followupString, '').trim();
        this.secondaryStatus = followupString;
      }
    }
  }
}
