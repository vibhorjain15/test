import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { DefaultQuestionState } from 'src/app2/modules/questionnaire/store/questionnaire.util';
import { getQuestionsWithNestedObject } from 'src/app2/modules/template-builder/util/template-preview.util';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { TemplateService } from 'src/app2/apis/template/template.service';
@Component({
  selector: 'app-view-question-tags',
  templateUrl: './view-question-tags.component.html',
  styleUrls:['./view-question-tags.component.css']
})
export class ViewQuestionTagsComponent implements OnInit {
  @Input() template: any;
  @Input() onSuccess;
  selectedTotalScore;
  questionTags = [];
  selectedTab = 'QuestionTags';
  newRatingArray: {};
  customTagsArr = [];
  sections = [];
  isAbsolute = false;
  loading = true;
  ratingTags = [];
  selectedSection = null;
  Restangular: any;
  questionTagsCopy: any;
  loading_custom_fields: boolean;
  selectedRatingScheme: any;
  custom_fields: any;
  searchText = '';
  selectedCategory: any;
  selectedSubcategory: { active: boolean };
  catexpanded = false;
  allQuestions = {};
  allIds: any[];
  sectionsCopy = [];
  allQuestionsLoading = {};
  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly customModalService: CustomModalService,
    private readonly util: UtilsService,
    private TemplateService: TemplateService,
  ) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    if (this.template != null) {
      this.getQuestions(this.template.id);
    }
    this.getCustomTags();
  }
  isLastOneOpen = false;
  isLastOneOpenEvent(event) {
    this.isLastOneOpen = event;
  }
  getQuestions(template_id: any) {
    this.http
      .get(`questions?template_id=${template_id}`)
      .subscribe((response: any) => {
        if(response?.length){
        this.questionTags = response;
        this.questionTags.sort((a, b) => a.text.localeCompare(b.text));
        this.sections = this.getSections();
        this.sections.forEach((section) => {
          this.allQuestionsLoading[section.id] = true;
          this.getQuestionsWithTemplateId(section.id,template_id)
        });
        this.getRatingScheme();
        this.questionTagsCopy = JSON.parse(JSON.stringify(this.questionTags));
        this.sectionsCopy=this.sections;
      }else{
        this.loading=false;
      }
      },(error: any) => {
        this.loading = false;
      });
  }
  getQuestionsWithTemplateId(sectionId,templateId) {
    this.TemplateService
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
        questionData.forEach((everyQuestionTag: any) => {
          everyQuestionTag.copyKey =
            '{{' + this.template.id + '_' + everyQuestionTag.group_id + '_1}}';
          everyQuestionTag.copyCommentKey =
            '{{comment_' +
            this.template.id +
            '_' +
            everyQuestionTag.group_id +
            '_1}}';
        })
        this.allQuestions[sectionId] = questionData;
        if (this.allIds.length) {
          this.TemplateService
            .getAllNestedRules(
              templateId,
              this.allIds
            )
            .subscribe((nestedQuestions) => {
              this.allIds = [];
              this.updateNestedQuestions(sectionId, nestedQuestions);
            },(error: any) => {
              this.loading = false;
            });
        }
      },(error: any) => {
        this.loading = false;
      });
  }
  handleOnChange(question) {
    if (question.nestedQuestions.length)
      this.updatNestedViewLogic(question.nestedQuestions,question.clicked);
  }

  updateNestedQuestions(sectionId, nestedQuestions) {
    let questionData = getQuestionsWithNestedObject(
      nestedQuestions,
      this.allQuestions[sectionId]
    );
    questionData = this.util.sortByKey(questionData, 'destination_index');
    this.allQuestions[sectionId] = JSON.parse(JSON.stringify(questionData));
    this.allQuestionsLoading[sectionId] = false;
    this.loading = Object.values(this.allQuestionsLoading).includes(true);
  }

  updatNestedViewLogic(questions,clicked) {
    questions.forEach((nested) => {
      nested.nestedID.isValid = clicked;
    });
  }

  goToTemplateView() {
    this.onSuccess();
    return this.close();
  }
  close(arg: string = '') {
    this.customModalService.close();
  }

  filtersQuestionTags() {
    if (this.selectedSection) {
      let item = this.sections.filter(
        (section) =>
          section.id === this.selectedSection
      );
      this.sectionsCopy=item;
    }
  }


  getCopyParams(value: string) {
    const params: any = {};
    if (this.isAbsolute) {
      params.copyKey = '{{rating_' + value + '_1}}';
      params.copyKeyName = '{{ratingname_' + value + '_1}}';
    } else {
      params.copyKey = '{{score_' + value + '_1}}';
      params.copyKeyName = '{{ratingname_' + value + '_1}}';
      params.copyKeyColor = '{{rating_' + value + '_1}}';
    }
    return params;
  }

  getRatingTags() {
    this.http
      .get(`reports/new/rating_tags?template_id=${this.template.id}`)
      .subscribe((response: Array<any>) => {
        this.ratingTags = response;
        for (var category of this.ratingTags) {
          category.copyParams = this.getCopyParams(category.group_id);
          if (category.ratings && category.ratings.length) {
            for (const subCategory of category.ratings) {
              subCategory.copyParams = this.getCopyParams(subCategory.group_id);
              if (subCategory.ratings.length) {
                subCategory.ratings.map(
                  (question: { copyParams: {}; group_id: any }) =>
                    (question.copyParams = this.getCopyParams(
                      question.group_id
                    ))
                );
              }
            }
          }
        }
      });
  }

  getRatingScheme() {
    this.loading_custom_fields = true;
    this.http
      .get(
        `templates/${this.template.id}/versions/${this.template.version}/TemplateRatingSchemeMappings`
      )
      .subscribe(
        (response: any) => {
          if (response.length > 0) {
            this.selectedRatingScheme = response[0];
            if (this.selectedRatingScheme.rating_scale_mode === 'Absolute') {
              this.isAbsolute = true;
            }
            this.getCustomFields(this.selectedRatingScheme.rating_scheme_id);
            this.getRatingTags();
          } else {
            this.selectedRatingScheme = null;
            this.loading_custom_fields = false;
          }
        },
        (error: any) => {
          this.loading = false;
          return (this.loading_custom_fields = false);
        }
      );
  }

  getCustomFields(id: any) {
    const params = {
      schema_type: 'rating',
      entity_id: id,
    };
    return this.http
      .post('service/dvapi_service/get_custom_fields', params)
      .subscribe(
        (response: { custom_fields: { rating: any } }) => {
          this.custom_fields = response.custom_fields.rating;
          return (this.loading_custom_fields = false);
        },
        (error: any) => {
          return (this.loading_custom_fields = false);
        }
      );
  }

  getCustomTags() {
    this.http
      .get('reports/new/custom_tags')
      .subscribe((response: Array<any>) => {
        this.customTagsArr = response;
        this.customTagsArr.sort((a, b) => a.item1.localeCompare(b.item1));
        Array.from(this.customTagsArr).map(
          (everyCustomTag: { item4: string; copyKey: string; item2: string }) =>
            everyCustomTag.item4 === 'Report'
              ? (everyCustomTag.copyKey = '{{' + everyCustomTag.item2 + '}}')
              : (everyCustomTag.copyKey =
                  '{{' + this.template.id + '_' + everyCustomTag.item2 + '_1}}')
        );
      });
  }

  copyTags(type: string) {
    const message = type + ' tag(s) successfully copied';
    this.toaster.success('', message);
  }

  getCopyText(
    tag: { id: string; sectionID: string; value: string },
    type: string
  ) {
    let text = '';
    if (type === 'QuestionTags') {
      text = '{{' + this.template.id + '_' + tag.id + '_1}}';
    } else if (type === 'ReportTags') {
      text = '{{' + this.template.id + '_' + tag.sectionID + '_1}}';
    } else if (type === 'CustomTags') {
      text = '{{' + this.template.id + '_' + tag.value + '_1}}';
    }
    text;
  }

  setActiveTab(active_tab: any) {
    this.searchText = '';
    this.selectedSection = null;
    this.selectedTab = active_tab;
    this.sectionsCopy=this.sections;
  }

  clearFilters() {
    this.selectedSection = null;
    this.searchText = '';
    this.sectionsCopy=this.sections;
  }

  getSections() {
    const arr = [];
    const dupes = [];
    for (let entry of Array.from(this.questionTags)) {
      if (dupes.indexOf(entry.sectionID) === -1) {
        arr.push({ id: entry.sectionID, name: entry.section_name });
        dupes.push(entry.sectionID);
      }
    }
    return arr;
  }

  selectCategory(category: any) {
    this.selectedTotalScore = null;
    if (this.selectedCategory) {
      this.selectedCategory.active = false;
    }
    category.active = true;
    this.selectedCategory = category;
    this.selectedSubcategory = category;
  }

  selectSubCategory(subCategory: { active: boolean }, category: any) {
    this.selectedTotalScore = null;
    if (this.selectedSubcategory) {
      this.selectedSubcategory.active = false;
    }
    subCategory.active = true;
    this.selectedSubcategory = subCategory;
    this.selectedCategory = category;
  }
  selectTotalScore() {
    this.selectedTotalScore = {};
    if (this.selectedCategory) {
      this.selectedCategory.active = false;
    }
    if (this.selectedSubcategory) {
      this.selectedSubcategory.active = false;
    }
    this.selectedTotalScore.copyParams = this.getCopyParams(
      `template_${this.template.id}_project`
    );
  }
}
