import { HttpClient } from '@angular/common/http';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-dv-workflows',
  templateUrl: './dv-workflows.component.html',
  styleUrls: ['./dv-workflows.component.css'],
})
export class DvWorkflowsComponent implements OnInit, OnChanges {
  @Input() entityType;
  @Input() entityId;
  @Input() entityName;
  @Input() disableInsert;
  @Input() dateFilter;
  @Input() pageUrl;
  @Input() refreshWorkflows;
  workflows = [];
  insertDisabled;
  customDateFilter: any;
  loadingWorkflows: boolean;

  constructor(
    private readonly http: HttpClient,
    private readonly BaseDataService: BaseDataService,
    private readonly Utils: UtilsService,
    private readonly ModalFactory: CustomModalService,
    private readonly routerService: RouterService,
    private readonly documentDataService: DocumentDataService
  ) {}

  ngOnInit() {
    this.getWorkflows();
    this.customDateFilter = this.dateFilter;
    this.insertDisabled = this.disableInsert || false;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes?.dateFilter?.currentValue !== changes?.dateFilter?.previousValue
    ) {
      this.customDateFilter = changes?.dateFilter?.currentValue;
      this.getWorkflows();
    }
  }

  getWorkflows() {
    this.loadingWorkflows = true;
    const params: any = {
      entity_type: this.entityType,
      entity_id: this.entityId,
    };
    if (this.customDateFilter) {
      params.start_date = this.customDateFilter.startDate;
      params.end_date = this.customDateFilter.endDate;
    }
    const pageUrl = this.documentDataService.getDocumentPageUrl();
    let headers = {};
    if (pageUrl) {
      headers = {
        'page-url': pageUrl,
      };
    }
    this.http.get(`workflow_audits`, { params }).subscribe(
      (response: any) => {
        this.workflows = response;
        this.loadingWorkflows = false;
      },
      (error: any) => {
        this.loadingWorkflows = false;
        const avoid_error_logging_statuses =
          this.BaseDataService.getAvoidErrorLoggingStatusList();
        if (!avoid_error_logging_statuses.includes(error.status)) {
          this.Utils.logError('Not able to fetch workflow', error);
        }
      }
    );
  }

  addWorkflow() {
    this.ModalFactory.invoke('trigger-workflow', {
      initialState: {
        entity_type: this.entityType,
        entity_id: this.entityId,
        name: this.entityName,
        pageUrl: this.pageUrl,
      },
    });
  }

  navigateToWorkflowDetail(workflowId) {
    this.routerService.navigateWithParams(`app.workflow_automation.detail`, {
      Id: workflowId,
    });
  }
}
