import {
  Component,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  EventEmitter,
  ElementRef,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import {
  DeleteQuestions,
  GetTemplateInfo,
  ToggleTemplateState,
  UpdateLocalQuestion,
} from '../../store/template-builder.action';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { ERROR_CODES, operatorList } from 'src/app2/shared/constants/constant';
import { ClipBoardService } from 'src/app2/services/clipboard.service';
import { RouterService } from 'src/app2/services/router.service';
import { handelConflict } from '../../store/template-builder.util';
import { ColorTheme } from 'src/app2/shared/themes/color.theme';
import { ActivatedRoute } from '@angular/router';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'nested-questions',
  templateUrl: './nested-questions.component.html',
  styleUrls: ['./nested-questions.component.css'],
})
export class NestedQuestionsComponent implements OnInit {
  @Input() question: QuestionType & { isSelected: false } & any;
  @Input() loading: boolean;
  responseData: any;
  questionsData: Array<QuestionType & { isSelected: false } & any> = [];
  questionsIncluded: Array<QuestionType & { isSelected: false } & any> = [];
  questionsDataCopy: Array<QuestionType & { isSelected: false } & any> = [];
  @Input() isInvestor = true;
  questionsIcons = {};
  nestedQuestions = [];
  isMultiSelect = false;
  isCopyClicked = false;
  isReOrderClicked = false;
  operatorIcons: any[] = [];
  opIconObject: any = {};
  copiedItems = [];
  parentQuestion: QuestionType & { isSelected: false } & any;
  pasteDisable = true;
  newPastedQuestions: any[] = [];
  nestedQuestionsLoading = false;
  editClicked = false;
  @Output() onEditClick = new EventEmitter();
  currentlyEditingQuestionId: any;
  @Output() onNewQuestionAdded = new EventEmitter();
  @Output() onQuestionLoaded? = new EventEmitter();
  @Output() isAllQuesitonSelected? = new EventEmitter();
  @Output() onIconClick = new EventEmitter();
  questionList: any[];
  previewData: any;
  newAr: any[] = [];
  responseIDs;
  dataToSend = [];
  selectedItemsToCopy = [];
  isValidPasteIcon = true;
  colorTheme = ColorTheme;
  localParams = null;
  constructor(
    private template: TemplateService,
    private store: Store,
    private readonly SweetAlert: SweetAlertService,
    private modal: CustomModalService,
    private toaster: ToastrService,
    private http: HttpClient,
    private elementRef: ElementRef,
    private clipBoard: ClipBoardService,
    private routerService: RouterService,
    private routerState: ActivatedRoute,
    private utils: UtilsService
  ) {}
  ngOnInit(): void {
    this.localParams = this.routerService.getState(this.routerState).params;
    this.loadNestedQuestions();
  }

  loadNestedQuestions(Id?) {
    this.handleIsValidPaste();
    this.parentQuestion = this.question;
    this.nestedQuestionsLoading = true;
    this.selectedItemsToCopy = this.clipBoard.getClipboardContent();
    this.template
      .getNestedQuestions(
        this.question.id,
        this.store.selectSnapshot((state) => state.template.templateId)
      )
      .subscribe((res) => {
        this.responseData = res;
        this.questionsData = res['data'];
        this.questionsIncluded = res['included'];
        this.questionsData.map((x, index) => {
          x.data = this.questionsIncluded[index];
          x.parentID = x.data.attributes.questionID;
          x.attributes.text = this.utils.getSafeHtml(x.attributes?.text);
          if (
            (x.parentID == this.question.id &&
              this.question.responseType === 'Date') ||
            x.data['attributes'].responseType == 'date'
          ) {
            x.data['attributes'].displayValue = new Date(
              x.data['attributes'].displayValue
            ).toDateString();
          }
        });
        this.getQuestionsIcons(this.questionsData);
        this.nestedQuestions = this.findFor(this.question.id);
        if (!this.nestedQuestions.length) {
          this.store.dispatch(
            new UpdateLocalQuestion(this.question.id, {
              nestingRuleIds: [],
            })
          );
        }
        this.addNestedIdsToQuestions(this.nestedQuestions);
        this.onQuestionLoaded.emit(true);
        setTimeout(() => {
          let AllDownloadLinks: any =
            this.elementRef.nativeElement.querySelectorAll('#attachmentUrl');
          AllDownloadLinks.forEach((element) => {
            element.addEventListener(
              'click',
              this.downloadAttachment.bind(this)
            );
          });
          if (Id) {
            this.showNestedQuestionInTree(Id);
          }
          this.nestedQuestionsLoading = false;
        }, 1000);
      });
    this.operatorIcons = operatorList;
    this.operatorIcons.map((x) => {
      this.opIconObject[x.id] = x;
    });
    let copiedItems = this.clipBoard.getClipboardContent();
    if (copiedItems?.length > 0 && copiedItems[0].parentID) {
      this.pasteDisable = copiedItems[0].parentID == this.parentQuestion.id;
    }
  }

