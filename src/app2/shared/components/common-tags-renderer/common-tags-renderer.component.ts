import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'common-tags-renderer.component',
  templateUrl: './common-tags-renderer.component.html',
})
export class CommonTagsRenderer implements ICellRendererAngularComp {
  tag: any;
  params;
  constructor() {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.tag = params.value;
    this.params = params;
  }
}
