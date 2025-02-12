import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-project-type-renderer',
  templateUrl: './project-type-renderer.component.html',
  styleUrls: ['./project-type-renderer.component.css']
})
export class ProjectTypeRendererComponent implements ICellRendererAngularComp {
  params: any;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}