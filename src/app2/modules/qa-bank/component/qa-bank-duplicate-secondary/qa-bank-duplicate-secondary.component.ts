import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Questions } from '../../types/qa-bank.model';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { buttonList } from '../../types/qa-bank.model';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';

/*
This is second page in duplicates story, which deals with actions performed on duplicate questions,
Actions possible are :
1. Merge to primary ques
2. archive selected ques
3. Mark them not duplicate
Any action performed will be emitted back to parent component for any API calls and changes
*/
@Component({
  selector: 'qa-bank-duplicate-secondary',
  templateUrl: './qa-bank-duplicate-secondary.component.html',
  styleUrls: ['./qa-bank-duplicate-secondary.component.css'],
})
export class QaBankDuplicateSecondaryComponent implements OnInit, OnChanges {
  @Input() primaryQuestion: Questions; // Question selected in first page
  @Output() onViewChange = new EventEmitter(); // When user wants to go back to all questions view
  @Input() duplicates: Questions[] = []; // the whole duplicate list for ref
  semi_duplicates: Questions[] = []; // semi duplicate of primary ques
  exact_duplicate: Questions[] = []; // exact duplicate of primary ques
  selectedFrequency: 'none-selected' | 'all-selected' | 'few-selected' =
    'none-selected'; // check box selection
  selectedCount;
  deactivateButtonLoader: boolean = false;
  copyButtonLoader: boolean = false;
  mergeButtonLoader: boolean = false;
  notDuplicateButtonLoader: boolean = false;
  list: dvTabsList[] = [
    // dv tab list data
    {
      name: `Exact Duplicates (${this.exact_duplicate.length})`,
      active: true,
      condition: true,
      link: '',
      tooltip: 'Same questions and responses',
    },
    {
      name: `Semi Duplicates (${this.semi_duplicates.length})`,
      active: false,
      condition: true,
      link: '',
      tooltip: 'Same questions',
    },
  ];

  @Output() manageDuplicates = new EventEmitter();
  constructor(private readonly sweetAlert: SweetAlertService) {}

  ngOnInit(): void {
    if (!this.primaryQuestion.exact_duplicates.length) {
      this.list[0].active = false;
      this.list[1].active = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes &&
      (changes.duplicates || changes.primaryQuestion) &&
      (changes.primaryQuestion?.currentValue !==
        changes.primaryQuestion?.previousValue ||
        changes.duplicates?.currentValue.length !==
          changes.duplicates?.previousValue.length)
    ) {
      this.setDuplicates();
      this.clickedUnSelectAllQuestions();
      this.deactivateButtonLoader = false;
      this.copyButtonLoader = false;
      this.mergeButtonLoader = false;
      this.notDuplicateButtonLoader = false;
    }
  }

  handleBack() {
    this.clickedUnSelectAllQuestions();
    this.onViewChange.emit();
  }

  handleTabChange(index) {
    (this.list[0].active ? this.exact_duplicate : this.semi_duplicates).forEach(
      (question) => (question.isSelected = false)
    );

    this.list.forEach((tabs) => (tabs.active = false));
    this.list[index].active = true;
    this.selectedFrequency = 'none-selected';
    this.selectedCount = 0;
  }

  handleSelection() {
    this.checkIfAllSelected();
  }

  checkIfAllSelected() {
    this.getSelectedQuestionsCount();
    let count = 0;
    let activeList = this.list[0].active
      ? this.exact_duplicate
      : this.semi_duplicates;

    activeList.forEach((question) => {
      if (question.isSelected) {
        count = count + 1;
      }
    });

    if (count === activeList.length && activeList.length > 0) {
      this.selectedFrequency = 'all-selected';
    } else if (count > 0 && activeList.length > 0) {
      this.selectedFrequency = 'few-selected';
    } else {
      this.selectedFrequency = 'none-selected';
    }
  }

  getSelectedQuestionsCount() {
    this.selectedCount = (
      this.list[0].active ? this.exact_duplicate : this.semi_duplicates
    ).filter((ques) => ques.isSelected).length;
  }

  clickedSelectAllQuestions() {
    (this.list[0].active ? this.exact_duplicate : this.semi_duplicates).forEach(
      (question) => {
        question.isSelected = true;
      }
    );

    this.selectedFrequency = 'all-selected';
    this.selectedCount = (
      this.list[0].active ? this.exact_duplicate : this.semi_duplicates
    ).length;
  }

