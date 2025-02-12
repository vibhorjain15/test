import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'cell-html',
  templateUrl: './cell-html.component.html',
  styleUrls: ['./cell-html.component.css'],
})
export class CellHtmlComponent implements ICellRendererAngularComp {
  @Input() label: string = '';

  constructor(private readonly Utils: UtilsService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    if (params.value) {
      this.label = params.value ? params.value : '';
    }
  }
}
