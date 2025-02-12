import { Component, OnDestroy, OnInit } from '@angular/core';
import { TemplateState } from '../../store/template-builder.state';
import { Select, Store } from '@ngxs/store';
import {
  GetCategories,
  GetQuestions,
} from '../../store/template-builder.action';
import { DefaultQuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.util';
import { UserState } from 'src/app2/store/user/user.state';
import { skip, take, takeUntil } from 'rxjs/operators';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { RouterService } from 'src/app2/services/router.service';
import {
  getQuestionsWithNestedObject,
  isPreviewNestedQuestionValid,
} from '../../util/template-preview.util';
import { TemplatePreviewService } from '../../service/template-preview.service';
import { DropdownDefault } from 'src/app2/modules/questionnaire/constants/questions-container.constant';
import { UtilsService } from 'src/app2/services/utils.service';
import { Subject } from 'rxjs/internal/Subject';
import { ActivatedRoute } from '@angular/router';
import { AutoScrollServiceService } from 'src/app2/services/auto-scroll-service.service';

@Component({
  selector: 'template-preview',
  templateUrl: './template-preview.component.html',
  styleUrls: ['./template-preview.component.css'],
})
export class TemplatePreviewComponent implements OnInit, OnDestroy {
  categoryData: any = [];
  questionData = [];
  questionDuplicate = [];
  activeSectionId = 0;
  @Select(TemplateState.getCategoriesData) categories;
  @Select(TemplateState.getSectionQuestionData) questions;
  @Select(TemplateState.getCategoryLoading) categoryLoading;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(TemplateState.getTemplate) getTemplate;
  subCatTitle = '';
  firmPreferences;
  questionsLoading;
  allIds = [];
  subCatHintText;
  activeSection;
  activeCategory;
  param;
  sequenceDropdown: any = [];
  catLoading = true;
  disabled = false;
  ngUnsubscribe = new Subject<void>();
  parentQuestionCount = 0;
  duplicateId: any;
  constructor(
    private store: Store,
    private template: TemplateService,
    private readonly routerService: RouterService,
    private readonly previewService: TemplatePreviewService,
    private readonly util: UtilsService,
    private routerState: ActivatedRoute,
    private autoScroll: AutoScrollServiceService
  ) {}

  ngOnInit(): void {
    this.getTemplate.pipe(skip(1), take(2)).subscribe((id) => {
      if (id) this.store.dispatch(new GetCategories());
    });
    this.categoryLoading
      .pipe(skip(1), takeUntil(this.ngUnsubscribe))
      .subscribe((loading) => {
        this.catLoading = loading;
      });
    this.param = JSON.parse(JSON.stringify(this.routerState.snapshot.params));
    this.param['#'] = this.routerState.snapshot.fragment;
    this.questionsLoading = true;
    this.firmPref.pipe(take(2)).subscribe((firmPreferences) => {
      this.firmPreferences = firmPreferences;
    });
    this.autoScroll.afterScrollEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        if (value) {
          this.duplicateId = null;
        }
      });

    this.questions
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((questions) => {
        if (questions && this.activeSectionId in questions) {
          let localQuestion = JSON.parse(
            JSON.stringify(questions[this.activeSectionId])
          );
          this.allIds = [];
          this.questionData = Object.values(localQuestion).map(
            (ques: any, index) => {
              ques['icons'] = {
                leftIcons: [],
                rightIcons: [],
                leftLinks: [],
                rightLinks: [],
              };
              ques = {
                ...ques,
                index: index,
                nestedQuestions: [],
                sequenceIndex: 1,
                answer: {
                  attributes: DefaultQuestionState(),
                },
                showComment: false,
              };
              if (ques?.id) this.allIds.push(ques.id);
              return ques;
            }
          );
          this.questionData = this.util
            .sortByKey(this.questionData, 'destination_index')
            .map((question, index) => ({ ...question, index: index }));
        }
      });
    this.categories.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data) => {
      if (data) {
        this.catLoading = false;
        let cat = Object.values(JSON.parse(JSON.stringify(data)));
        if (!cat.length) {
          this.questionsLoading = false;
          this.disabled = true;
        }
        cat = this.util.sortByKey(cat, 'destination_index');
        this.categoryData = cat.map((val: any) => {
          if (!this.activeCategory) {
            this.activeCategory = val;
          }
          if (
            this.param['#'] &&
            Object.keys(this.param['#']).length &&
            !this.activeSectionId
          ) {
            this.activeSectionId = this.param['#']?.split('child_section_')[1];
            this.setActiveSection(val.list[this.activeSectionId]);
            this.getQuestions();
          }
          let list: any = Object.values(val.list);
          if (!this.activeSectionId) {
            this.setActiveSection(list[0]);
            this.getQuestions();
          }
          list = this.util.sortByKey(list, 'destination_index');
          val.list = list;
          return val;
        });
      }
    });
  }

  handleSubCatClick({ catData, currentActivesection }) {
    if (this.activeSectionId !== currentActivesection.id) {
      this.routerService.navigateWithParams('app.diligence.template.preview', {
        templateId: this.param.templateId,
        '#': `child_section_${currentActivesection.id}`,
      });
      this.setActiveSection(currentActivesection);
      this.getQuestions();
    }
  }

  handleScrollChange(scrollObject) {
    this.questionDuplicate = scrollObject.list;
  }

  handleOnChange({ isError, value, type }, question) {
    this.previewService.updateLocalData(value, type, question);
    if (question.nestedQuestions.length)
      this.updatNestedViewLogic(question.nestedQuestions, question);
  }

  getQuestions() {
    if (!this.activeSectionId) {
      this.questionsLoading = false;
      return;
    }
    this.questionsLoading = true;
    this.store
      .dispatch(
        new GetQuestions({
          IncludeNestedQuestions: true,
          sectionId: this.activeSectionId,
        })
      )
      .subscribe(async () => {
        let nestedQuestions: any = [];
        if (this.allIds.length) {
          try {
            nestedQuestions = await this.template
              .getAllNestedRules(this.param.templateId, this.allIds)
              .toPromise();
          } catch (error) {
            this.questionsLoading = false;
            this.updateNestedQuestions([]);
          }
        }
        this.updateNestedQuestions(nestedQuestions);
        this.questionsLoading = false;
      });
  }

  updateNestedQuestions(nestedQuestions) {
    this.questionData = getQuestionsWithNestedObject(
      nestedQuestions,
      this.questionData
    );
    this.parentQuestionCount = this.questionData ? this.questionData.length : 0;
    this.questionData = this.util
      .sortByKey(this.questionData, 'destination_index')
      .map((question, index) => ({ ...question, index: index }));
  }

  updatNestedViewLogic(questions, parent) {
    questions.forEach((nested) => {
      nested.nestedID.isValid = isPreviewNestedQuestionValid(
        parent,
        nested.operatorID,
        nested.value
      );
      this.updatNestedViewLogic(
        nested.nestedID.nestedQuestions,
        nested.nestedID
      );
    });
  }

  handleSequenceClick(icon) {
    switch (icon.key) {
      case 'more':
        if (this.sequenceDropdown[0].key === 'none')
          this.sequenceDropdown.shift();
        let randomId = Math.random();
        let localData = JSON.parse(
          JSON.stringify(this.questionData.filter((ques) => !ques?.sequenceID))
        );
        const temp =
          this.questionData[this.questionData.length - 1].sequenceIndex;
        localData = localData.map((question, index) => {
          question = {
            ...question,
            index: index,
            isSequence: true,
            sequenceIndex:
              this.questionData[this.questionData.length - 1].sequenceIndex + 1,
            sequenceID: randomId,
            assignedUser: {
              attributes: {
                assigned_to: null,
              },
            },
            answer: {
              attributes: DefaultQuestionState(),
            },
          };
          if (question.nestedQuestions.length) {
            this.copyNestedViewLogic(question.nestedQuestions, randomId);
          }
          return question;
        });
        this.questionData = [...this.questionData, ...localData];
        this.sequenceDropdown.splice(this.sequenceDropdown.length - 1, 0, {
          label: `${this.subCatTitle} (#${this.sequenceDropdown.length})`,
          key: `${randomId}`,
          rightIcon: 'trashcan',
          class: 'justify-space-between',
          sequenceIndex: temp,
        });
        this.duplicateId = temp;
        return;
      default:
        this.duplicateId = icon.sequenceIndex;
        return '';
    }
  }

  handleSequenceIconClick(icon) {
    this.sequenceDropdown = this.sequenceDropdown.filter(
      (val) => val.key !== icon.key
    );
    this.questionData = this.questionData.filter(
      (val) => val.sequenceID != icon.key
    );
    if (this.sequenceDropdown.length == 1)
      this.sequenceDropdown = [...DropdownDefault];
  }

  copyNestedViewLogic(questions, randomId) {
    questions?.forEach((nested) => {
      nested.nestedID = {
        ...nested.nestedID,
        isSequence: true,
        sequenceID: randomId,
        isValid: false,
        assignedUser: {
          attributes: {
            assigned_to: null,
          },
        },
        answer: {
          attributes: DefaultQuestionState(),
        },
      };
      this.copyNestedViewLogic(nested.nestedID.nestedQuestions, randomId);
    });
  }

  setActiveSection(section) {
    this.activeSection = section;
    this.activeSectionId = section?.id;
    this.subCatTitle = section?.name;
    this.subCatHintText = section?.headerText;
    if (section?.isMultiple) {
      this.sequenceDropdown = [...DropdownDefault];
    } else {
      this.sequenceDropdown = [];
    }
  }

  goToAddQuestions() {
    this.routerService.navigateWithParams(
      'app.diligence.template.categories.subcategories.questions',
      {
        categoryId: this.activeSection.parentID,
        subcategoryId: this.activeSection.id,
        templateId: this.param.templateId,
      },
      {
        queryParams: {
          addNewQuestion: true,
        },
      }
    );
  }

  gotoAddCategory() {
    this.routerService.navigateWithParams(
      'app.diligence.template.categories',
      {
        templateId: this.param.templateId,
      },
      {
        queryParams: {
          addNew: true,
        },
      }
    );
  }

  goToAddSubCategory() {
    this.routerService.navigateWithParams(
      'app.diligence.template.categories.subcategories',
      {
        categoryId: this.activeCategory.id,
        templateId: this.param.templateId,
      },
      {
        queryParams: {
          addNewSubcategory: true,
        },
      }
    );
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
