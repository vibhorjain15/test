import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';

@Component({
  selector: 'new-workflow',
  templateUrl: './new-workflow.component.html',
  styleUrls: ['./new-workflow.component.css'],
})
export class NewWorkflowComponent implements OnInit {
  loading: boolean = false;
  workflow: any;
  selectedWorkflow: any;
  diligence: DiligenceType;
  buttonLoader: boolean = false;
  entity_type = 'Duediligence'; // will remain static for questionnaire
  constructor(
    private readonly panel: SidePanelService,
    private readonly questionnaire: QuestionnaireService,
    private readonly routerService: RouterService,
    private readonly modal: CustomModalService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.questionnaire.getWorkFlow(this.entity_type).subscribe((res) => {
      this.workflow = res;
      this.loading = false;
    });
    this.diligence = this.store.selectSnapshot(
      (state) => state.questionnaire.diligence
    );
  }

  onCancel() {
    this.panel.close();
  }

  reviewWorkflow() {
    if (this.selectedWorkflow) {
      this.routerService.navigateWithParams(
        `app/workflow_automation/${this.selectedWorkflow}/preview`,
        {
          entity_type: this.entity_type,
          entity_id: this.diligence.id,
        }
      );
      this.panel.close();
      this.buttonLoader = true;
    }
  }

  redirectToWorkflowDefinitions() {
    let param = {
      name: null,
      entity_type: this.entity_type,
      entity_sub_type: null,
    };
    this.modal.invoke('manage-workflow', {
      initialState: {
        edit_mode: false,
        workflow: () => param,
      },
    });
  }
}
