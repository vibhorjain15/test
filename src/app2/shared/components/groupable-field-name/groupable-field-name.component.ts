import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ColorTheme } from '../../themes/color.themes';

@Component({
  selector: 'app-groupable-field-name',
  templateUrl: './groupable-field-name.component.html',
  styleUrls: ['./groupable-field-name.component.css'],
})
export class GroupableFieldNameComponent implements ICellRendererAngularComp {
  params: any;
  colorTheme = ColorTheme;
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
  formatTagsTooltip(tagList) {
    tagList = tagList?.sort((a, b) => a?.localeCompare(b));
    return tagList?.slice(1)?.join(', ');
  }
}
