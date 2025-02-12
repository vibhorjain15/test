import { Component, OnDestroy, OnInit } from '@angular/core';
import { TemplateState } from '../../store/template-builder.state';
import { Select, Store } from '@ngxs/store';
import {
  GetCategories,
  SetTemplateId,
} from '../../store/template-builder.action';
import { DefaultQuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.util';
import { UserState } from 'src/app2/store/user/user.state';
import { skip, take, takeUntil } from 'rxjs/operators';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { RouterService } from 'src/app2/services/router.service';
import { getQuestionsWithNestedObject } from '../../util/template-preview.util';
import { UtilsService } from 'src/app2/services/utils.service';
import { Subject } from 'rxjs/internal/Subject';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'template-print-preview',
  templateUrl: './template-print-preview.component.html',
  styleUrls: ['./template-print-preview.component.css'],
})
export class TemplatePrintPreviewComponent implements OnInit, OnDestroy {
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
  questionsLoading = true;
  allIds = [];
  subCatHintText;
  activeSection;
  activeCategory;
  catLoading = true;
  disabled = false;
  ngUnsubscribe = new Subject<void>();
  allQuestions = {};
  allQuestionsLoading = {};
  isError = false;
  param = null;
  constructor(
    private store: Store,
    private template: TemplateService,
    private readonly routerService: RouterService,
    private readonly util: UtilsService,
    private routerState: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.param = this.routerService.getState(this.routerState).params;

    this.store.dispatch(new SetTemplateId(+this.param.templateId));
    this.getTemplate.pipe(take(2)).subscribe((id) => {
      if (id) this.store.dispatch(new GetCategories());
    });

    this.categoryLoading
      .pipe(skip(1), takeUntil(this.ngUnsubscribe))
      .subscribe((loading) => {
        this.catLoading = loading;
      });
    this.firmPref.pipe(take(2)).subscribe((firmPreferences) => {
      this.firmPreferences = firmPreferences;
    });
    this.categories.pipe(takeUntil(this.ngUnsubscribe)).subscribe((data) => {
      if (data) {
        this.catLoading = false;
        let cat: any = Object.values(JSON.parse(JSON.stringify(data)));
        cat = this.util.sortByKey(cat, 'destination_index');
        if (this.categoryData.length) return;
        this.categoryData = cat.map((val: any) => {
          let list: any = Object.values(val.list);
          list = this.util.sortByKey(list, 'destination_index');
          val.list = list;
          if (!val.list.length) {
            this.questionsLoading = false;
          }
          val.list.forEach((section) => {
            this.allQuestionsLoading[section.id] = true;
            this.getQuestions(section.id);
          });
          return val;
        });
        if (!cat.length) {
          this.questionsLoading = false;
          this.isError = true;
        }
      }
    });
  }

  getQuestions(sectionId) {
    this.template
      .getQuestions({
        IncludeNestedQuestions: true,
        sectionId: sectionId,
      })
      .subscribe(async (localQuestion: any) => {
        this.allIds = [];
        let destination_index = 0;
        let questionData = localQuestion.map((ques: any) => {
          ques['icons'] = {
            leftIcons: [],
            rightIcons: [],
            leftLinks: [],
            rightLinks: [],
          };
          ques = {
            ...ques,
            nestedQuestions: [],
            destination_index,
            answer: {
              attributes: DefaultQuestionState(),
            },
            showComment: false,
          };

          destination_index++;
          if (ques?.id) this.allIds.push(ques.id);
          return ques;
        });
        this.allQuestions[sectionId] = questionData;
        if (this.allIds.length) {
          this.template
            .getAllNestedRules(this.param.templateId, this.allIds)
            .subscribe((nestedQuestions) => {
              this.allIds = [];
              this.updateNestedQuestions(sectionId, nestedQuestions);
            });
        }
        this.allQuestionsLoading[sectionId] = false;
        this.questionsLoading = Object.values(
          this.allQuestionsLoading
        ).includes(true);
      });
  }

  updateNestedQuestions(sectionId, nestedQuestions) {
    let questionData = getQuestionsWithNestedObject(
      nestedQuestions,
      this.allQuestions[sectionId]
    );
    questionData = this.util.sortByKey(questionData, 'destination_index');
    questionData.forEach((question: any) => {
      if (question.nestedQuestions.length)
        this.updatNestedViewLogic(question.nestedQuestions);
    });
    this.allQuestions[sectionId] = JSON.parse(JSON.stringify(questionData));
  }

  updatNestedViewLogic(questions) {
    questions.forEach((nested) => {
      nested.nestedID.isValid = true;
      this.updatNestedViewLogic(nested.nestedID.nestedQuestions);
    });
  }

  goToAddQuestions(catId, secId) {
    this.routerService.navigateWithParams(
      'app.diligence.template.categories.subcategories.questions',
      {
        categoryId: catId,
        subcategoryId: secId,
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

  goToAddSubCategory(id) {
    this.routerService.navigateWithParams(
      'app.diligence.template.categories.subcategories',
      {
        categoryId: id,
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
