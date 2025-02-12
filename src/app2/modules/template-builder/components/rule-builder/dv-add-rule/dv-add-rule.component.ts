import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { forkJoin } from 'rxjs';
import { response_types_to_allow_for_score } from '../../../constants/responseType.constant';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { handelConflict } from '../../../store/template-builder.util';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { RouterService } from 'src/app2/services/router.service';
import { AdvancedRuleBuilderComponent } from '../advanced-rule-builder/advanced-rule-builder.component';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-dv-add-rule',
  templateUrl: './dv-add-rule.component.html',
  styleUrls: ['./dv-add-rule.component.css'],
})
export class DvAddRuleComponent implements OnInit {
  loading = false;
  templateId = 0;

  //Injected into the modal by parent component
  @Input() templateRatingSchemeMapping: any;
  @Input() ratingScaleDefinition: any;
  @Input() questionWiseOptionList: any;
  @Input() onSaveCallBack;
  @Input() allQuestions: any;
  @Input() title: string;
  @Input() ruleData: any;
  @Input() displayQuestions: any;
  ratingMode: any;
  questionsList: any = [];
  allQuestionList: any = {};
  categoryList: any[] = [];
  subCategoryList: any[] = [];
  template: any;
  createAnotherLoader = false;

  tabs = [
    // {
    //   name: 'Standard',
    //   id: 1,
    // },
    {
      name: 'Standard',
      id: 3,
    },
    {
      name: 'Advanced',
      id: 2,
    },
  ];

  selected_tab = 3;

  // @ViewChild('simpleRuleBuilder')
  // simpleRuleBuilderComponent: SimpleRuleBuilderComponent;
  @ViewChild('advancedRuleBuilder')
  advancedRuleBuilderComponent: AdvancedRuleBuilderComponent;
  @ViewChild('advancedRuleBuilder2')
  standard2RuleBuilderComponent: AdvancedRuleBuilderComponent;

  constructor(
    private store: Store,
    private readonly templateService: TemplateService,
    private SweetAlert: SweetAlertService,
    private routerService: RouterService,
    private readonly modalService: CustomModalService
  ) {}

  ngOnInit(): void {
    let parent = this;
    parent.categoryList = [];
    let template = this.store.selectSnapshot((state) => {
      return state.template;
    });
    if (template) {
      this.templateId = template.templateId;
      this.categoryList = Object.values(template.categories);
      this.template = template.template;
    }

    this.displayQuestions = this.displayQuestions.filter((question) =>
      response_types_to_allow_for_score.includes(question.responseType)
    );

    Object.values(this.displayQuestions).forEach((question: any) => {
      this.allQuestionList[question.group_id] = question;
    });

    this.questionsList = this.displayQuestions;
    if (this.templateRatingSchemeMapping)
      this.ratingMode = this.templateRatingSchemeMapping[0];

    if (this.title == 'Editing Rule') {
      this.selected_tab =
        this.ruleData?.type == 'simple' || this.ruleData?.type == 'standard'
          ? 3
          : 2;
    }
  }

  createRule(close, isAddAnother) {
    let rules;
    let ruleBuilderComponent;

    // if (this.selected_tab == 1) {
    //   rules = this.simpleRuleBuilderComponent.getEntityScoreRules();
    // } else
    if (this.selected_tab == 2) {
      ruleBuilderComponent = this.advancedRuleBuilderComponent;
    } else if (this.selected_tab == 3) {
      ruleBuilderComponent = this.standard2RuleBuilderComponent;
    }

    rules = ruleBuilderComponent.getEntityScoreRules();

    if (rules != null) {
      if (isAddAnother) this.createAnotherLoader = true;
      else this.loading = true;
      if (this.title == 'Editing Rule') {
        this.templateService.editScoreRules(rules[0].id, rules[0]).subscribe(
          (res) => {
            this.loading = false;
            this.createAnotherLoader = false;
            this.onSaveCallBack(res, true);
            if (isAddAnother) {
              this.ruleData = null;
              this.title = '';
              ruleBuilderComponent.clearAllFieldsAfterSave();
              ruleBuilderComponent.resetRules();
            } else {
              close();
            }
          },
          (error) => {
            this.loading = false;
            this.createAnotherLoader = false;
            handelConflict(
              error,
              this.templateId,
              this.SweetAlert,
              this.routerService,
              this.modalService
            );
          }
        );
      } else {
        forkJoin(
          rules.map((rule) => this.templateService.scoreRules(rule))
        ).subscribe(
          (responses: any) => {
            this.loading = false;
            this.createAnotherLoader = false;
            this.onSaveCallBack(responses, false);
            if (isAddAnother) {
              this.ruleData = null;
              this.title = '';
              //clear the fields and set default values before resetting the form fields so that values
              //assigned are consistent in all the components
              ruleBuilderComponent.clearAllFieldsAfterSave();
              ruleBuilderComponent.resetRules();
            } else {
              close();
            }
          },
          (error: any) => {
            this.loading = false;
            this.createAnotherLoader = false;
            handelConflict(
              error,
              this.templateId,
              this.SweetAlert,
              this.routerService,
              this.modalService
            );
          }
        );
      }
    }
  }
}