  showNestedQuestionInTree(Id) {
    this.markParentsForSpecificLeaf(this.nestedQuestions, Id);
  }

  markParentsForSpecificLeaf(data, questionId: number): boolean {
    let isLeafFound = false;

    // Recursive function to find the target leaf and mark its parents
    function findAndMark(node, parent?): boolean {
      // Check if the current node matches the target and is a leaf
      if (
        node.id === questionId &&
        (!node.children || node.children.length === 0)
      ) {
        // Backtrack and mark all parent nodes
        let currentParent = parent;
        while (currentParent) {
          currentParent.isOpen = true;
          currentParent = currentParent.parent; // Move to the next ancestor
        }
        isLeafFound = true;
        return true;
      }

      // Recurse through children if available
      if (node.children) {
        for (const child of node.children) {
          child.parent = node; // Set parent reference for backtracking
          if (findAndMark(child, node)) return true;
        }
      }

      return false;
    }

    // Start traversal for all top-level nodes
    data.forEach((node) => findAndMark(node));

    // Cleanup: Remove temporary `parent` references
    data.forEach((node) => removeParentReferences(node));

    return isLeafFound;

    // Helper function to clean up the `parent` reference
    function removeParentReferences(node) {
      delete node.parent;
      if (node.children) {
        node.children.forEach((child) => removeParentReferences(child));
      }
    }
  }
  addNestedIdsToQuestions(nestedQuestions) {
    nestedQuestions.forEach((question) => {
      if (question.children.length) {
        question.attributes.nestingRuleIds = question.children.map(
          ({ id }) => id
        );
        this.addNestedIdsToQuestions(question.children);
      }
    });
  }

