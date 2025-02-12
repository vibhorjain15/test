import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'task-type',
  templateUrl: './task_type.component.html',
  styleUrls: ['./task_type.component.css'],
})
export class TaskTypeComponent implements ICellRendererAngularComp {
  @Input() label: string = '';
  background: any;
  color: any;
  params;
  constructor(private readonly Utils: UtilsService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (params.value) {
      this.label = params.value;
    }
  }
}
