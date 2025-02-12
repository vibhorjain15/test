import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'trigger-workflow',
  templateUrl: './trigger-workflow.component.html',
  styleUrls: ['./trigger-workflow.component.css'],
})
export class TriggerWorkflowModal implements OnInit {
  workflows: Array<any>;
  workflowForm: FormGroup;
  loading: boolean;
  @Input() entity_type: string;
  @Input() entity_id: number;
  @Input() name: string;
  @Input() pageUrl: string;

  constructor(
    private http: HttpClient,
    private route: RouterService,
    private customModal: CustomModalService
  ) {}

  ngOnInit(): void {
    this.workflowForm = new FormGroup({
      workflow_id: new FormControl(null, Validators.required),
    });
    this.getWorkflows();
  }

  getWorkflows() {
    const params = {
      entity_type: this.entity_type,
    };
    const headers = new HttpHeaders();
    if (this.pageUrl) {
      headers.set('page-url', this.pageUrl);
    }
    this.http
      .get('workflows', { params: params, headers: headers })
      .subscribe((response: any) => {
        this.workflows = response;
      });
  }

  save(modalCallback) {
    if (!this.workflowForm.valid) {
      this.workflowForm.markAllAsTouched();
      return;
    } else {
      this.route.navigateWithParams('app.workflow_automation.preview', {
        Id: this.workflowForm.get('workflow_id').value,
        entity_type: this.entity_type,
        entity_id: this.entity_id,
      });
      modalCallback();
    }
  }

  redirectToWorkflowDefinitions() {
    const param = {
      name: null,
      entity_type: this.entity_type,
      entity_sub_type: null,
    };
    this.customModal.close();
    this.customModal.invoke('manage-workflow', {
      initialState: {
        edit_mode: false,
        workflow: param,
      },
    });
  }
}
