import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'project-template-name-renderer',
  templateUrl: './project-template-name-renderer.component.html',
  styleUrls: ['./project-template-name-renderer.component.css'],
})
export class ProjectTemplateNameRendererComponent
  implements ICellRendererAngularComp
{
  params: any;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
