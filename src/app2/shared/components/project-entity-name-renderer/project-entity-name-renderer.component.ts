import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-project-entity-name-renderer',
  templateUrl: './project-entity-name-renderer.component.html',
  styleUrls: ['./project-entity-name-renderer.component.css'],
})
export class ProjectEntityNameRendererComponent
  implements ICellRendererAngularComp
{
  params;
  url: string = '';
  constructor() {}
  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (params.data && !params.node.group) {
      this.getUrl();
    }
  }

  getUrl() {
    if (this.params.data.entity_type === 'Fund') {
      const params = {
        fromfirmId: this.params.data.fromfirm_id,
        tofirmId: this.params.data.tofirm_id,
        fundId: this.params.data.entity_id,
        diligenceId: this.params.data.id,
      };
      this.url = `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/funds/${params.fundId}/projects/${params.diligenceId}/summary`;
    }
    if (this.params.data.entity_type === 'Firm') {
      const params = {
        fromfirmId: this.params.data.fromfirm_id,
        tofirmId: this.params.data.entity_id,
        diligenceId: this.params.data.id,
      };
      this.url = `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/projects/${params.diligenceId}/summary`;
    }
    if (
      this.params.data.entity_type === 'Vehicle' ||
      this.params.data.entity_type === 'Review'
    ) {
      const params = { diligenceId: this.params.data.id };
      this.url = `/app/diligence/projects/${params.diligenceId}/summary`;
    }
    if (this.params.data.entity_type === 'Strategy') {
      const params = {
        fromfirmId: this.params.data.fromfirm_id,
        tofirmId: this.params.data.entity_id,
        diligenceId: this.params.data.id,
      };
      this.url = `/app/diligence/projects/${params.diligenceId}/summary`;
    }
  }

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
