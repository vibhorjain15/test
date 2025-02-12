import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  DeleteQuestions,
  UpdateActivePanelId,
  UpdateActiveQuestionRow,
  UpdateQuestionList,
  UpdateTemplate,
} from '../../store/template-builder.action';
import { ToastrService } from 'ngx-toastr';
import { ModalService } from 'src/app2/services/modal.service';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { TemplateState } from '../../store/template-builder.state';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { Subscription } from 'rxjs';
import { handelConflict } from '../../store/template-builder.util';
import { RouterService } from 'src/app2/services/router.service';
import {
  ERROR_CODES,
} from 'src/app2/shared/constants/constant';
import { SidePanelname } from '../../constants/side-panel-name.constant';
import { TemplateSegmentComponent } from 'src/app2/shared/components';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'questions-list',
  templateUrl: './questions-list.component.html',
  styleUrls: ['./questions-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsListComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(TemplateSegmentComponent) dvSegment: TemplateSegmentComponent;
  @Input() questionsData: Array<QuestionType & { isSelected: false } & any> =
    [];
  @Input() loading = false;
  @Input() categoryList = [];
  @Input() isInvestor = true;
  @Input() activeRow = '';

  @Select(TemplateState.getSubCategoriesLength) subCat;
  @Select(TemplateState.getActivePanelId) activeQuestionId;
  isHighlighted: boolean = false;
  subVar: Subscription;
  scrollEv: Subscription;
  search = '';
  questionsDataCopy: Array<QuestionType & { isSelected: false } & any> = [];
  isMultiSelect = false;
  questionsIcons = {};
  editQuestionActiveId: any;
  pageNumber = 1;
  pageLimit = 50;
  sectionId;
  isSelectAll = false;
  actionIconsList = [];
  actionButtonsList = [];
  title = 'Questions';
  localParams = null;

  constructor(
    private panelService: SidePanelService,
    private store: Store,
    private readonly SweetAlert: SweetAlertService,
    private modal: CustomModalService,
    private oldModal: ModalService,
    private readonly toast: ToastrService,
    private template: TemplateService,
    private routerService: RouterService,
    private routerState: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.localParams = this.routerService.getState(this.routerState).params;
    this.questionsDataCopy = this.questionsData.filter(
      (v, index) => index < this.pageLimit
    );
    this.setDefaults();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.questionsData &&
      changes.questionsData.currentValue !== changes.questionsData.previousValue
    ) {
      this.pageNumber = 1;
      this.questionsData = this.questionsData.sort(
        (a, b) => a.destination_index - b.destination_index
      );
      this.questionsDataCopy = this.questionsData.filter(
        (v, index) => index < this.pageLimit
      );
      this.isMultiSelect = false;
      this.setDefaults();
      this.getQuestionsIcons();
    }
  }

  getQuestionsIcons() {
    this.subVar = this.activeQuestionId.subscribe((id) => {
      this.editQuestionActiveId = id;
    });

    this.sectionId = this.store.selectSnapshot(
      (state) => state.template.activeSection
    );
    this.questionsData.map((question: QuestionType & any) => {
      let LocalIconsList = [];
      const {
        responseType,
        isEditable,
        has_standardized_text,
        has_mapped_questions,
        nestingRuleIds,
        has_formulas,
      } = question;
      question.can_have_nested_question = ![
        'Bookends',
        'Grid',
        'CheckBox',
        'aumTable',
        'ReturnTable',
        'Identifier',
        'DynamicGrid',
        'Attachment',
      ].includes(question.responseType);
      question.can_have_formulas = ['Grid', 'DynamicGrid'].includes(
        question.responseType
      );

      if (responseType === 'TextMultiLine' && this.isInvestor) {
        LocalIconsList.push({
          isactive: has_standardized_text,
          name: 'standard-text',
          tooltip:
            'Configure Smart Text (to be used with Analyst Evaluation DDQ)',
          isHighlighted:
            this.editQuestionActiveId == `${question.id}-set-smart-text`,
          iconClass: 'fa-lg',
        });
      }
      if (this.isInvestor) {
        LocalIconsList.push({
          isactive: has_mapped_questions,
          name: 'linked-items',
          tooltip: 'Configure Review Question Mapping',
          isHighlighted:
            this.editQuestionActiveId ==
            `${question.id}-configure-question-mapping`,
        });
      }
      if (question.can_have_nested_question) {
        question.isConditional = !!nestingRuleIds?.length;
        LocalIconsList.push({
          isactive: nestingRuleIds?.length,
          name: 'branches',
          tooltip: 'Configure Nesting Logic',
          isHighlighted:
            this.editQuestionActiveId ==
            `${question.id}-configure-nested-logic`,
        });
      }
      if (question.can_have_formulas) {
        LocalIconsList.push({
          isDisabled: !isEditable,
          isactive: has_formulas,
          name: 'formula',
          tooltip: isEditable
            ? 'Configure Formulas'
            : 'This is a system question & hence cannot be edited',
        });
      }
      LocalIconsList.push({
        isDisabled: !isEditable,
        name: 'pencil',
        tooltip: isEditable
          ? 'Edit'
          : 'This is a system question & hence cannot be edited',
        isHighlighted:
          `${question.id}-edit-question` == this.editQuestionActiveId,
      });
      LocalIconsList.push({
        isDisabled: this.questionsData.length == 1,
        name: 'trashcan',
        tooltip:
          this.questionsData.length == 1
            ? 'You cannot delete the only question in this subcategory'
            : 'Delete',
      });
      this.questionsIcons[question.id] = LocalIconsList;
    });
  }

  handleQuestionCheckbox(val, data) {
    data.isSelected = val;
    this.actionButtonsList.find((x) => x.type === 'checkbox').value =
      this.questionsDataCopy.every((x) => x.isSelected);
  }

  handleAddClick() {
    let sectionId = this.store.selectSnapshot(
      (state) => state.template.activeSection
    );
    if (!sectionId) {
      this.toast.info('Please preselect a sub-category to add new question');
      return;
    }
    this.modal.invoke('new-question', {
      initialState: {
        sectionId,
      },
      class: 'modal-xl',
    });
  }

  handleSearchChange(data) {
    this.search = data;
    if (!data) {
      this.questionsDataCopy = this.questionsData.filter(
        (v, index) => index < this.pageLimit
      );
    } else {
      this.questionsDataCopy = this.questionsData.filter((val) =>
        val.label
          .split('<separator>')[0]
          .toLowerCase()
          .includes(data.toLowerCase())
      );
    }
  }

  handleMoveClick(data) {
    this.isMultiSelect = data;
    if (!this.isMultiSelect) {
      this.questionsDataCopy.forEach((val) => {
        val.isSelected = false;
        return val;
      });
    }
  }

  handleSelectAllClick() {
    this.questionsDataCopy.forEach((val) => {
      val.isSelected = this.isSelectAll;
    });
    this.questionsData.forEach((val) => {
      val.isSelected = this.isSelectAll;
    });
  }

  handleUpdateList(list, index) {
    if (JSON.stringify(this.questionsData) === JSON.stringify(list)) return;
    this.questionsData = list;
    this.questionsDataCopy = list;

    this.template
      .updateQuetionListIndexAfterSort(list[index].sectionID, list[index].id, {
        responseType: list[index].responseType,
        destination_index: index,
      })
      .subscribe(
        (res) => {
          this.store.dispatch(
            new UpdateQuestionList(list, list[index].sectionID)
          );
        },
        (error) => this.handle409Error(error?.status, error?.error?.message)
      );
  }

  // this function executes when any link in the dropdown menu is clicked
  handleDropdownClick(data) {
    if (data.key == 'move') {
      this.moveQuestions();
    } else if (data.key == 'copy') {
      this.copyQuestions();
    }
  }

  // function for triggering move modal
  moveQuestions() {
    const selectedQuestions = this.questionsData.filter((question) => {
      if (question.isSelected) return true;
      else return false;
    });
    if (selectedQuestions.length > 0 && this.categoryList) {
      // this modal takes two types 1. Question , 2. sub-category
      this.modal.invoke('manage-move', {
        initialState: {
          type: 'question',
          selectedQuestions: selectedQuestions,
          CategoryList: this.categoryList,
        },
      });
    } else {
      this.toast.error('Please select atleast one question');
    }
  }

  copyQuestions() {
    const selectedQuestions = this.questionsData.filter((question) => {
      if (question.isSelected) return true;
      else return false;
    });
    if (selectedQuestions.length > 0 && this.categoryList) {
      this.modal.invoke('manage-move', {
        initialState: {
          type: 'question',
          isCopy: true,
          selectedQuestions: selectedQuestions,
          CategoryList: this.categoryList,
        },
      });
    } else {
      this.toast.error('Please select atleast one question');
    }
  }

  handleRowClick(question) {
    const activePanel = this.store.selectSnapshot(
      (state) => state.template.activePanelId
    );
    if (
      activePanel.includes(SidePanelname.configureNestedLogic) &&
      question.can_have_nested_question
    )
      this.handleIconClick({ name: 'branches' }, question);
    else if (activePanel.includes(SidePanelname.configureQuestionMapping))
      this.handleIconClick({ name: 'linked-items' }, question);
    else if (
      activePanel.includes(SidePanelname.setSmartText) &&
      question.responseType === 'TextMultiLine'
    )
      this.handleIconClick({ name: 'standard-text' }, question);
    else if (question.isEditable) {
      this.handleIconClick({ name: 'pencil' }, question);
    }
  }

  handleIconClick({ name: icon }, question) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    if (icon !== 'trashcan') {
      this.store.dispatch(new UpdateActiveQuestionRow(question.id));
    }
    if (icon === 'trashcan') {
      let entityScoreRules = this.store.selectSnapshot(
        (state) => state.template.entityScoreRules
      );

      this.SweetAlert.confirm({
        title: `Are you sure you want to delete this question ?`,
        text:
          entityScoreRules?.length > 0
            ? 'Deleting the question will also result in the deletion of all associated rules. This action is irreversible and cannot be undone.'
            : null,
        confirmButtonText: 'Yes, delete it!',
        showLoaderOnConfirm: true,
        focusCancel: true,
        preConfirm: async () => {
          try {
            await this.store
              .dispatch(new DeleteQuestions(question.sectionID, question.id))
              .toPromise();
            const templateData = this.store.snapshot();
            if (templateData.template.activeQuestionSection === question.id) {
              this.panelService.close();
              this.store.dispatch(new UpdateActivePanelId(''));
            }
            this.SweetAlert.close();
            this.store.dispatch(new UpdateTemplate({}));
            this.toast.success('Question deleted successfully');
          } catch (error) {
            handelConflict(
              error,
              this.localParams.templateId,
              this.SweetAlert,
              this.routerService,
              this.modal
            );
          }
        },
      });
    }
    if (icon === 'pencil') {
      this.store.dispatch(
        new UpdateActivePanelId(`${question.id}-edit-question`)
      );
      this.panelService.invoke('edit-question-panel', {
        question,
      });
    }
    if (icon === 'linked-items') {
      this.store.dispatch(
        new UpdateActivePanelId(`${question.id}-configure-question-mapping`)
      );
      this.panelService.invoke('configure-question-mapping', {
        question,
      });
    }
    if (icon === 'formula') {
      this.modal.invoke('formula-setup', {
        initialState: {
          question: question,
        },
        class: 'modal-lg',
      });
    }
    if (icon === 'standard-text') {
      this.store.dispatch(
        new UpdateActivePanelId(`${question.id}-set-smart-text`)
      );
      this.panelService.invoke('set-smart-text', {
        question,
      });
    }
    if (icon === 'branches') {
      this.store.dispatch(
        new UpdateActivePanelId(`${question.id}-configure-nested-logic`)
      );
      this.panelService.invoke('configure-nested-logic', {
        question,
        NewNestedAdded: (res: any) => {
          let Index = this.questionsData.findIndex(
            (question) => question.id == res.parentId
          );
          this.questionsData[Index].nestingRuleIds.push(...res.nestedRuleIds);
          this.questionsData = [...this.questionsData];
          this.store.dispatch(
            new UpdateQuestionList(
              this.questionsData,
              this.questionsData[Index].sectionID
            )
          );
        },
      });
    }
  }

  loadQuestions(event) {
    this.pageNumber = event.currentPage;
    this.questionsDataCopy.push(
      ...this.questionsData.slice(
        this.questionsDataCopy.length,
        event.currentPage * this.pageLimit
      )
    );
  }
  ngOnDestroy(): void {
    this.subVar.unsubscribe();
  }

  handle409Error(status, errorMessage) {
    this.loading = false;
    if (status === ERROR_CODES.BAD_REQUEST) {
      this.SweetAlert.error({
        title: errorMessage,
        confirmButtonText: 'Refresh',
      }).then((isConfirm) => {
        if (isConfirm.value) {
          this.routerService.navigateWithParams(
            'app.diligence.template.preview',
            { templateId: this.localParams.templateId },
            { reload: true }
          );
        }
      });
    } else if (errorMessage) {
      this.toast.error(errorMessage);
    }
  }

  handleActionIconClick(iconKey: ActionIcon) {
    this.title = '';
    if (iconKey === 'action-plus') {
      this.handleAddClick();
      this.setDefaults();
    } else if (iconKey === 'action-bulk') {
      this.actionIconsList = [];
      this.actionButtonsList = [
        {
          text: `Questions`,
          type: `checkbox`,
          isChecked: false,
          class: `space-on-left-lg`,
          tooltip: null,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          isBold: false,
        },
        {
          text: `Move`,
          type: `button`,
          name: `move`,
          key: 'action-move',
          class: `font-size-14`,
          isPrimary: true,
          isDisabled: true,
          hide: false,
          tooltip: `Move Selected Question`,
        },
        {
          text: `Copy`,
          type: `button`,
          name: `clone`,
          key: 'action-copy',
          class: 'flex-1 font-size-14',
          isPrimary: true,
          isDisabled: true,
          hide: false,
          tooltip: `Copy Selected Question`,
        },
        {
          key: `action-bulk-search`,
          type: `icon`,
          name: `search`,
          class: 'action-bulk-search',
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Search in questions`,
        },
        {
          key: `cancel-action-bulk`,
          type: `icon`,
          name: `times`,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Cancel`,
        },
      ];
      this.handleMoveClick('move');
    } else if (iconKey === 'cancel-action-bulk') {
      this.setDefaults();
    } else if (iconKey === 'action-move') {
      this.handleDropdownClick({ key: `move` });
    } else if (iconKey === 'action-copy') {
      this.handleDropdownClick({ key: `copy` });
    } else if (iconKey === 'action-select-all') {
      this.isSelectAll = !this.isSelectAll;
      this.handleSelectAllClick();
    } else if (iconKey === 'action-search') {
      this.actionButtonsList = [
        {
          key: `action-search`,
          type: `input-search`,
          class: `flex-1`,
          name: `search`,
          placeholder: 'Search question',
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Search in questions`,
        },
        {
          key: `cancel-action-search`,
          type: `icon`,
          name: `times`,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Cancel`,
        },
      ];
      this.actionIconsList = [];
    } else if (iconKey === 'action-bulk-search') {
      this.actionButtonsList.splice(3, 2, {
        key: `action-bulk-search`,
        type: `input-search`,
        placeholder: `Search questions`,
        name: `search`,
        isPrimary: false,
        isDisabled: false,
        hide: false,
        tooltip: `Search in questions`,
      });
    } else if (iconKey === 'cancel-bulk-search') {
      this.actionButtonsList.splice(
        3,
        2,
        {
          key: `action-bulk-search`,
          type: `icon`,
          name: `search`,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Search In Questions`,
        },
        {
          key: `cancel-action-bulk`,
          type: `icon`,
          name: `times`,
          isPrimary: false,
          isDisabled: false,
          hide: false,
          tooltip: `Close`,
        }
      );
    } else if (
      iconKey === 'cancel-action-search' ||
      iconKey === 'cancel-action-bulk'
    ) {
      this.setDefaults();
    }
  }

  setDefaults() {
    this.title = 'Questions';
    this.isSelectAll = false;
    this.isMultiSelect = false;
    this.handleSelectAllClick();
    this.actionButtonsList = [];
    this.actionIconsList = [
      {
        name: `plus`,
        key: `action-plus`,
        tooltip: `Add Question`,
        placement: `left`,
        iconClass: ``,
      },
    ];
    if (this.questionsData.length) {
      const canPerform = [
        {
          name: `move`,
          key: 'action-bulk',
          tooltip: `move`,
          iconClass: `move-icon-size`,
        },
        {
          name: `search`,
          key: 'action-search',
          tooltip: `Search`,
          iconClass: ``,
        },
      ];
      this.actionIconsList.splice(0, 0, ...canPerform);
    }
  }

  trackByFn(index, item) {
    return item.id;
  }
}

export type ActionIcon =
  | `action-plus`
  | `action-bulk`
  | `action-search`
  | `action-move`
  | `action-copy`
  | `action-select-all`
  | `action-bulk-search`
  | `action-search`
  | `cancel-action-bulk`;
