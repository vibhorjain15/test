import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-entity-status',
  templateUrl: './entity-status.component.html',
  styleUrls: ['./entity-status.component.css'],
})
export class EntityStatusComponent implements OnInit, ICellRendererAngularComp {
  params: any;
  stateParams: any;
  constructor() {}
  ngOnInit(): void {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
  }
}
