import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Questions, buttonList } from '../../types/qa-bank.model';
import { diligenceStatusConstant } from 'src/app2/shared/constants/constant';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { ResponseType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { responseTypeExplanation } from 'src/app2/modules/template-builder/constants/responseType.constant';

@Component({
  selector: 'question-container',
  templateUrl: './question-container.component.html',
  styleUrls: ['./question-container.component.css'],
})
export class QuestionContainerComponent implements OnInit, OnChanges {
  @Input() question: Questions; // question that is to be displayed
  @Input() index; // index of the question in the array
  @Input() deactivateButton: boolean = true; // to show deactivate button
  @Input() questionDropdownList: any[] = []; // action icons that needs to be displayed
  @Input() type: 'qaBank' | 'duplicatesMain' | 'duplicatesSecondary' = 'qaBank';
  @Input() isCheckBox: boolean = true;
  @Input() rightIconList: buttonList[];
  @Input() showMetaData: boolean = true;

  colorTheme = ColorTheme;
  diligenceStatus = diligenceStatusConstant;
  rightIconsDropdown: buttonList[] = [];
  responseTypes = ResponseType;
  responseTypeExplanation = responseTypeExplanation;
  @Output() selectedChange = new EventEmitter(); // when selected questions are changed
  @Output() onQuestionDropdownList = new EventEmitter(); // when selected questions are changed
  @Output() onEditPreapprovedQuestion = new EventEmitter();
  @Output() onDeactivateQuestion = new EventEmitter();
  @Output() onActionButtonClick = new EventEmitter();
  @Output() onDuplicateClick = new EventEmitter();

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.rightIconList &&
      changes?.rightIconList.currentValue !==
        changes?.rightIconList.previousValue
    ) {
      if (this.rightIconList.length > 5)
        this.rightIconsDropdown = this.rightIconList.splice(4).map((icon) => {
          let label = icon.label;
          if (icon.count) label = `${icon.label}(${icon.count})`;
          return { ...icon, label, key: icon.key };
        });
    }
  }

  ngOnInit(): void {}

  handleQuestionDropdown(option, question) {
    this.onQuestionDropdownList.emit({ option, question });
  }

  editPreapprovedQuestion() {
    this.onEditPreapprovedQuestion.emit(this.question);
  }

  handleSelection() {
    this.selectedChange.emit();
  }

  deactivateResponse() {
    this.onDeactivateQuestion.emit({
      question: this.question,
      index: this.index,
    });
  }

  handleAction(action: buttonList) {
    this.onActionButtonClick.emit({ action, question: this.question });
  }

  handleDuplicateClick() {
    this.onDuplicateClick.emit();
  }

  getDate(dateString) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parts[2];
      const month = parts[0];
      const day = parts[1];
      return `${year}-${month}-${day}`;
    } else {
      return 'Invalid Date';
    }
  }
}
