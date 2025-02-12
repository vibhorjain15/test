import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-project-client-name-renderer',
  templateUrl: './project-client-name-renderer.component.html',
  styleUrls: ['./project-client-name-renderer.component.css'],
})
export class ProjectClientNameRendererComponent
  implements ICellRendererAngularComp
{
  params;
  constructor() {}
  isNew = false;
  url: string = '';

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.updateNewTag();
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
      this.url = `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/funds/${params.fundId}/projects/${params.diligenceId}/questionnaire`;
    }
    if (this.params.data.entity_type === 'Firm') {
      const params = {
        fromfirmId: this.params.data.fromfirm_id,
        tofirmId: this.params.data.entity_id,
        diligenceId: this.params.data.id,
      };
      this.url = `/app/diligence/${params.fromfirmId}/firms/${params.tofirmId}/projects/${params.diligenceId}/questionnaire`;
    }
    if (
      this.params.data.entity_type === 'Vehicle' ||
      this.params.data.entity_type === 'Strategy'
    ) {
      const params = { diligenceId: this.params.data.id };
      this.url = `/app/diligence/projects/${params.diligenceId}/questionnaire`;
    }
  }

  updateNewTag() {
    let isNew = false;
    if (this.params.data?.myWorkProject && this.params.data?.isInvestor) {

      if (this.params?.data?.projectType == 'followups')
        isNew = this.params?.data?.followupIsNew;
      if (this.params?.data?.projectType == 'questions')
        isNew = this.params?.data?.questionsIsNew;

      if (this.params?.data?.projectType == 'reviews')
        isNew = this.params?.data?.reviewIsNew;

      if (this.params?.data?.projectType == 'todos')
        isNew = this.params?.data?.toDoIsNew;

      if (this.params?.data?.projectType == 'flags')
        isNew = this.params?.data?.flagIsNew;

      if (this.params?.data?.projectType == 'completed')
        isNew = this.params?.data?.completedIsNew;

      if (this.params?.data?.projectType == 'total')
        isNew = this.params?.data?.totalIsNew;
    }
    this.isNew = isNew
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
