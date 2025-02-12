import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { keywordConstants } from 'src/app2/shared/constants/constant';
@Injectable({
  providedIn: 'root',
})
export class MyActionsService {
  constructor(private router: RouterService) {}

  getActionsColDef(): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'entity_name',
      headerName: 'Task For',
      field: 'entity_name',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      minWidth: grid_widths_map.sm_column_sm,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search',
      },
      suppressColumnsToolPanel: true,
      cellRenderer: 'functionEntryNameRenderer',
      cellClass: 'my-permission-cursor-pointer  text-left',
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'due_at',
      headerName: 'Due Date',
      field: 'due_at',
      cellRenderer: 'functionDDDdueDateRenderer',
      minWidth: grid_widths_map.sm_column_xm,
      cellClass: 'text-left',
      flex: 1,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'action_label',
      headerName: 'Task Type',
      field: 'activity_type_name',
      cellRenderer: 'functionMyActionsActionRenderer',
      cellRendererParams: {},
      cellClass: 'text-center',
      minWidth: grid_widths_map.sm_column_sm,
      flex: 1,
    });
    return colDef;
  }

  redirectTask(data) {
    if (data.entity_type === 'Workflow') {
      return this.router.navigateWithParams('app.workflow_automation.detail', {
        Id: data.entity_id,
        action_id: data.action_id,
        workflow_steps_actions_id: data.workflow_steps_actions_id,
      });
    } else if (data.entity_type === 'Response') {
      return this.router.navigateWithParams(
        'app.diligence.project.questionnaire.category.question',
        {
          diligenceId: data.diligence_id,
          questionId: data.entity_id,
          categoryId: data.parent_section_id,
          '#': `child_section_${data.section_id}`,
        }
      );
    } else if (data.entity_type === 'Section') {
      return this.router.navigateWithParams(
        'app.diligence.project.questionnaire.category',
        {
          diligenceId: data.diligence_id,
          categoryId: data.parent_section_id,
          '#': `child_section_${data.section_id}`,
        }
      );
    } else {
      return this.redirectToEntityPage(data.entity_type, data.entity_id);
    }
  }

  redirectToEntityPage(entity_type, entity_id) {
    switch (entity_type) {
      case 'Duediligence':
        this.router.navigateWithParams('app.diligence.project.notes', {
          diligenceId: entity_id,
        });
        break;
      case keywordConstants.Product:
        this.router.navigateWithParams('app.funds.profile.monitor', {
          fundId: entity_id,
        });
        break;
      case keywordConstants.Firm:
        this.router.navigateWithParams('app.firms.profile.monitor', {
          firmId: entity_id,
        });
        break;
      case 'User':
        this.router.navigateWithParams('app.contacts', {
          Id: entity_id,
        });
        break;
      case 'Workflow':
        this.router.navigateWithParams('app.workflow_automation.detail', {
          Id: entity_id,
        });
        break;
      case 'Attachment':
        this.router.navigateWithParams('app.content.document.detail', {
          documentId: entity_id,
        });
        break;
      case 'FormADV':
        this.router.navigateWithParams('app.form_adv.firm.filings_history', {
          firmCRD: entity_id,
        });
        break;
      case 'Meeting':
        this.router.navigateWithParams('app.monitor.meetings.detail', {
          Id: entity_id,
        });
        break;
      case keywordConstants.Vehicle:
        this.router.navigateWithParams('app.vehicles.profile.monitor', {
          vehicleId: entity_id,
        });
        break;
      case keywordConstants.Strategy:
        this.router.navigateWithParams('app.strategies.profile.monitor', {
          strategyId: entity_id,
        });
        break;
    }
  }
  redirectTaskUrl(data) {
    if (data.entity_type === 'Workflow') {
      return `/app/workflow_automation/${data.entity_id}/detail`;
      // return {
      //   link: 'app.workflow_automation.detail',
      //   params: {
      //     Id: data.entity_id,
      //     action_id: data.action_id,
      //     workflow_steps_actions_id: data.workflow_steps_actions_id,
      //   },
      // };
    } else if (data.entity_type === 'Response') {
      return `/app/diligence/projects/${data.diligence_id}/questionnaire/category/${data.parent_section_id}/question/${data.entity_id}#child_section_${data.section_id}`;
    } else if (data.entity_type === 'Section') {
      return `/app/diligence/projects/${data.diligence_id}/questionnaire/category/${data.parent_section_id}#child_section_${data.section_id}`;
    } else {
      return this.getUrlToEntityPage(data.entity_type, data.entity_id);
    }
  }

  getUrlToEntityPage(entity_type, entity_id) {
    switch (entity_type) {
      case 'Duediligence':
        return `/app/diligence/projects/${entity_id}/notes`;
      case keywordConstants.Product:
        return `/app/funds/${entity_id}/profile/monitor`;
      case keywordConstants.Firm:
        return `app/firms/${entity_id}/profile/monitor`;
      case 'User':
        return `/app/contacts/${entity_id}`;
      case 'Workflow':
        return `/app/workflow_automation/${entity_id}/detail`;
      case 'Attachment':
        return `/app/content/document/${entity_id}/detail`;
      case 'FormADV':
        return `app/form_adv/firm/${entity_id}/filings_history`;
      case 'Meeting':
        return `app/monitor/meetings/${entity_id}/detail`;
      case keywordConstants.Vehicle:
        return `/app/vehicles/${entity_id}/profile/monitor`;
      case keywordConstants.Strategy:
        return `/app/strategies/${entity_id}/profile/monitor`;
    }
  }
}
