import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { UtilsService } from './../../../services/utils.service';

@Component({
  selector: 'app-dd-due-date',
  templateUrl: './dd-due-date.component.html',
  styleUrls: ['./dd-due-date.component.css'],
})
export class DdDueDateComponent implements ICellRendererAngularComp {

  params: any;
  constructor(public Utils: UtilsService) { }

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

}
