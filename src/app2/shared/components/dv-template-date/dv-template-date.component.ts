import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { TemplateGridService } from 'src/app2/modules/template-builder/page/template-grid/template-grid.service';

@Component({
  selector: 'app-dv-template-date',
  templateUrl: './dv-template-date.component.html',
  styleUrls: ['./dv-template-date.component.css'],
})
export class DvTemplateDateComponent implements ICellRendererAngularComp {
  params: any;
  label;
  constructor(private templateGrid: TemplateGridService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.label = this.templateGrid.lastUpdateFinder(params.value, true);
  }
}
