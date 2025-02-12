import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { QaBankService } from '../../service/qa-bank.service';
import { Questions, buttonList } from '../../types/qa-bank.model';
import { Subscription } from 'rxjs';
import { questionCardIcons } from '../../constants/qa-bank-icons.contants';
import { responseType } from 'src/app2/modules/template-builder/constants/responseType.constant';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import * as moment from 'moment';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { diligenceStatusConstant } from 'src/app2/shared/constants/constant';

@Component({
  selector: 'qa-library',
  templateUrl: './qa-library.component.html',
  styleUrls: ['./qa-library.component.css'],
})
export class QaLibraryComponent implements OnChanges {
  @Input() questionList: Questions[];
  @Input() currUser: CurrentUserModel;
  @Input() firmPreferences;
  subscription: Subscription;
  diligenceStatus = diligenceStatusConstant;
  constructor(
    public readonly qaBankService: QaBankService,
    private readonly SweetAlert: SweetAlertService,
    private readonly httpClient: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  ngOnChanges(change: SimpleChanges) {
    if (
      change?.questionList &&
      change?.questionList?.currentValue !== change?.questionList.previousValue
    ) {
      if (change?.questionList?.currentValue?.length) {
        this.updateQuestions();
      }
    }
  }

  updateQuestions() {
    let today = new Date().toISOString().slice(0, 10);
    this.questionList.forEach((question: Questions) => {
      question.rightIcons = this.getRightIconList(question);
      question.isExpired =
        question.expiry_date && question.expiry_date.slice(0, 10) < today;
    });
  }
  handleSelection() {
    this.qaBankService.handleSelection();
  }

  getRightIconList(question: Questions): buttonList[] {
    let icons: buttonList[] = [];

    if (
      [
        this.diligenceStatus.ReviewPassed.toLowerCase(),
        this.diligenceStatus.ReviewFailed.toLowerCase(),
        this.diligenceStatus.InReview.toLowerCase(),
      ].includes(question.response_status?.toLowerCase()) &&
      (!this.firmPreferences?.enable_auto_review_again ||
        question.response_status?.toLowerCase() !=
          this.diligenceStatus.ReviewPassed.toLowerCase())
    ) {
      // show reset review button for review in progress, passed and failed status if firm preference is disabled. if it is enabled, show it for in review and failed status.
      icons.push(questionCardIcons('refresh', question));
    }

    if (
      !question.response_is_na &&
      question.diligence_type == -1 &&
      ![
        responseType.Grid,
        responseType.DynamicGrid,
        responseType.Attachment,
        responseType.Dropdown,
        responseType.CheckBox,
        responseType.BooleanPlus,
        responseType.NoPlus,
        responseType.Bookends,
      ].includes(question.response_type)
    ) {
      icons.push(
        questionCardIcons(
          'edit',
          question,
          this.currUser,
          this.firmPreferences,
          this.diligenceStatus
        )
      );
    }

    if (
      question.response_text &&
      !question.response_is_na &&
      ![
        responseType.Grid,
        responseType.DynamicGrid,
        responseType.Attachment,
        responseType.Dropdown,
        responseType.CheckBox,
      ].includes(question.response_type)
    ) {
      icons.push(questionCardIcons('copy', question));
    }

    icons.push(questionCardIcons('notes', question));
    icons.push(questionCardIcons('ban', question));
    icons.push(questionCardIcons('viewSimilarQuestion'));
    icons.push({
      ...questionCardIcons('viewInProjectFormat'),
      link: this.qaBankService.getProjectViewLink(question),
    });
    return icons;
  }

  handleRightIconClick(event) {
    const icon: buttonList = event.action;
    let question: Questions = event.question;

    switch (icon.key) {
      case 'copy':
        this.qaBankService.copyResponse(question);
        break;
      case 'edit':
        this.qaBankService.invokeEditModal(question);
        break;
      case 'ban':
        this.qaBankService.deactivateBulkResponse([question]);
        break;
      case 'notes':
        this.qaBankService.addInternalNotes(question, () => {
          question.rightIcons = this.getRightIconList(question);
        });
        break;
      case 'viewSimilarQuestion':
        this.qaBankService.getViewSimilarQuestionsData(question);
        break;
      case 'refresh':
        this.SweetAlert.confirm({
          title: 'Are you sure you want to start the review process again?',
          text: 'This will restart the review for all assigned reviewers.',
          confirmButtonText: 'Start',
          showCloseButton: true,
          focusCancel: false,
          showLoaderOnConfirm: true,
          preConfirm: () => {
            this.resetReview(question);
          },
        }).then((isConfirm) => {
          if (isConfirm.dismiss && isConfirm.dismiss == 'cancel') {
            this.SweetAlert.close();
          }
        });
    }
  }

  resetReview(question) {
    this.httpClient
      .post(
        `diligences/${question.duediligence_id}/responses/${question.response_id}/reset_review`,
        null
      )
      .subscribe((res) => {
        this.qaBankService
          .checkIfQADataUpdated(false)
          .subscribe((updateRes) => {
            this.toaster.success('Re-review requested');
          });
      });
  }
}