  clickedUnSelectAllQuestions() {
    (this.list[0].active ? this.exact_duplicate : this.semi_duplicates).forEach(
      (question) => {
        question.isSelected = false;
      }
    );
    this.selectedFrequency = 'none-selected';
    this.selectedCount = 0;
  }

  setDuplicates() {
    this.exact_duplicate = [];
    this.semi_duplicates = [];
    this.primaryQuestion.exact_duplicates.forEach((duplicateId) => {
      let exact_dup = this.duplicates.find(
        (question) => question.response_id === duplicateId
      );

      if (exact_dup) {
        exact_dup = JSON.parse(JSON.stringify(exact_dup));
        exact_dup.rightIcons = this.getActionList(exact_dup);
        this.exact_duplicate.push(exact_dup);
      }
    });
    this.primaryQuestion.semi_duplicates.forEach((duplicateId) => {
      let semi_dup = this.duplicates.find(
        (question) => question.response_id === duplicateId
      );

      if (semi_dup) {
        semi_dup = JSON.parse(JSON.stringify(semi_dup));
        semi_dup.rightIcons = this.getActionList(semi_dup);
        this.semi_duplicates.push(semi_dup);
      }
    });

    this.list[0].name = `Exact Duplicates (${this.exact_duplicate.length})`;
    this.list[1].name = `Semi Duplicates (${this.semi_duplicates.length})`;
  }

  findSelectedQuestions() {
    return JSON.parse(
      JSON.stringify(
        (this.list[0].active
          ? this.exact_duplicate
          : this.semi_duplicates
        ).filter((ques) => ques.isSelected)
      )
    );
  }

  handleDeactivate() {
    this.showAlert(
      'archive',
      'This will exclude them from Auto-fill, Q/A Search, and Suggested Responses.',
      (resolve) => {
        let selectedQuestions = this.findSelectedQuestions();
        this.manageDuplicates.emit({
          type: 'deactivate',
          duplicates: selectedQuestions,
          listOfQuestionInvolved: [
            ...this.semi_duplicates,
            ...this.exact_duplicate,
          ],
          resolve,
        });
      }
    );
  }

  handleMerge() {
    let text =
      'All tags and SMEs will be copied and added to the Primary Q/A. Then, it will archive the selected Q/As, excluding them from Auto-fill, Q/A Search, and Suggested Responses.';
    this.showAlert('merge & archive', text, (resolve) => {
      let selectedQuestions = this.findSelectedQuestions();
      this.manageDuplicates.emit({
        type: 'merge',
        duplicates: selectedQuestions,
        listOfQuestionInvolved: [
          ...this.semi_duplicates,
          ...this.exact_duplicate,
        ],
        resolve,
      });
    });
  }

  handleNotDuplicates() {
    let text =
      'This will mark the selected Q/As as not duplicates and it will not consider them as duplicates again. The Q/As will still be available for Auto-fill, Q/A Search, and Suggested Responses.';
    this.showAlert(
      'mark',
      text,
      (resolve) => {
        let selectedQuestions = this.findSelectedQuestions();
        this.manageDuplicates.emit({
          type: 'notDuplicate',
          duplicates: selectedQuestions,
          listOfQuestionInvolved: [
            ...this.semi_duplicates,
            ...this.exact_duplicate,
          ],
          resolve,
        });
      },
      'as not duplicates '
    );
  }

  handleActionButton({ action, question }) {
    if (action.key == 'copy to primary') {
      this.sweetAlert.confirm({
        title: 'Are you sure you want to make this Q/A the Primary Q/A?',
        customClass: ' ',
        preConfirm: () => {
          return new Promise<void>((resolve) => {
            this.copyButtonLoader = true;
            this.manageDuplicates.emit({
              type: 'copy',
              duplicates: [question],
              resolve,
            });
          });
        },
      });
    }
  }

  showAlert(
    type,
    text = 'It will archive these selected responses, and mark them as duplicates.',
    callback,
    type2 = ''
  ) {
    this.sweetAlert.confirm({
      title: `Are you sure you want to ${type} the selected Q/As ${type2}?`,
      text: text,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          callback(resolve);
        });
      },
    });
  }

  getActionList(question: Questions): buttonList[] {
    return [
      {
        name: 'Make Primary',
        key: 'copy to primary',
        type: 'transparent',
        tooltip:
          'Make this the Primary Q/A, then perform actions on its duplicates.',
        placement: 'left',
        color: ColorTheme.orange,
        noHoverColor: true,
        label: 'Make Primary',
      },
    ];
  }
}
