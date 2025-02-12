import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { ClipBoardService } from 'src/app2/services/clipboard.service';
import { NestedQuestionsComponent } from '../../components/nested-questions/nested-questions.component';
import { UpdateActivePanelId } from '../../store/template-builder.action';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'configure-nested-logic',
  templateUrl: './configure-nested-logic.component.html',
  styleUrls: ['./configure-nested-logic.component.css'],
})
export class ConfigureNestedLogicComponent implements OnInit {
  @ViewChild(NestedQuestionsComponent, { static: false })
  nestedQuestionComponent: NestedQuestionsComponent;
  @Input() question: QuestionType & { isSelected: false } & any;
  loading = false;
  questionsLoading = false;
  questionCopy: QuestionType & { isSelected: false } & any;
  editActive: boolean = false;
  active = '';
  @Output() onEditSave = new EventEmitter();
  @Input() NewNestedAdded;
  nestedQuestionIcons = [];
  nestedQuestionActions = [];
  title = 'View Nested Logic Hierarchy';
  isAllNestedQuestionSelected = false;
  constructor(
    private panel: SidePanelService,
    private store: Store,
    public clipBoard: ClipBoardService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {}

  handleEditClick(question) {
    if (!question) {
      this.editActive = false;
      return;
    }
    this.editActive = false;
    setTimeout(() => (this.editActive = true), 0);
    question.attributes.isEditable = true;
    question.attributes.label = question.attributes.text;
    question.attributes.isSelected = false;
    question.attributes.parentID = question.parentID;
    question = question.attributes;
    this.questionCopy = { ...question };
  }

  handleNewNestedQuestionAdded(questionRules) {
    this.NewNestedAdded(questionRules);
  }

  handleOnCancelClick() {
    this.editActive = false;
    this.panel.close();
    this.store.dispatch(new UpdateActivePanelId(''));
  }
  handleOnCancelEditPanel(isTouched) {
    this.editActive = false;
    this.nestedQuestionComponent.editClicked = false;
  }
  handleOnSave() {
    this.editActive = false;
    this.nestedQuestionComponent.loadNestedQuestions(this.questionCopy.id);
    this.nestedQuestionComponent.editClicked = false;
  }

  handleOnIconClick(iconKey: string) {
    this.title = '';
    if (iconKey === `th`) {
      this.title = 'Reordering Nested Logic Hierarchy';
      this.nestedQuestionIcons = [];
      this.nestedQuestionActions = [
        {
          text: `Cancel`,
          type: `button`,
          name: `times`,
          key: 'cancel-th',
          class: 'flex-1 font-size-14 space-on-left-xxl',
          isPrimary: true,
          isDisabled: true,
          hide: false,
          tooltip: `Cancel Reordering`,
        },
        {
          text: ``,
          type: `icon`,
          key: 'cancel-th',
          name: 'times',
          class: 'flex-1 font-size-14',
          isPrimary: true,
          isDisabled: false,
          hide: false,
          tooltip: `Cancel`,
        },
      ];
      this.toggleReorder();
    } else if (iconKey === `copy`) {
      this.clipBoard.clearClipboardContent();
      this.nestedQuestionIcons = [];
      this.nestedQuestionComponent.handleCopyActionClick();
      this.nestedQuestionActions = [
        {
          text: `Copy-pasting Nested Login Hierarchy`,
          type: `checkbox`,
          key: `select-all`,
          value: false,
          class: ``,
          tooltip: null,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          isBold: false,
        },
        {
          text: `Copy`,
          name: `clone`,
          type: `button`,
          key: 'action-copy',
          class: 'font-size-14',
          isPrimary: true,
          isDisabled: true,
          hide: false,
          tooltip: `Copy Selected Question`,
        },
        {
          text: `Cancel`,
          type: `button`,
          name: `times`,
          key: 'cancel-copy',
          class: 'flex-1  font-size-14',
          isPrimary: true,
          isDisabled: true,
          hide: false,
          tooltip: `Cancel Copy-pasting`,
        },
        {
          key: `cancel-action-bulk`,
          type: `icon`,
          name: `times`,
          class: 'flex-1 font-size-14',
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Cancel`,
        },
      ];
      this.isAllNestedQuestionSelected = false;
      this.nestedQuestionComponent.selectAllQuestions(
        this.nestedQuestionComponent.nestedQuestions,
        false
      );
    } else if (iconKey === `cancel-copy`) {
      this.isAllNestedQuestionSelected = false;
      this.nestedQuestionComponent.handleCancelCopyClick();
      this.nestedQuestionComponent.selectAllQuestions(
        this.nestedQuestionComponent.nestedQuestions,
        false
      );
      this.setDefaults();
    } else if (iconKey === `action-copy`) {
      if (!this.nestedQuestionComponent.selectedItemsToCopy.length) {
        this.toastr.error('Please select at least one question');
        this.active = 'copy-action';
        return;
      }
      this.nestedQuestionComponent.handleCopySelectedItemsClick();
      this.setDefaults();
    } else if (iconKey === `paste`) {
      this.title = 'View Nested Logic Hierarchy';
      this.nestedQuestionComponent.handlePasteToClipboardClick(this.question);
      this.nestedQuestionActions = [];
    } else if (iconKey === `plus`) {
      this.title = 'View Nested Logic Hierarchy';
      this.nestedQuestionComponent.addChildToParentQuestion(this.question);
    } else if (iconKey === `cancel-th`) {
      this.setDefaults();
      this.toggleReorder();
    } else if (iconKey === 'cancel-action-bulk') {
      this.setDefaults();
      this.nestedQuestionComponent.handleCancelCopyClick();
    } else if (iconKey === `close-panel`) {
      this.handleOnCancelClick();
    } else if (iconKey === `action-select-all`) {
      this.selectAllQuestions();
    }
  }

  onNestedQuestionIconClick(data) {
    if (data?.name === 'branches') this.handleOnCancelEditPanel(null);
  }

  toggleReorder() {
    this.nestedQuestionComponent.isReOrderClicked =
      !this.nestedQuestionComponent.isReOrderClicked;
  }

  selectAllQuestions() {
    this.isAllNestedQuestionSelected = !this.isAllNestedQuestionSelected;
    this.nestedQuestionComponent.selectAllQuestions(
      this.nestedQuestionComponent.nestedQuestions,
      this.isAllNestedQuestionSelected
    );
  }

  toggleCopyQuestions() {
    if (this.nestedQuestionComponent.isCopyClicked) {
      this.nestedQuestionComponent.handleCancelCopyClick();
    } else {
      this.nestedQuestionComponent.handleCopyActionClick();
      this.nestedQuestionComponent.isReOrderClicked = false;
    }
  }
  setDefaults(isNestedQuestionsLoaded = false) {
    this.title = 'View Nested Logic Hierarchy';
    this.nestedQuestionActions = [];
    this.isAllNestedQuestionSelected = false;
    let copiedItems = this.clipBoard.getClipboardContent();

    this.nestedQuestionIcons = [
      {
        name: 'plus',
        key: 'plus',
        isDisabled: false,
        isPrimary: false,
        tooltip: 'Add nested question',
      },

      {
        name: 'close',
        key: 'close-panel',
        isDisabled: false,
        isPrimary: false,
        tooltip: 'Close',
      },
    ];
    let canPerform = [];
    if (this.nestedQuestionComponent?.nestedQuestions?.length) {
      canPerform = [
        {
          name: 'clone',
          key: 'copy',
          isDisabled: false,
          isPrimary: false,
          tooltip: 'Copy questions',
        },
        {
          name: 'th',
          key: 'th',
          isDisabled: false,
          isPrimary: false,
          tooltip: 'Reorder',
        },
      ];
      if (copiedItems.length && copiedItems[0].parentID != this.question.id) {
        canPerform.push({
          name: 'Paste-from-clipboard',
          key: 'paste',
          isDisabled: false,
          isPrimary: false,
          tooltip: 'Paste question(s)',
        });
        this.nestedQuestionIcons.splice(1, 0, ...canPerform);
      } else {
        this.nestedQuestionIcons.splice(1, 0, ...canPerform);
      }
    } else {
      if (copiedItems.length && copiedItems[0].parentID != this.question.id) {
        canPerform.push({
          name: 'Paste-from-clipboard',
          key: 'paste',
          isDisabled: false,
          isPrimary: false,
          tooltip: 'Paste question(s)',
        });
        this.nestedQuestionIcons.splice(1, 0, ...canPerform);
      }
    }
  }

  handleQuestionSelectionChange(isAllQuestionSelected: boolean) {
    this.nestedQuestionActions.find((x) => x.type === 'checkbox').value =
      isAllQuestionSelected;
  }
}
