import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { keywordConstants, QuestionnaireSuccessMessages } from 'src/app2/shared/constants/constant';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { DvDraftService } from '../../service/draft.service';
import {
  GetQuestionCount,
  UpdateDraftData,
} from '../../store/questionnaire.action';

@Component({
  selector: 'app-view-related-diligences',
  templateUrl: './view-related-diligences.component.html',
  styleUrls: ['./view-related-diligences.component.css'],
})
export class ViewRelatedDiligencesComponent implements OnInit {
  @Input() diligence: DiligenceType;
  @Input() disabled: boolean;
  @Input() disabledTooltip: any;
  @Input() user: CurrentUserModel;
  canSubmit: boolean = true;
  projects: any;
  firstButtonEnable;
  firstButtonLabel;
  secondButtonEnable;
  submittingDiligence;
  loading: boolean;
  projectsCopy: any;
  constructor(
    private readonly questionnaire: QuestionnaireService,
    private readonly router: RouterService,
    private readonly store: Store,
    private readonly SweetAlert: SweetAlertService,
    private readonly draftService: DvDraftService,
    private readonly toast: ToastrService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.questionnaire
      .getLinkedProjectsCountTrue(this.diligence.id)
      .subscribe((res: any) => {
        this.projects = res;
        this.projectsCopy = JSON.parse(JSON.stringify(this.projects));
        this.secondButtonEnable =
          this.diligence.linked_duediligence_id &&
          (this.diligence.entity_type == 'Vehicle' ||
            this.diligence.entity_type == 'Strategy' ||
            this.diligence.entity_type == 'Fund');
        this.firstButtonEnable =
          this.diligence.entity_type != keywordConstants.Vehicle &&
          (this.user.isManager ||
            (this.diligence.is_internal && this.user.isInvestor)) &&
          !this.diligence.alwaysOpen &&
          {
            Started: true,
            ExtensionRequested: true,
            Followup: true,
            InReview: true,
          }[this.diligence.status];
        this.canSubmit = res.reduce(
          (canSubmit, project) =>
            canSubmit &&
            (project.percentage_completed > 0 || project.status == 'Completed'),
          true
        );
        this.loading = false;
      });

    this.firstButtonLabel = this.user.isInvestor
      ? 'Submit all projects'
      : 'Submit all projects to investor';
  }

  handleClick(project) {
    if (project.entity_type == 'Vehicle')
      window.open(
        `/#/app/diligence/${project.fromfirm_id}/firms/${project.tofirm_id}/funds/${project.parent_entity_id}/vehicles/${project.entity_id}/projects/${project.id}/questionnaire`
      );
    else if (project.entity_type == 'Fund')
      window.open(
        `/#/app/diligence/${project.fromfirm_id}/firms/${project.tofirm_id}/strategies/${project.parent_entity_id}/funds/${project.entity_id}/projects/${project.id}/questionnaire`
      );
  }

  async submitAllDiligence(close) {
    let promises = [];
    this.projects.forEach((project) => {
      if (project.status != 'Completed')
        promises.push(
          this.questionnaire.updateDiligenceStatus(project.id, {
            status: 'Completed',
          })
        );
    });
    await forkJoin(promises).toPromise();
    this.questionnaire
      .updateDiligenceStatus(this.diligence.id, { status: 'Completed' })
      .subscribe(
        (response) => {
          close();
          const message = this.diligence.is_internal
            ? QuestionnaireSuccessMessages.projectMarkedAsComplete
            : QuestionnaireSuccessMessages.sentToRequestForReview
          this.toast.success(message);
          this.submittingDiligence = false;
          this.router.navigateWithParams('app.diligence.projects.activity', {
            type: 'in-progress',
          });
        },
        (error) => {
          this.submittingDiligence = false;
        }
      );
  }

  showConfirmationAlert(close) {
    let pct_complete = this.diligence.percentage_completed;
    let messageText = '';

    if (pct_complete == 0)
      messageText =
        'Did you click this by mistake? You are yet to start answering.';
    else if (pct_complete < 50)
      messageText =
        'You have only partially completed this questionnaire, less than 50% of the questions, which is below industry average.';
    else if (pct_complete < 75)
      messageText =
        'Great effort in completing the questionnaire. Although, it is still less than 75% complete, and below industry average.';
    else if (pct_complete < 100)
      messageText =
        'You are almost there! Only a few % more, and you will be at 100%.';

    this.SweetAlert.confirm({
      title:
        'Are you sure you want to submit this for requestor review? You will not be able to make any more edits',
      text: messageText,
      confirmButtonText: 'Yes, please submit',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.submitAllDiligence(close);
      },
    }).then((isConfirm) => {
      if (isConfirm.dismiss && isConfirm.dismiss == 'cancel') {
        this.submittingDiligence = false;
      }
    });
  }

  submit(close) {
    if (this.canSubmit && !this.disabled) {
      this.submittingDiligence = true;
      if (this.draftService.getDraftCount()) {
        let title =
          'Are you sure you want to submit? You have unsaved changes.';
        let cancelButtonText = 'Submit without saving';
        let confirmButtonText = 'Save & Submit';
        this.draftService.showCountAlert(
          () => {
            this.submitAllDiligence(close);
          },
          () => {
            this.submitAllDiligence(close);
            this.store.dispatch(new UpdateDraftData(null));
          },
          title,
          undefined,
          confirmButtonText,
          cancelButtonText
        );
      } else this.showConfirmationAlert(close);
    }
  }

  handleGotoMainProject() {
    if (this.secondButtonEnable) {
      if (this.diligence.entity_type == 'Vehicle')
        window.open(
          `/#/app/diligence/${this.diligence.fromfirm_id}/firms/${this.diligence.tofirm_id}/funds/${this.diligence.parent_entity_id}/projects/${this.diligence.linked_duediligence_id}/questionnaire`
        );
      else if (
        this.diligence.entity_type == 'Strategy' ||
        this.diligence.entity_type == 'Fund'
      )
        window.open(
          `/#/app/diligence/${this.diligence.fromfirm_id}/firms/${this.diligence.tofirm_id}/strategies/${this.diligence.parent_entity_id}/projects/${this.diligence.linked_duediligence_id}/questionnaire`
        );
    }
  }

  handleSearchQuery(input) {
    if (input == '') this.projects = this.projectsCopy;
    else {
      this.projects = this.projectsCopy.filter(
        (project) => project.entity_name.indexOf(input) !== -1
      );
    }
  }
}
