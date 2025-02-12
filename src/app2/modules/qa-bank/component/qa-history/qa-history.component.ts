import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { QaBankService } from '../../service/qa-bank.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Questions, buttonList } from '../../types/qa-bank.model';
import { responseType } from 'src/app2/modules/template-builder/constants/responseType.constant';
import { questionCardIcons } from '../../constants/qa-bank-icons.contants';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { UtilsService } from 'src/app2/services/utils.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'qa-history',
  templateUrl: './qa-history.component.html',
  styleUrls: ['./qa-history.component.css'],
})
export class QaHistoryComponent implements OnInit, OnDestroy {
  @Input() questionList;
  @Input() currUser: CurrentUserModel;
  subscription: Subscription;
  constructor(
    public readonly qaBankService: QaBankService,

    private readonly NewModalFactory: CustomModalService,
    private readonly utilsService: UtilsService,
    private readonly sweetAlertService: SweetAlertService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(change: SimpleChanges) {
    if (
      change?.questionList &&
      change?.questionList?.currentValue !== change?.questionList.previousValue
    ) {
      if (change?.questionList?.currentValue?.length) {
        this.questionList.forEach((question: Questions) => {
          question.rightIcons = this.getRightIconList(question);
        });
      }
    }
  }

  ngOnDestroy(): void {}

  handleSelection() {
    this.qaBankService.handleSelection();
  }

  getRightIconList(question: Questions): buttonList[] {
    let icons: buttonList[] = [];

    if (
      !question.response_is_na &&
      ![
        responseType.Grid,
        responseType.DynamicGrid,
        responseType.Attachment,
        responseType.Dropdown,
        responseType.CheckBox,
        responseType.aumTable,
        responseType.ReturnTable,
        responseType.Bookends,
      ].includes(question.response_type)
    ) {
      if (question.response_text)
        icons.push(questionCardIcons('copy', question));
      icons.push(questionCardIcons('add', question, this.currUser));

      // Check if there are comments/trackChanges in response_text
      if (
        question.response_type === responseType.TextMultiLine &&
        this.utilsService.hasCommentsOrTrackChanges(question.response_text)
      ) {
        question.hasActiveComments = true;
        question.response_text = this.utilsService.stripCommentsAndTrackChanges(
          question.response_text
        );
        question.response_text_copy = question.response_text;
      }
    }

    icons.push(questionCardIcons('notes', question));
    icons.push(questionCardIcons('ban', question, this.currUser));
    icons.push(questionCardIcons('viewSimilarQuestion'));
    icons.push({
      ...questionCardIcons('viewInProjectFormat'),
      link: this.qaBankService.getProjectViewLink(question),
    });
    return icons;
  }
  addNewQuestion(question) {
    const addQuestion = () => {
      this.NewModalFactory.invoke('add-to-preapproved', {
        initialState: {
          source: 'project_history',
          qa: [question],
          onSuccess: () => {},
        },
        class: 'modal-md',
      });
    };

    if (question.hasActiveComments) {
      this.sweetAlertService
        .confirm({
          title: 'Are you sure to continue?',
          text: 'The response contains active review comments and/or suggestions. These will not be included when adding to the Library. Do you want to proceed?',
          confirmButtonText: 'Yes, continue',
          focusCancel: false,
        })
        .then((response: any) => {
          if (response.isConfirmed) {
            addQuestion();
          }
        });
    } else {
      addQuestion();
    }
  }
  handleRightIconClick(event) {
    const icon: buttonList = event.action;
    let question: Questions = event.question;

    switch (icon.key) {
      case 'copy':
        this.qaBankService.copyResponse(question);
        break;
      case 'ban':
        this.qaBankService.deactivateBulkResponse([question]);
        break;
      case 'add':
        this.addNewQuestion(question);
        break;
      case 'notes':
        this.qaBankService.addInternalNotes(question, () => {
          question.rightIcons = this.getRightIconList(question);
        });
        break;
      case 'viewSimilarQuestion':
        this.qaBankService.getViewSimilarQuestionsData(question);
        break;
    }
  }
}
