import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'issue-tag',
  templateUrl: './issue-tag.component.html',
  styleUrls: ['./issue-tag.component.css'],
})
export class IssueTagComponent implements ICellRendererAngularComp {
  @Input() label: string = '';
  background: any;
  color: any;

  constructor(private readonly Utils: UtilsService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    if (params.value) {
      this.label = params.value;
      if (params?.colDef?.field == 'statusName') {
        this.background = params?.data?.statusColor;
      } else if (params?.colDef?.field == 'priorityName') {
        this.background = params?.data?.priorityColor;
      }
      if (
        (params.colDef.field == 'statusName' ||
          params.colDef.field == 'priorityName') &&
        this.background
      ) {
        const hspToCompareColor = 200;
        this.color =
          this.Utils.isColorLightOrDark(this.background, hspToCompareColor) ==
          'dark'
            ? 'white'
            : 'black';
      }
    }
  }
}