  handleIsValidPaste() {
    const parentQuestionToAddChild = this.question.id;
    let copiedContent = this.clipBoard.getClipboardContent();
    copiedContent.map((element) => {
      let temp = this.nestedQuestions.filter((e) => e.id == element.id);
      if (!temp.length && element.parentID == parentQuestionToAddChild)
        this.isValidPasteIcon = false;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.questionsData &&
      changes.questionsData.currentValue !== changes.questionsData.previousValue
    ) {
      this.questionsDataCopy = [...this.questionsData];
    }
  }

  handleReOrderClick() {
    this.isReOrderClicked = true;
  }
  handleCancelReOrderClick() {
    this.isReOrderClicked = false;
  }

  handleCopyActionClick() {
    this.isCopyClicked = true;
    this.isMultiSelect = true;
    this.getQuestionsIcons(this.questionsData);
  }

  handleCancelCopyClick() {
    this.isCopyClicked = false;
    this.isMultiSelect = false;
    this.selectedItemsToCopy = [];
    this.nestedQuestions.forEach((val) => {
      val.isSelected = false;
      return val;
    });
  }

  handlePasteToClipboardClick(parentQuestionToAddChild) {
    this.newPastedQuestions = [];
    let copiedContent = this.clipBoard.getClipboardContent();

    if (!this.pasteDisable) {
      if (copiedContent?.length > 0) {
        let temp: any[] = [];
        if (copiedContent[0].parentID) {
          let copy = JSON.parse(JSON.stringify(copiedContent));
          copy.map((element) => {
            temp = this.nestedQuestions.filter((e) => e.id == element.id);
            if (temp.length == 0) {
              if (element.parentID != parentQuestionToAddChild.id) {
                element.parentID = parentQuestionToAddChild.id;
                element.data.attributes.questionID =
                  parentQuestionToAddChild.id;
                this.newPastedQuestions.push(element);
              } else {
                this.toaster.info('Similar parent..');
              }
            } else {
              this.toaster.error(
                'item with similar id already exists in this question'
              );
            }
          });
          if (this.newPastedQuestions.length > 0) {
            this.dataToSend = [...this.newPastedQuestions];
            this.loading = true;
            this.modal.invoke('paste-nested-question', {
              initialState: {
                sectionId: this.question.sectionID,
                questionId: this.question.id,
                nestedQuestion: parentQuestionToAddChild,
                pastedQuestion: this.dataToSend,
                onAddingNested: () => {
                  this.loadNestedQuestions();
                },
              },
              class: 'modal-xl',
            });
            this.loading = false;
          }
        }
      }
    }
  }

  revertData(data) {
    data.forEach((val) => {
      val.children.length
        ? this.revertData(val.children)
        : this.newAr.push(val);
    });
  }

  handleCopySelectedItemsClick() {
    let selectedQuestions = [...this.selectedItemsToCopy];
    if (!selectedQuestions.length) return;
    this.copiedItems = [...selectedQuestions];
    this.clipBoard.setClipboardContent(this.copiedItems);
    if (this.copiedItems?.length > 0 && this.copiedItems[0].parentID) {
      this.pasteDisable =
        this.copiedItems[0].parentID == this.parentQuestion.id;
    }
    selectedQuestions = [];
    this.handleCancelCopyClick();
  }

  handleOnClick(event, question) {
    event.stopPropagation();
    if (question.isMultiSelect) question.isOpen = true;
    else question.isOpen = !question.isOpen;
  }

  selectAllChildren(data, value) {
    data.children.forEach((element) => {
      element.isSelected = value;
      if (element?.children?.length > 0) {
        this.selectAllChildren(element, value);
      }
    });
  }

  selectAllQuestions(data: Array<any>, isSelected: boolean) {
    data.forEach((question) => {
      question.isSelected = isSelected;
      if (isSelected) {
        this.selectedItemsToCopy.push(question);
      } else {
        this.selectedItemsToCopy.splice(
          this.selectedItemsToCopy.indexOf(data),
          1
        );
      }
      if (question?.children?.length > 0) {
        this.selectAllChildren(question, isSelected);
      }
    });
  }

  handleQuestionCheckbox(val, data) {
    data.isSelected = val;
    if (data?.children?.length > 0) {
      this.selectAllChildren(data, val);
    }
    if (val) {
      this.selectedItemsToCopy.push(data);
    } else {
      this.selectedItemsToCopy.splice(
        this.selectedItemsToCopy.indexOf(data),
        1
      );
    }
    this.getQuestionsIcons(this.questionsData);
    const isAllQuestionSelected = this.nestedQuestions.every(
      (x) => x.isSelected
    );
    this.isAllQuesitonSelected.emit(isAllQuestionSelected);
  }

  findFor(parentId) {
    let linearData = this.questionsData;
    // create a new array to store the result
    var NestedResult = [];

    // for each item in a
    for (var i = 0; i < linearData.length; i++) {
      // find all children of parentId
      if (linearData[i].parentID == parentId) {
        // recursively find children for each children of parentId
        var chidrenData = this.findFor(linearData[i].id);
        // if it has no children, skip adding the children prop
        var o =
          Object.keys(chidrenData).length === 0
            ? { children: [] }
            : { children: chidrenData.sort((a, b) => a.order - b.order) };
        NestedResult.push(Object.assign(o, linearData[i]));
      }
    }

    return NestedResult;
  }

  getQuestionsIcons(list) {
    this.questionsIcons = {};
    list.map((questions: QuestionType & any) => {
      let LocalIconsList = [];
      const { nestingRuleIds } = questions['attributes'];
      questions['attributes'].can_have_nested_question = ![
        'Bookends',
        'Grid',
        'CheckBox',
        'aumTable',
        'ReturnTable',
        'Identifier',
        'DynamicGrid',
        'Attachment',
      ].includes(questions['attributes'].responseType);
      questions['attributes'].can_have_formulas = ['Grid'].includes(
        questions['attributes'].responseType
      );
      LocalIconsList.push({
        name: 'pencil',
        tooltip: 'Edit',
      });
      LocalIconsList.push({
        name: 'trashcan',
        tooltip: 'Delete',
      });
      LocalIconsList.push({
        isDisabled: !questions['attributes'].can_have_nested_question,
        isactive: nestingRuleIds.length,
        name: 'branches',
        tooltip: questions['attributes'].can_have_nested_question
          ? 'Add nested question'
          : 'You cannot add nested question where response type is ' +
            this.generateIconTooltip(questions['attributes'].responseType),
      });
      let copiedItems = this.clipBoard.getClipboardContent();
      if (copiedItems.length && copiedItems[0].parentID != this.question.id) {
        LocalIconsList.push({
          isDisabled:
            !questions['attributes'].can_have_nested_question ||
            this.selectedItemsToCopy.length === 0 ||
            !this.isValidPasteIcon,
          name: 'Paste-from-clipboard',
          tooltip: questions['attributes'].can_have_nested_question
            ? this.selectedItemsToCopy.length
              ? 'Paste nested questions'
              : 'Please select at least one question'
            : 'You cannot paste nested child questions where response type is ' +
              this.generateIconTooltip(questions['attributes'].responseType),
        });
      }
      this.questionsIcons[questions.id] = LocalIconsList;
    });
    return list;
  }

  generateIconTooltip(responseType: string) {
    if (responseType === 'ReturnTable') return 'Track Record';
    if (responseType === 'Bookends') return 'Min Max Range';
    return responseType;
  }

  handleUpdateList(list, question, index) {
    if (
      !list[index] ||
      list[index].parentID != question.parentID ||
      index ==
        list.findIndex((i) => i.parentID == question.parentID && i.isNested)
    ) {
      return;
    }
    this.template
      .updateNestedQuetionIndex(
        list[index].attributes.sectionID,
        list[index].parentID,
        list[index].attributes.id,
        {
          responseType: list[index].attributes.responseType,
          destination_index: index,
        }
      )
      .subscribe(
        (res) => {
          this.store.dispatch(new GetTemplateInfo());
          this.store.dispatch(new ToggleTemplateState());
        },
        (error) => {
          if (error.status === ERROR_CODES.CONFLICT) {
            this.SweetAlert.error({
              title: error.error.message,
              confirmButtonText: 'Refresh',
            }).then((isConfirm) => {
              if (isConfirm.value && isConfirm.value == true) {
                this.routerService.navigateWithParams(
                  'app.diligence.template.preview',
                  {
                    templateId: this.localParams.templateId,
                  },
                  {
                    reload: true,
                  }
                );
              }
            });
          } else if (error.error && error.error.message) {
            this.SweetAlert.error({
              title: error.error.message,
              confirmButtonText: 'Okay',
            });
          }
        }
      );
    if (this.question.id == question.parentID) {
      this.nestedQuestions = list;
    } else {
      this.recursiveSeach(this.nestedQuestions, question.parentID, list);
    }
  }

  recursiveSeach(initialList, questionId, list) {
    initialList.forEach((val) => {
      if (val.id == questionId) {
        if (val.children.length > 0) {
          val.children = list;
        }
      } else {
        if (val?.children?.length > 0) {
          this.recursiveSeach(val.children, questionId, list);
        }
      }
    });
  }

  downloadAttachment(event) {
    const targetUrl = this.utils.extractDownloadUrl(event);
    this.utils.downloadAttachment(targetUrl);
  }

  extractText(questionTextWithHtml: string): string {
    if (!questionTextWithHtml) {
      return ''; // Return an empty string if input is null or undefined
    }

    // Use a regular expression to strip HTML tags
    const questionTextWithoutHtml = questionTextWithHtml.replace(
      /<\/?[^>]+(>|$)/g,
      ''
    );

    return questionTextWithoutHtml.trim(); // Remove leading/trailing whitespace
  }
  addChildToParentQuestion(question) {
    this.modal.invoke('new-question', {
      initialState: {
        sectionId: question.sectionID,
        nestedQuestion: question,
        onAddingNested: (res) => {
          this.loadNestedQuestions();
          let ruleObj = {
            parentId: question.id,
            nestedRuleIds: res,
          };
          this.onNewQuestionAdded.emit(ruleObj);
        },
      },
      class: 'modal-xl',
    });
  }

  handleIconClick(icon, question) {
    this.onIconClick.emit(icon);
    if (icon.name === 'trashcan') {
      this.SweetAlert.confirm({
        title: `Are you sure you want to delete this question ?`,
        confirmButtonText: 'Yes, delete it!',
        showLoaderOnConfirm: true,
        focusCancel: true,
        preConfirm: async () => {
          try {
            await this.store
              .dispatch(
                new DeleteQuestions(
                  question.attributes.sectionID,
                  question.id,
                  question.data.id // nested question id
                )
              )
              .toPromise();
            if (question.id == this.currentlyEditingQuestionId) {
              this.onEditClick.emit(null);
              this.editClicked = false;
              this.currentlyEditingQuestionId = null;
            }
            this.toaster.success('Question deleted successfully');
            this.loadNestedQuestions();
            this.SweetAlert.close();
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
    if (icon.name === 'pencil') {
      this.editClicked = true;
      this.currentlyEditingQuestionId = question.id;
      this.onEditClick.emit(question);
    }
    if (icon.name === 'Paste-from-clipboard' && !this.pasteDisable) {
      this.handlePasteToClipboardClick(question.attributes);
    }
    if (icon.name === 'branches') {
      this.modal.invoke('new-question', {
        initialState: {
          sectionId: question.attributes.sectionID,
          nestedQuestion: question,
          onAddingNested: (res) => {
            this.loadNestedQuestions(res[0]);
          },
        },
        class: 'modal-xl',
      });
    }
  }
}
