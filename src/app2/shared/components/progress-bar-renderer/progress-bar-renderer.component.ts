import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-progress-bar-renderer',
  templateUrl: './progress-bar-renderer.component.html',
  styleUrls: ['./progress-bar-renderer.component.css'],
})
export class ProgressBarRendererComponent implements ICellRendererAngularComp {
  value: number;
  params: any;
  progressbarLabelId: string = 'progressbar-label-' + Math.random().toString(36).substring(2);
  count = '';
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.value = +params.value;
    this.count = `${Math.round(
      (this.params.data?.question_count * params.data?.percentage_completed) /
        100
    )}/${params.data?.question_count}`;
  }
}
