import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import {
  ICellRendererParams,
  IAfterGuiAttachedParams,
} from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-adv-frim-fund-cell-render',
  templateUrl: './adv-frim-fund-cell-render.component.html',
  styleUrls: ['./adv-frim-fund-cell-render.component.css'],
})
export class AdvFrimFundCellRenderComponent
  implements OnInit, ICellRendererAngularComp
{
  params: any;
  showPreview = false;
  link;
  label;
  constructor(private readonly routerService: RouterService) {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.link =
      this.params.colDef.headerName == 'Fund Name'
        ? 'private_funds'
        : 'snapshot';
    this.label =
      this.params.colDef.headerName == 'Fund Name'
        ? params.data?.pf_name
        : params.data?.info_legalname;
  }
  ngOnInit(): void {}

  click(event: any) {
    event.stopPropagation();
    event.preventDefault();
    const rowNode = this.params.node;
    const api = this.params.api;

    if (rowNode && api) {
      api.dispatchEvent({
        type: 'rowClicked',
        event: event,
        rowIndex: rowNode.rowIndex,
        rowNode: rowNode,
        data: rowNode.data,
      });
    }
  }
}
