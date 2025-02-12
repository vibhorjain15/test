import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-entity-action',
  templateUrl: './entity-action.component.html',
  styleUrls: ['./entity-action.component.css'],
})
export class EntityActionComponent implements ICellRendererAngularComp {
  params;
  disableEditButton: boolean;
  disableDeleteButton: boolean;
  editTooltip: string = 'Edit';
  deleteTooltip: string = 'Revoke Access';

  constructor(private readonly routerService: RouterService) {}

  refresh(params: ICellRendererParams): boolean {
    return false;
  }
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.initData();
  }
  edit() {
    if (!this.disableEditButton) {
      this.params.clickedEdit(this.params);
    }
  }
  delete() {
    if (!this.disableDeleteButton) {
      this.params.clickedDelete(this.params);
    }
  }

  initData() {
    const stateParams = this.routerService.getState()?.params;
    if (
      (stateParams.entity_type === 'Team' &&
        this.params?.data?.assigned_to_entity_type === 'User') ||
      (stateParams.entity_type === 'User' &&
        this.params?.data?.assigned_to_entity_type === 'Team')
    ) {
      this.disableEditButton = true;
      this.disableDeleteButton = true;
      this.editTooltip =
        this.deleteTooltip = `Please visit the Teams permission section to edit/delete permissions for ${this.params.data.assigned_to_name}.`;
    } else if (this.params.data?.underlying_entity) {
      this.disableEditButton = true;
      this.disableDeleteButton = true;
      this.editTooltip =
        this.deleteTooltip = `You can't edit/delete this permission as it is given based on the permission of the parent entity.`;
    } else if (this.params.data?.is_default) {
      this.disableDeleteButton = true;
      this.deleteTooltip = `You can't delete default permissions`;
    }
  }
}
