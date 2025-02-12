import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { QaBankService } from '../../service/qa-bank.service';
import { Questions, buttonList } from '../../types/qa-bank.model';
import { responseType } from 'src/app2/modules/template-builder/constants/responseType.constant';
import { questionCardIcons } from '../../constants/qa-bank-icons.contants';

@Component({
  selector: 'qa-archive',
  templateUrl: './qa-archive.component.html',
  styleUrls: ['./qa-archive.component.css'],
})
export class QaArchiveComponent implements OnChanges {
  @Input() questionList;
  subscription: Subscription;
  constructor(public readonly qaBankService: QaBankService) {}

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
  handleSelection() {
    this.qaBankService.handleSelection();
  }

  getRightIconList(question: Questions): buttonList[] {
    let icons: buttonList[] = [];

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
    )
      icons.push(questionCardIcons('copy', question));
    icons.push(questionCardIcons('notes', question));
    icons.push(questionCardIcons('unarchive'));
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
      case 'notes':
        this.qaBankService.addInternalNotes(question, () => {
          question.rightIcons = this.getRightIconList(question);
        });
        break;
      case 'viewSimilarQuestion':
        this.qaBankService.getViewSimilarQuestionsData(question);
        break;
      case 'unarchive':
        this.qaBankService.unArchiveQuestions([question]);
        break;
    }
  }
}
