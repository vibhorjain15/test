import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from 'src/app2/services/utils.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DatePipe } from '@angular/common';
import * as $ from 'jquery';
import * as moment from 'moment';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import {
  DvValidators,
  noHtmlValidator,
} from 'src/app2/shared/validators/no-white-space.validator';
import { UserModel } from 'src/app2/store/user/user.model';
import { Select, Store } from '@ngxs/store';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { RouterService } from 'src/app2/services/router.service';
import { take } from 'rxjs/operators';
import { QAState } from 'src/app2/modules/qa-bank/store/qa.state';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';
import { placeholder } from '../../../modules/questionnaire/constants/response-placeholder.constant';
import { AddPreApprovedService } from './add-pre-approved.service';
import { DvSafeHtmlPipe } from 'src/app2/shared/pipes/dv-trust-html.pipe';
import {
  EntityType,
  ResponseType,
} from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { getResponseValueTypes } from 'src/app2/modules/questionnaire/util/questionnaire.util';
import { GridResponseComponent } from 'src/app2/modules/questionnaire/components';

@Component({
  selector: 'app-add-pre-approved',
  templateUrl: './add-pre-approved.component.html',
})
export class AddPreApprovedComponent implements OnInit {
  @Select(QAState.getSelectedQAList) storeQuestions; // used to get all selected questions from project responses page.
  @Input() source: string | any;
  @Input() response: any;
  @Input() onSuccess: any;
  @Input() entity_details: any;
  @Input() assigned_tags: any;
  @Input() questions: any;
  @Input() qa: any; // this qa input is used to add individual QA from project responses page. It will have an array with sinlge question.
  excludedResponseTypes = [
    ResponseType.aumTable,
    ResponseType.CheckBox,
    ResponseType.Dropdown,
    ResponseType.Bookends,
    ResponseType.ReturnTable,
    ResponseType.Attachment,
  ];
  subCategories: Array<any> = [];
  categories: Array<any> = [];
  editMode = false;
  $q: any;
  // source: boolean;
  current_firm: any;
  current_selected_entity_type: string;
  formData: any = {};
  selectedTemplate: any;
  Restangular: any;
  tags = [];
  funds: Array<any> = [];
  templates = [];
  responseTypes: any;
  $scope: any;
  QaForm: any;
  loadingAddAnother: boolean;
  loading: boolean;
  RestangularHeaderService: any;
  $uibModalInstance: any;
  question: any = {};
  currentSelectedResponseTypeId: any;
  tinyMceInit = {
    placeholder: 'Enter text here',
  };
  addPreApprovedFrom: FormGroup;
  questionsFormArray: FormArray;
  entityLoading = true;
  templateLoading = true;
  categoryLoading = true;
  isTouched: boolean = false;
  error: string;
  showGridDataRequiredError: boolean = false;
  reload = new BehaviorSubject(null);
  reload$;

  @ViewChild('grid') grid: GridResponseComponent;
  team_role_list: any[] = [];
  teamMembers: any[] = [];
  user: UserModel;
  expiryDate: any;
  responseDate = new Date();
  smeUser: any[] = [];
  minExpiryDate = new Date();
  maxResponseDate = new Date();
  entityTypes = [];
  selectedEntityType: string;
  keywordConstants = keywordConstants;
  strategies: any[];
  vehicles: any[];
  tab = 'preApproved';
  accepted = '.docx,.DOCX';
  files: any[];
  selected_entity_id: any;
  questionsCopy: any;
  editQA: boolean = false;
  modalTitle: string;
  firstButtonLabel: string;
  secondButtonLabel: string;
  mappedTemplateIds: any;
  showTemplateDropdown: boolean = false;
  showEditTemplate: boolean = true;
  enumEntityType = EntityType;
  isOpen: boolean = false;
  placeholder = placeholder;
  isAdditionalOptionsVisible: boolean;
  parserService: any;
  gridHaveError: any = false;
  firmPreferences;
  constructor(
    private readonly newTemplatesDataService: TemplatesDataService,
    private readonly oldTemplateDataService: TemplateDataService,
    private readonly templateService: TemplateService,
    private readonly router: RouterService,
    private readonly FundDataService: FundDataService,
    private readonly http: HttpClient,
    private readonly Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly CustomModalService: CustomModalService,
    private readonly questionnaireService: QuestionnaireService,
    private readonly store: Store,
    private datePipe: DatePipe,
    private addPreApprovedService: AddPreApprovedService,
    private dvSafeHtml: DvSafeHtmlPipe
  ) {}

  ngOnInit(): void {
    this.initializeData();
    this.loadPreApprovedQuestionDetails();
    this.createForm();
    this.reload$ = this.reload.asObservable();
    this.firmPreferences = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
  }

  initializeData(): void {
    this.modalTitle = this.setModalTitle(this.source);
    this.editMode = this.source === 'question_detail';
    if (this.source !== 'questionnaire') {
      this.excludedResponseTypes.push(
        ResponseType.Grid,
        ResponseType.DynamicGrid
      );
    }
    this.user = this.store.selectSnapshot((state) => state.user);
    this.current_firm = this.Utils.getCurrentFirm();
    this.teamMembers = Object.values(this.user.teamMembers);
    this.team_role_list = this.team_role_list.concat(
      this.teamMembers.map((user) => ({
        id: user.id,
        name: user.fullName,
        type: 'Users',
      }))
    );
    this.entityTypes = this.getEntityTypes();
    this.current_selected_entity_type = this.getSelectedEntityType();
    this.firstButtonLabel = this.addPreApprovedService.getFirstButtonLabel(
      this.tab,
      this.source
    );
    this.secondButtonLabel = this.addPreApprovedService.getSecondButtonLabel(
      this.tab,
      this.source
    );
    this.showEditTemplate =
      this.response?.associated_template != 'Default Template';
    this.isOpen = !this.editMode;
    this.tinyMceInit.placeholder = placeholder['TextMultiLine'];
    if (this.Utils.isParserAngular())
      this.parserService = this.newTemplatesDataService;
    else this.parserService = this.oldTemplateDataService;
  }

  handleOnCancelClick() {
    this.CustomModalService.close();
  }
  loadPreApprovedQuestionDetails(): void {
    const addPreApprovedConfigs = [
      this.parserService.getResponseTypes(),
      this.parserService.getTemplates({ detail: false }),
      this.FundDataService.getFunds(),
      this.http.get('tags', { params: { type: 'Question' } }),
      this.http.post('service/dvapi_service/product_search', {
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {},
        search_for: 'strategy',
      }),
      this.http.post('service/dvapi_service/vehicle_search', {
        include_contacts: false,
        include_custom_fields: false,
        include_dates: true,
        is_active: true,
        filters: {},
      }),
      this.http.get(`QaTemplateMappings`),
    ];

    if (this.response?.associated_template_id) {
      addPreApprovedConfigs.push(
        this.parserService.getTemplate(this.response.associated_template_id)
      );
      this.formData.template_id = this.response.associated_template_id;
    }
    this.getPreApprovedQuestionDetails(addPreApprovedConfigs);
  }
  getSelectedEntityType() {
    return this.source === 'questionnaire'
      ? this.entity_details.entity_type
      : this.source === 'question_detail'
      ? this.response.associated_entity_type
      : this.source === 'project_history' && this.qa //show pre-selected entity type and Id for individual question from project history
      ? this.qa[0]?.associated_entity_type
      : keywordConstants.Firm;
  }
  setModalTitle(source) {
    return source == 'question_detail'
      ? 'Edit Response'
      : 'Add Q/A(s) to Library';
  }
  getEntityTypes() {
    return [
      {
        name: keywordConstants.Firm,
        label: 'My ' + this.Utils.getDisplayEntityType(keywordConstants.Firm),
        icon: 'institution',
        size: '1x',
      },
      {
        name: keywordConstants.Strategy,
        label: this.Utils.getDisplayEntityType(keywordConstants.Strategy),
        icon: 'strategy',
        size: '1x',
      },
      {
        name: keywordConstants.Product,
        label: this.Utils.getDisplayEntityType(keywordConstants.Product),
        icon: 'fund',
        size: '1x',
      },
      {
        name: keywordConstants.Vehicle,
        label: this.Utils.getDisplayEntityType(keywordConstants.Vehicle),
        icon: 'vehicle-car',
        size: '1x',
      },
    ];
  }
  createSMEuserList() {
    this.team_role_list = this.team_role_list.concat(
      this.teamMembers.map((user) => ({
        id: user.id,
        name: user.fullName,
        type: 'Users',
      }))
    );
  }

  updateButtonText() {
    this.firstButtonLabel = this.addPreApprovedService.getFirstButtonLabel(
      this.tab,
      this.source
    );
    this.secondButtonLabel = this.addPreApprovedService.getSecondButtonLabel(
      this.tab,
      this.source
    );
  }
  changeTabType(type) {
    this.tab = type;
    this.updateButtonText();
    this.isAdditionalOptionsVisible = false;
    if (type == 'uploadNew') {
      this.isOpen = true;
    }
  }
  toggleEdit() {
    this.canBack();
    this.updateButtonText();
  }
  onFirstClick() {
    this.tab == 'uploadNew' ? this.handleImport() : this.submit(false);
    this.updateButtonText();
  }
  onSecondClick() {
    this.submit(true);
  }
  // showHideTemplate(selection) {
  //   if (!selection) {
  //     this.getSelectedTemplate(null, null);
  //   }
  //   // if (
  //   //   !selection &&
  //   //   this.formData?.associated_entities?.id &&
  //   //   this.formData?.entity_type
  //   // ) {
  //   //   this.setEntities(
  //   //     this.formData.associated_entities[0].id,
  //   //     this.formData.entity_type
  //   //   );
  //   // }
  // }

  getPreApprovedQuestionDetails(addPreApprovedConfigs: Array<any>) {
    forkJoin(addPreApprovedConfigs).subscribe(
      ([
        responseType,
        templates,
        funds,
        tags,
        strategies,
        vehicles,
        templateIdMapping,
        selectedTemplate,
      ]: any[]) => {
        responseType && this.setResponseTypesList(responseType);
        templates && this.setAllTemplates(templates);
        funds?.data && this.setFunds(funds.data as Array<any>);
        tags && this.setQuestionTags(tags as Array<any>);
        strategies?.data && this.setStrategies(strategies.data as Array<any>);
        vehicles?.data && this.setVehicles(vehicles.data as Array<any>);
        templateIdMapping && this.setMappingData(templateIdMapping);
        selectedTemplate &&
          ((this.selectedTemplate = this.formData.template_id =
            selectedTemplate),
          this.getCategories(this.selectedTemplate, null));
        this.entityLoading = false;
        this.source === 'questionnaire'
          ? this.initFromQuestionnaire()
          : this.source === 'question_detail'
          ? this.initFromQuestionDetail()
          : this.source === 'project_history'
          ? this.initFromProjectHistory()
          : this.initDefault();
        setTimeout(() => this.reload.next(Math.random()), 1);
      },
      (e) => {}
    );
  }

  createForm() {
    const entityValidators = {};

    if (this.current_selected_entity_type === keywordConstants.Product) {
      entityValidators['Product'] = [DvValidators.required];
    }

    if (this.current_selected_entity_type === keywordConstants.Strategy) {
      entityValidators['Strategy'] = [DvValidators.required];
    }

    if (this.current_selected_entity_type === keywordConstants.Vehicle) {
      entityValidators['Vehicle'] = [DvValidators.required];
    }

    this.addPreApprovedFrom = new FormGroup({
      Template: new FormControl(null, []),
      Product: new FormControl(null, entityValidators['Product'] || []),
      Strategy: new FormControl(null, entityValidators['Strategy'] || []),
      Vehicle: new FormControl(null, entityValidators['Vehicle'] || []),
      Firm: new FormControl(null),
      Category: new FormControl(null, []),
      Subcategory: new FormControl(null, []),
      questionsFormArray: new FormArray([]),
      isDefaultTemplate: new FormControl(false, []),
      hintText: new FormControl(null),
      tags: new FormControl(null),
      sme: new FormControl(null),
      expiryDate: new FormControl(null),
    });
    this.questionsFormArray = this.addPreApprovedFrom.get(
      'questionsFormArray'
    ) as FormArray;
  }

  initDefault() {
    const defaultResponseType = this.responseTypes.find(
      (item) => item.text === ResponseType.TextMultiLine
    );
    this.currentSelectedResponseTypeId = defaultResponseType?.id;
    this.addPreApprovedFrom.patchValue({
      response: this.question.responseType,
      responseType: this.currentSelectedResponseTypeId,
    });
    this.formData = {
      entity_type: this.current_selected_entity_type,
      associated_entities: [
        { id: this.current_firm.id, name: this.current_firm.name },
      ],
      template_id: null,
      parent_section: null,
      child_section: null,
      questions: [
        {
          response: {},
          responseType: defaultResponseType?.text,
          hint_text: '',
        },
      ],
    };
    this.questionsFormArray.push(
      new FormGroup({
        question_text: new FormControl(null, [
          DvValidators.required,
          noHtmlValidator,
        ]),
        answer_text: new FormControl(null, [DvValidators.required]),
        response: new FormControl(null),
        responseType: new FormControl(this.currentSelectedResponseTypeId, [
          DvValidators.required,
        ]),
      })
    );
    this.setEntityType(this.current_selected_entity_type);
    this.createSMEuserList();
  }
  showHideTemplate(selection) {
    if (!selection) {
      this.setDefaultTemplate([this.formData?.associated_entities[0]?.id]);
    }
  }
  initFromQuestionDetail() {
    if (
      !this.templates?.find(
        (template) => template.id == this.response.associated_template_id
      )
    ) {
      this.templates.push({
        id: this.response.associated_template_id,
        name: this.response.associated_template,
      });
    }
    const parent_section = (this.categories as Array<any>).find(
      (category: { id: any }) => {
        return category.id === this.response.parent_section_id;
      }
    );
    this.getSubCategories(parent_section.id, null);

    const child_section = this.subCategories.find(
      (subcategory: { id: any }) => {
        return subcategory.id === this.response.child_section_id;
      }
    );
    if (
      this.response.response_type == ResponseType.Integer ||
      this.response.response_type == ResponseType.Numeric
    ) {
      this.response.response_text_copy =
        this.response.response_text_copy &&
        this.response.response_text_copy.replace(/,/g, '');
      this.response.response_text =
        this.response.response_text &&
        this.response.response_text.replace(/,/g, '');
    }
    this.formData = {
      entity_type: this.current_selected_entity_type,
      associated_entities: [
        {
          id: this.response.associated_entity_id,
          name: this.response.associated_entity_type,
        },
      ],
      template_id: this.response.associated_template_id,
      parent_section,
      child_section,
      questions: [
        {
          id: this.response.question_id,
          text: this.addPreApprovedService.getPlainTextFromHtml(
            this.response.question_text
          ),
          responseType: this.response.response_type,
          hint_text: this.response.question_help_text,
          response: this.mapResponse(this.response),
          tag_ids: this.response.tags
            ? JSON.parse(JSON.stringify(this.response.tags.map((x) => x?.id)))
            : [],
          response_text_copy: this.response?.response_text_copy,
          tagsList: this.response.tags,
          expiry_date:
            this.response?.expiry_date && new Date(this.response?.expiry_date),
        },
      ],
    };

    this.loading = false;
    this.currentSelectedResponseTypeId = this.responseTypes.find(
      (item) => item.text == this.response.response_type
    )?.id;
    this.expiryDate =
      this.response?.expiry_date && new Date(this.response?.expiry_date);

    this.addPreApprovedFrom.patchValue({
      Template: this.response.associated_template_id,
      Product:
        this.current_selected_entity_type == keywordConstants.Product
          ? [this.response.associated_entity_id]
          : '',
      Strategy:
        this.current_selected_entity_type == keywordConstants.Strategy
          ? [this.response.associated_entity_id]
          : '',
      Vehicle:
        this.current_selected_entity_type == keywordConstants.Vehicle
          ? [this.response.associated_entity_id]
          : '',
      Firm:
        this.current_selected_entity_type == keywordConstants.Firm
          ? [this.response.associated_entity_id]
          : '',
      Category: this.response.parent_section_id,
      Subcategory: this.response.child_section_id,
      isDefaultTemplate: false,
      hintText: this.addPreApprovedService.getPlainTextFromHtml(
        this.response.question_help_text
      ),
      tags: this.response.tags?.map((x: any) => x?.id),
      sme: this.response.question_sme?.map((x: any) => x?.id),
      expiryDate:
        this.response?.expiry_date && new Date(this.response?.expiry_date),
    });
    this.questionsFormArray.push(
      new FormGroup({
        question_text: new FormControl(
          {
            value: this.response.question_text,
            disabled: true,
          },
          [DvValidators.required]
        ),
        answer_text: new FormControl(this.response.response_text, [
          DvValidators.required,
        ]),
        response: new FormControl(this.response?.responseType),
        responseType: new FormControl(
          {
            value: this.currentSelectedResponseTypeId,
            disabled: true,
          },
          [DvValidators.required]
        ),
      })
    );
    this.createSMEuserList();

    this.addPreApprovedFrom.disable();
    this.addPreApprovedFrom.controls.Firm.disable();
    this.addPreApprovedFrom.controls.Product.disable();
    this.addPreApprovedFrom.controls.Strategy.disable();
    this.addPreApprovedFrom.controls.Vehicle.disable();
    this.addPreApprovedFrom.controls.Template.disable();
    this.addPreApprovedFrom.controls.Category.disable();
    this.addPreApprovedFrom.controls.Subcategory.disable();
    this.addPreApprovedFrom.controls.tags.enable();
    this.addPreApprovedFrom.controls.hintText.enable();
    this.addPreApprovedFrom.controls.sme.enable();
    this.addPreApprovedFrom.controls.expiryDate.enable();
    this.questionsFormArray.controls.forEach((control) => {
      control.get('question_text').disable();
      control.get('answer_text').enable();
      control.get('responseType').disable();
    });
    this.setEntities(
      [this.response.associated_entity_id],
      this.response.associated_entity_type
    );
  }

  initFromProjectHistory() {
    this.storeQuestions.pipe(take(1)).subscribe((questions) => {
      this.questions = JSON.parse(JSON.stringify(questions));
      this.questions = this.questions?.filter(
        (question) =>
          !this.excludedResponseTypes.includes(question.response_type) &&
          (question.response_text_copy?.trim() ||
            question.response_text?.trim())
      );
    });
    if (this.qa) {
      // if part handles individual question from project history and else part handles bulk questions
      // this qa var is used for individual question from project history
      this.questions = this.qa;
      this.formData = {
        entity_type: this.current_selected_entity_type,
        associated_entities: [
          {
            id: this.questions[0].associated_entity_id,
            name: this.questions[0].associated_entity_type,
          },
        ],
        template_id: null,
        parent_section: null,
        child_section: null,
        questions: this.mapQuestions(this.questions),
      };
      this.expiryDate =
        this.questions[0]?.expiry_date &&
        new Date(this.questions[0]?.expiry_date);

      this.addPreApprovedFrom.patchValue({
        Template: '',
        Product:
          this.current_selected_entity_type == keywordConstants.Product
            ? [this.questions[0].associated_entity_id]
            : '',
        Strategy:
          this.current_selected_entity_type == keywordConstants.Strategy
            ? [this.questions[0].associated_entity_id]
            : '',
        Vehicle:
          this.current_selected_entity_type == keywordConstants.Vehicle
            ? [this.questions[0].associated_entity_id]
            : '',
        Firm:
          this.current_selected_entity_type == keywordConstants.Firm
            ? [this.questions[0].associated_entity_id]
            : '',
        Category: '',
        Subcategory: '',
        isDefaultTemplate: false,
        hintText: this.addPreApprovedService.getPlainTextFromHtml(
          this.questions[0]?.question_help_text
        ),
        tags: this.questions[0].tags?.map((x: any) => x?.id),
        sme: this.questions[0].question_sme?.map((x: any) => x?.id),
        expiryDate:
          this.questions[0]?.expiry_date &&
          new Date(this.questions[0]?.expiry_date),
      });
    } else {
      this.formData = {
        entity_type: this.current_selected_entity_type,
        associated_entities: [
          { id: this.current_firm.id, name: this.current_firm.name },
        ],
        parent_section: null,
        questions: this.mapQuestions(this.questions),
        child_section: null,
        template_id: null,
      };
    }
    this.formData.questions.forEach((question) => {
      this.questionsFormArray.push(
        new FormGroup({
          question_text: new FormControl(
            this.addPreApprovedService.getPlainTextFromHtml(question.text),
            [DvValidators.required]
          ),
          answer_text: new FormControl(question.response_text_copy, [
            DvValidators.required,
          ]),
          response: new FormControl(question?.response_type),
          responseType: new FormControl(question.responseTypeId, [
            DvValidators.required,
          ]),
        })
      );
    });
    if (this.qa) {
      this.setEntities(
        [this.questions[0]?.associated_entity_id],
        this.questions[0]?.associated_entity_type
      );
    } else {
      this.setEntityType(this.current_selected_entity_type);
    }
    this.createSMEuserList();
  }
  private mapQuestions(questions: any[]): any[] {
    return questions.map((question: any) => {
      if (
        (question.response_type == ResponseType.Integer ||
          question.response_type == ResponseType.Numeric) &&
        question.response_text_copy
      ) {
        question.response_text_copy = question.response_text_copy.replace(
          /,/g,
          ''
        );
      }
      const response = this.mapResponse(question);
      const responseTypeId = this.responseTypes.find(
        (item) => item.text === question.response_type
      )?.id;

      return {
        ...(this.editMode && {
          id: question.question_id,
        }),
        text: this.addPreApprovedService.getPlainTextFromHtml(
          question.question_text
        ),
        response,
        responseTypeId,
        responseType: question.response_type,
        response_text_copy:
          question.response_text_copy || question.response_text,
        response_text: question.response_text,
        question_sme: question.question_sme,
        hint_text: question?.question_help_text,
        tags_text: question?.tags_text,
        tag_ids: question?.tags?.map((x) => x?.id) || [],
        tagsList: question?.tags,
        expiry_date: question.expiry_date && new Date(question.expiry_date),
        gridData: question?.gridData,
        comments: question?.comments,
      };
    });
  }

  mapResponse(question) {
    const responseType: any = question.response_type;
    let responseTextCopy: any = question.response_text_copy;
    const responseText: any = question.response_text;
    const responseId: number = question?.response_id;
    const grid_responses = question?.grid_responses;
    const numericResponseValue = parseFloat(responseTextCopy);
    let booleanResponseValue: boolean | undefined;
    const dateResponseValue =
      (responseTextCopy || responseText) &&
      (responseTextCopy || responseText).replace(/-/g, '/');
    const isNoPlusWithNo =
      responseTextCopy &&
      responseType === ResponseType.NoPlus &&
      responseTextCopy.startsWith('No');
    const isBooleanPlusWithYes =
      responseTextCopy &&
      responseType === ResponseType.BooleanPlus &&
      responseTextCopy.startsWith('Yes');
    const explanationString: string =
      (isNoPlusWithNo || isBooleanPlusWithYes) &&
      responseTextCopy.match(/\((.*?)\)/);

    if (['Boolean', 'BooleanPlus', 'NoPlus'].includes(responseType)) {
      booleanResponseValue =
        responseTextCopy === 'Yes' || isBooleanPlusWithYes
          ? true
          : responseTextCopy === 'No' || isNoPlusWithNo
          ? false
          : undefined;
    }

    const response = {
      ...(responseId &&
        this.editMode && {
          id: responseId,
        }),
      response_type: responseType,
      response_text_copy: responseTextCopy,
      ...(responseType === 'Date' && {
        dateResponse: dateResponseValue && moment(dateResponseValue).toDate(),
        textResponse: undefined,
      }),
      ...([
        'Integer',
        'Percentage',
        'Numeric',
        'Identifier',
        'TextPhone',
      ].includes(responseType) && {
        numericResponseA: isNaN(numericResponseValue)
          ? undefined
          : numericResponseValue,
      }),
      ...(['Text', 'TextEmail', 'TextMultiLine'].includes(responseType) && {
        textResponse: responseTextCopy,
      }),
      ...(['Boolean', 'BooleanPlus', 'NoPlus'].includes(responseType) && {
        booleanResponse: booleanResponseValue,
      }),
      ...(['Grid', 'DynamicGrid'].includes(responseType) && {
        localgrid_responses: grid_responses,
      }),
      ...(!['Text', 'TextEmail', 'TextMultiLine'].includes(responseType) &&
        question?.comments?.length > 0 && {
          textResponse: question?.comments[0]?.comment_text,
        }),
      ...((isNoPlusWithNo || isBooleanPlusWithYes) && {
        textResponse: explanationString?.length && explanationString[1],
      }),
    };

    return response;
  }

  initFromQuestionnaire() {
    this.questionnaireService.getTags(this.response.id).subscribe((res) => {
      this.assigned_tags = res;
      this.question = JSON.parse(JSON.stringify(this.response));
      this.question.response = this.question.answer.attributes;
      if (
        this.question.responseType == ResponseType.Integer ||
        this.question.responseType == ResponseType.Numeric
      ) {
        this.question.response.responseText =
          this.question.response.responseText &&
          this.question.response.responseText.replace(/,/g, '');
      }
      if (this.question.responseType === ResponseType.Date) {
        const dateResponseValue =
          this.question.response.dateResponse &&
          this.question.response.dateResponse.replace(/-/g, '/');
        this.question.response.dateResponse =
          dateResponseValue && moment(dateResponseValue).toDate();
      }
      if (
        ((this.question.responseType == ResponseType.BooleanPlus &&
          this.question.response.booleanResponse === true) ||
          (this.question.responseType == ResponseType.NoPlus &&
            this.question.response.booleanResponse === false)) &&
        this.question.response.booleanExplanation
      ) {
        this.question.response.textResponse =
          this.question.response.booleanExplanation;
      }
      this.formData = {
        associated_entities: [
          {
            id: this.entity_details.entity_id,
            name: this.entity_details.entity_type,
          },
        ],
        parent_section: null,
        entity_type: this.current_selected_entity_type,
        questions: [
          {
            text: this.question?.text,
            response: this.question?.answer?.attributes,
            responseType: this.question?.responseType,
            hint_text: this.question?.hint_text,
            tag_ids: this.question?.tags?.map((x) => x?.id) || [],
            expiry_date:
              this.question?.expiry_date && new Date(this.question.expiry_date),
            gridData: this.question?.gridData,
          },
        ],
        child_section: null,
      };

      this.currentSelectedResponseTypeId = this.responseTypes.find(
        (item) => item.text == this.response.responseType
      )?.id;
      if (this.response?.expiry_date) {
        this.expiryDate = new Date(this.response?.expiry_date);
      }
      this.addPreApprovedFrom.patchValue({
        Template: this.response.associated_template_id,
        Product:
          this.current_selected_entity_type == keywordConstants.Product
            ? [this.entity_details.entity_id]
            : '',
        Strategy:
          this.current_selected_entity_type == keywordConstants.Strategy
            ? [this.entity_details.entity_id]
            : '',
        Vehicle:
          this.current_selected_entity_type == keywordConstants.Vehicle
            ? [this.entity_details.entity_id]
            : '',
        Firm:
          this.current_selected_entity_type == keywordConstants.Firm
            ? [this.entity_details.entity_id]
            : '',
        isDefaultTemplate: false,
        hintText: this.addPreApprovedService.getPlainTextFromHtml(
          this.response.hint_text
        ),
        tags: this.response.tags?.map((x: any) => x?.id),
        sme: this.response.question_sme?.map((x: any) => x?.id),
        expiryDate:
          this.response?.expiry_date && new Date(this.response?.expiry_date),
      });
      this.formData.questions.forEach((question) => {
        this.questionsFormArray.push(
          new FormGroup({
            question_text: new FormControl(
              this.addPreApprovedService.getPlainTextFromHtml(question.text),
              [DvValidators.required]
            ),
            answer_text: new FormControl(
              question.response.responseText,
              ['Grid', 'DynamicGrid'].includes(question.responseType)
                ? []
                : [DvValidators.required]
            ),

            response: new FormControl(question?.response_type),
            responseType: new FormControl(
              {
                value: this.currentSelectedResponseTypeId,
                disabled: true,
              },
              [DvValidators.required]
            ),
          })
        );
      });

      this.addPreApprovedFrom.disable();
      this.addPreApprovedFrom.controls.Template.enable();
      this.addPreApprovedFrom.controls.tags.enable();
      this.addPreApprovedFrom.controls.hintText.enable();
      this.addPreApprovedFrom.controls.Product.enable();
      this.addPreApprovedFrom.controls.sme.enable();
      this.addPreApprovedFrom.controls.expiryDate.enable();
      this.questionsFormArray.controls.forEach((control) => {
        control.get('question_text').enable();
        control.get('answer_text').enable();
        control.get('responseType').disable();
      });
      this.setEntities(
        [this.entity_details.entity_id],
        this.entity_details.entity_type
      );
    });
    this.createSMEuserList();
  }

  setQuestionTags(tags: Array<any>) {
    tags?.sort((item1, item2) => {
      return item1?.name?.toLowerCase() < item2?.name?.toLowerCase() ? -1 : 1;
    });
    this.tags = tags;
  }

  setResponseTypesList(responseType) {
    this.responseTypes = (responseType as Array<any>).filter(
      (responseType: { text: any }) =>
        !this.excludedResponseTypes.includes(responseType.text)
    );
  }
  setFunds(response: Array<any>) {
    this.funds = response;
  }
  setStrategies(response: Array<any>) {
    this.strategies = response;
  }
  setVehicles(response: Array<any>) {
    this.vehicles = response;
  }
  setAllTemplates(response: any) {
    this.templates = response;
    this.templateLoading = false;
    if (this.templates) {
      this.filterbyQATemplate();
    }
  }

  setMappingData(data) {
    this.mappedTemplateIds = data;
  }

  setTemplate(selectedTemplate) {
    this.selectedTemplate = selectedTemplate;
    this.formData.template_id = selectedTemplate;
    this.getCategories(this.selectedTemplate, null);
  }

  setEntityType(entity_type: any) {
    if (!this.editMode) {
      this.formData.entity_type = entity_type;
      this.current_selected_entity_type = entity_type;

      const formControls = ['Product', 'Strategy', 'Vehicle'];

      formControls.forEach((controlName) => {
        const control = this.addPreApprovedFrom.controls[controlName];
        control.setValidators(
          entity_type === keywordConstants[controlName]
            ? Validators.required
            : null
        );
        control.updateValueAndValidity();
      });
      if (entity_type == keywordConstants.Firm) {
        this.setEntities([this.current_firm.id], keywordConstants.Firm);
      } else {
        this.setEntities(null, entity_type);
      }
    }
  }

  setEntities(Ids: Array<number>, entity_type) {
    this.showTemplateDropdown = false;
    if (Ids) {
      if (entity_type == keywordConstants.Product) {
        this.formData.associated_entities = this.funds.filter((x) =>
          Ids.includes(x.id)
        );
        this.addPreApprovedFrom.patchValue({
          Product: Ids,
        });
      }
      if (entity_type == keywordConstants.Strategy) {
        this.formData.associated_entities = this.strategies.filter((x) =>
          Ids.includes(x.id)
        );
        this.addPreApprovedFrom.patchValue({
          Strategy: Ids,
        });
      }
      if (entity_type == keywordConstants.Vehicle) {
        this.formData.associated_entities = this.vehicles.filter((x) =>
          Ids.includes(x.id)
        );
        this.addPreApprovedFrom.patchValue({
          Vehicle: Ids,
        });
      }
      if (entity_type == keywordConstants.Firm) {
        this.formData.associated_entities = [
          { id: this.current_firm.id, name: this.current_firm.name },
        ];
        this.addPreApprovedFrom.patchValue({
          Firm: [this.current_firm.id],
        });
      }
    } else {
      this.formData.associated_entities = [];
      this.addPreApprovedFrom.patchValue({
        Product: null,
        Strategy: null,
        Vehicle: null,
      });
    }
    if (!this.editMode) {
      this.setDefaultTemplate(Ids);
    }
  }

  setDefaultTemplate(Id) {
    let selectedKey: any;
    for (const oldKey in this.mappedTemplateIds) {
      if (this.mappedTemplateIds.hasOwnProperty(oldKey)) {
        const result = this.addPreApprovedService.getPartsFromDashes(oldKey);
        let teamId = result.before;
        let entityType = result.between;
        let entityId = result.after;
        if (
          Id &&
          Id[0] == entityId &&
          this.current_selected_entity_type == entityType &&
          parseInt(teamId) === 0
        ) {
          selectedKey = oldKey;
        }
      }
    }
    if (selectedKey) {
      this.getSelectedTemplate(this.mappedTemplateIds[selectedKey], null);
    } else {
      this.getSelectedTemplate(null, null);
    }
  }

  getSelectedTemplate(id: any, resetPayload?) {
    //first param is template id to pre-select template,
    //second param is for pre-setting category and subcategory after 'save and add another' event
    if (id) {
      this.templateLoading = true;
      this.parserService.getTemplate(id).subscribe((template: any) => {
        if (template?.templateInfo?.is_draft) {
          this.templates.push(template.templateInfo);
          this.templates = [...this.templates];
        }
        this.selectedTemplate = template;
        if (this.selectedTemplate) {
          this.getCategories(this.selectedTemplate, resetPayload);
        }
        this.addPreApprovedFrom.patchValue({
          Template: id,
        });
        this.formData.template_id = id;
        this.templateLoading = false;
      });
    } else {
      this.selectedTemplate = null;
      this.addPreApprovedFrom.patchValue({
        Template: null,
      });
      this.formData.template_id = null;
      this.getCategories(null, resetPayload);
    }
  }

  getCategories(template: { templateInfo: { sections: any } }, resetPayload) {
    if (template) {
      this.categories =
        template.templateInfo.sections.filter(
          (category: { isParent: any }) => category.isParent
        ) || [];

      this.addPreApprovedFrom.controls.Category.enable();
      this.addPreApprovedFrom.controls.Subcategory.disable();
    } else {
      this.categories = [];
      this.subCategories = [];
      this.formData.parent_section = null;
      this.formData.child_section = null;
      this.addPreApprovedFrom.controls.Category.disable();
      this.addPreApprovedFrom.controls.Subcategory.disable();
    }
    if (this.editMode) {
      this.addPreApprovedFrom.patchValue({
        Category: null,
        Subcategory: null,
      });
      this.addPreApprovedFrom.controls.Category.disable();
      this.addPreApprovedFrom.controls.Subcategory.disable();
    } else {
      let parentId: number;

      if (resetPayload) {
        this.addPreApprovedFrom.patchValue({
          Category: resetPayload.parent_section.id,
        });
        this.formData.parent_section = this.categories.find(
          (cat) => cat.id == resetPayload.parent_section.id
        );
        parentId = resetPayload.parent_section.id;
      } else {
        parentId = this.categories.find((cat) => cat.name == 'General')?.id;
        if (!parentId) {
          this.createOption('General');
        }
        this.addPreApprovedFrom.patchValue({
          Category: this.categories.find((cat) => cat.name == 'General').id,
        });
        this.formData.parent_section = this.categories.find(
          (cat) => cat.name == 'General'
        );
      }
      this.getSubCategories(parentId, resetPayload);
    }
  }

  getSubCategories(parentId: any, resetPayload) {
    this.addPreApprovedFrom.controls.Subcategory.enable();
    if (parentId) {
      this.subCategories =
        this.selectedTemplate?.templateInfo?.sections.filter(
          (category: { parentID: any }) => category.parentID === parentId
        ) || [];

      this.formData.parent_section =
        this.categories.find((x) => x.id === parentId) ||
        this.formData.parent_section;
      this.addPreApprovedFrom.patchValue({
        Category: parentId,
      });
      if (this.formData?.parent_section?.questions?.length) {
        this.formData.parent_section.order =
          this.formData.parent_section.questions.find(
            (x) => x.id == parentId
          ).order;
        delete this.formData.parent_section.questions;
      }
    } else {
      this.subCategories = [];
      this.formData.child_section = null;
    }

    if (resetPayload) {
      this.addPreApprovedFrom.patchValue({
        Subcategory: resetPayload.child_section.id,
      });
      this.formData.child_section = this.subCategories.find(
        (subcat) => subcat.id == resetPayload.child_section.id
      );
    } else {
      let GeneralSubcategoryId = this.subCategories.find(
        (subcat) => subcat.name == 'General'
      )?.id;
      if (!GeneralSubcategoryId) {
        this.createSubcategory('General');
      }
      this.addPreApprovedFrom.patchValue({
        Subcategory: this.subCategories.find(
          (subcat) => subcat.name == 'General'
        )?.id,
      });
      this.formData.child_section = this.subCategories.find(
        (subcat) => subcat.name == 'General'
      );
    }
    this.categoryLoading = false;
    if (this.subCategories.length === 0) {
      this.subCategories.push({
        name: '',
      });
    }
  }

  filterbyQATemplate() {
    this.templates = this.templates.filter(
      (template: { type: string }) => template.type === 'dd_profile'
    );
  }

  toggleAdditionalOptions(idx: string) {
    $('#optionsDiv_' + idx).slideToggle();
    this.isAdditionalOptionsVisible = !this.isAdditionalOptionsVisible;
  }

  resetToAddAnother(payload: any) {
    this.getSelectedTemplate(payload.template_id, payload);
    this.setQuestionText(null, 0);
    this.questionsFormArray.controls[0].get('question_text').markAsUntouched();
    const defaultResponseType = this.responseTypes.find(
      (item) => item.text === ResponseType.TextMultiLine
    );
    this.currentSelectedResponseTypeId = defaultResponseType?.id;
    this.setResponseType(this.currentSelectedResponseTypeId, 0);
    this.formData.questions[0].response = {};
    const formArray = this.questionsFormArray.controls[0] as FormGroup;

    // Recreate the answer_text FormControl
    formArray.setControl(
      'answer_text',
      new FormControl(null, [DvValidators.required])
    );
    this.setHintText(undefined);
    this.setTags([]);
    this.handleChangeSMEAssignedUser([]);
    this.handleExpiryDateChange(undefined);
    this.isTouched = false;
    this.loading = false;
  }

  createOption = (term: any) => {
    this.formData.child_section = null;
    this.subCategories = [];
    let maxId = Math.max(
      ...(this.categories?.map((category) => category.id) ?? [-1])
    );
    this.categories = this.categories.filter((cat) => !(cat && cat.new));
    this.categories.push({ name: term, new: true, id: maxId + 1 });
    this.formData.parent_section = this.categories[this.categories.length - 1];
    return this.formData.parent_section;
  };

  createSubcategory = (term: any) => {
    let maxId = Math.max(
      ...(this.subCategories?.map((subCategory) => subCategory.id) ?? [-1])
    );
    this.subCategories = this.subCategories.filter(
      (subcat) => !(subcat && subcat.new)
    );
    this.subCategories.push({ name: term, new: true, id: maxId + 1 });
    this.formData.child_section =
      this.subCategories[this.subCategories.length - 1];
    return this.formData.child_section;
  };

  canBack() {
    this.addPreApprovedFrom.markAllAsTouched();
    this.isTouched = true;
    if ((this.addPreApprovedFrom as FormGroup).valid) {
      if (this.source == 'project_history' && this.editQA) {
        this.editQA = !this.editQA;
      }
    }
  }
  canEdit() {
    this.addPreApprovedFrom.markAllAsTouched();
    this.isTouched = true;
    if ((this.addPreApprovedFrom as FormGroup).valid) {
      if (this.source == 'project_history' && !this.editQA) {
        this.editQA = !this.editQA;
      }
    }
  }
  handleGridValueChange(change) {
    this.gridHaveError = change.error;
  }
  submit(addAnother: any) {
    //submit the form, for default submit button it submits the form and validation starts. but for submit and add another
    //it doesnt submit the form and validation doesnt start. This is why we manually submit the form everytime
    // this.QaForm.$setSubmitted(true);
    this.addPreApprovedFrom.markAllAsTouched();
    this.isTouched = true;
    this.showGridDataRequiredError = false;
    if (
      (this.addPreApprovedFrom as FormGroup).valid &&
      this.validateResponse(this.formData, this.error)
    ) {
      // Same validation before submitting the form is added for all usecases either QA center or questionnaire
      this.processSubmit(addAnother);
    } else {
      this.toaster.error(
        this.error ? this.error : 'Please fill all the required fields'
      );
    }
  }

  processSubmit(addAnother) {
    if (!this.formData.associated_entities?.length) {
      this.toaster.error(
        'error',
        `Please select a ${this.Utils.getDisplayEntityType(
          this.current_selected_entity_type
        )}`
      );
      return;
    }
    if (this.gridHaveError) {
      this.toaster.error('Please enter valid response');
      return;
    }

    if (addAnother) {
      this.loadingAddAnother = true;
    } else {
      this.loading = true;
    }
    const payload = JSON.parse(JSON.stringify(this.formData));
    payload.entity_type = this.formData.entity_type;

    if (payload?.questions?.length) {
      (payload?.questions as Array<any>).forEach(
        (
          question: {
            responseType: string;
            response: any;
            tag_ids: any;
            grid?: any;
            text: string;
            comments?: [];
            expiry_date?: any;
          },
          index
        ) => {
          let response_id = question.response?.id;
          if (question.responseType === ResponseType.Date) {
            question.response = {
              dateResponse: moment(question.response.dateResponse).format(
                'MM-DD-YYYY'
              ),
              textResponse: question.response.textResponse,
              response_type: question.response.response_type,
            };
          } else if (
            question.responseType === ResponseType.Grid ||
            question.responseType === ResponseType.DynamicGrid
          ) {
            question.grid = {
              dataType: this.grid.gridData.dataType,
              formulas_json: this.grid.gridData.formulas_json,
              aggregation_json: this.grid.gridData.aggregation_json,
              metadata: this.grid.gridData.metadata,
              rows_columns: this.grid.gridData.rows_columns
                .filter((item) => item.elementType == 'Column')
                .map((item) => {
                  return {
                    id: item.id,
                    name: item.name,
                    elementType: item.elementType,
                    order: item.order,
                    type: item.type,
                    type_options: item.type_options,
                  };
                }),
              dynamic_element: this.grid.gridData.dynamic_element ?? undefined,
            };

            this.grid.rows?.forEach((row, rowIndex) => {
              question.grid.rows_columns.push({
                id: row.id,
                name: row.name,
                elementType: 'Row',
                order: rowIndex + 1,
                type: null,
                type_options: null,
              });
            });

            question.response = {
              grid_responses: this.addPreApprovedService.getFormattedGridData(
                this.grid?.handsOnTable?.getHotInstance().getData(),
                this.grid?.handsOnTable?.getHotInstance().getSourceData()
              ),
            };
            this.showGridDataRequiredError =
              !question.response.grid_responses?.some(
                (cell) => cell.value != null && cell.value != ''
              );

            delete (question as any).gridData;
          } else {
            let response = {};
            getResponseValueTypes(question.responseType).forEach((attr) => {
              response[attr] = question.response[attr];
            });
            question.response = response;
          }
          let smeSelectedUsers = this.addPreApprovedFrom.get('sme').value;
          let expiry_date =
            this.addPreApprovedFrom.get('expiryDate').value &&
            moment(this.addPreApprovedFrom.get('expiryDate').value).format(
              'MM-DD-YYYY'
            );
          question.response = {
            ...(this.editMode &&
              response_id && {
                id: response_id,
              }),
            ...question.response,
            expiry_date: expiry_date,
            sme_user_assignments: smeSelectedUsers,
            sme_function_assignments: [],
          };
          if (question?.expiry_date) {
            question.expiry_date = expiry_date;
          }
          if (
            ((question.responseType == ResponseType.BooleanPlus &&
              question.response.booleanResponse === false) ||
              (question.responseType == ResponseType.NoPlus &&
                question.response.booleanResponse === true)) &&
            question.comments?.length === 0
          ) {
            question.response.textResponse = null;
          }
        }
      );
    }

    if (this.showGridDataRequiredError) {
      this.toaster.error('Please enter some data in the table before saving');
      this.loading = false;
      this.loadingAddAnother = false;
      return;
    }
    // If the selected subcategory is not new, get id of the subcategory
    if (!payload.child_section.new) {
      payload.child_section = {
        name: payload.child_section.name,
        id: payload?.child_section?.id || 0,
      };
    } else {
      payload.child_section = {
        name: payload.child_section?.name || '',
        new: true,
      };
    }

    // If the selected category is not new, get id of the category
    if (!payload.parent_section.new) {
      payload.parent_section = {
        name: payload.parent_section?.name || '',
        id: payload?.parent_section?.id || 0,
      };
    } else {
      payload.parent_section = {
        name: payload.parent_section?.name || '',
        new: true,
      };
    }

    // **************
    if (this.current_selected_entity_type === keywordConstants.Firm) {
      payload.associated_entities = [
        { id: this.current_firm.id, entity_type: keywordConstants.Firm },
      ];
    } else {
      if (this.current_selected_entity_type == keywordConstants.Product) {
        this.formData.associated_entities = this.funds.filter((x) =>
          this.addPreApprovedFrom.controls.Product.value.includes(x.id)
        );
      } else if (
        this.current_selected_entity_type == keywordConstants.Vehicle
      ) {
        this.formData.associated_entities = this.vehicles.filter((x) =>
          this.addPreApprovedFrom.controls.Vehicle.value.includes(x.id)
        );
      } else if (
        this.current_selected_entity_type == keywordConstants.Strategy
      ) {
        this.formData.associated_entities = this.strategies.filter((x) =>
          this.addPreApprovedFrom.controls.Strategy.value.includes(x.id)
        );
      }
    }
    if (this.editMode) {
      payload.associated_entities = this.formData.associated_entities.map(
        (x) => x.id
      );
      if (
        this.firmPreferences.enable_auto_review_again &&
        this.response?.is_verified
      ) {
        // we have to pass trigger_review property as true if the response is partially or fully reviewed already and the firm preference for auto review is enabled.
        let oldResponse = this.mapResponse(this.response);
        payload.trigger_review =
          JSON.stringify(oldResponse) !=
          JSON.stringify(this.formData.questions[0].response);
      }
    } else {
      payload.associated_entities = this.formData.associated_entities.map(
        (x) => ({ id: x.id, entity_type: payload.entity_type })
      );
      delete payload.entity_type;
    }
    if (this.editMode) {
      this.http
        .put(`templates/${payload.template_id}/add_qa`, payload)
        .subscribe(
          (response) => {
            this.toaster.success('', 'Q/A updated successfully');
            this.onSuccess();
            this.CustomModalService.close();
            this.loading = false;
            this.loadingAddAnother = false;
          },
          (error: any) => {
            this.loading = false;
            this.loadingAddAnother = false;
          }
        );
    } else {
      this.http
        // .post(`templates/${payload.template_id}/add_qa`, payload)
        .post(`v2/templates/add_qa`, payload)
        .subscribe(
          (response) => {
            this.toaster.success('', 'Q/A added successfully');
            if (addAnother) {
              this.resetToAddAnother(response);
            } else {
              this.CustomModalService.close();
            }
            this.loading = false;
            this.loadingAddAnother = false;
          },
          (error: any) => {
            this.loading = false;
            this.loadingAddAnother = false;
          }
        );
    }
  }
  validateResponse(formData, error) {
    // This validaiton will check the all questions data before save. Used in QA center and questionniare both
    let isValid = !error;
    for (let i = 0; i < formData.questions.length; i++) {
      const question = formData.questions[i];

      if (
        question.responseType == ResponseType.Boolean &&
        question.response.booleanResponse == null
      ) {
        isValid = false;
        break;
      } else if (
        ((question.responseType == ResponseType.BooleanPlus &&
          question.response.booleanResponse === true) ||
          (question.responseType == ResponseType.NoPlus &&
            question.response.booleanResponse === false)) &&
        !question.response.textResponse
      ) {
        isValid = false;
        break;
      } else if (
        question.responseType == ResponseType.TextEmail &&
        !question.response.textResponse
      ) {
        isValid = false;
        break;
      } else if (
        [
          ResponseType.Integer,
          ResponseType.Numeric,
          ResponseType.Percentage,
          ResponseType.Identifier,
          ResponseType.TextPhone,
        ].includes(question.responseType) &&
        question.response.numericResponseA == null
      ) {
        isValid = false;
        break;
      }
    }
    return isValid;
  }

  handleEditorTextChange(freeText: string, index) {
    const { questions } = this.formData;
    const response = questions[index]?.response || {};
    this.questionsFormArray.controls[index]
      .get('answer_text')
      .setValue(freeText);
    Object.assign(response, {
      answer_text: freeText,
      text: freeText,
      textResponse: freeText,
    });
  }

  setBooleanTextResponse(selection, index, responseType) {
    let validators: any = true; // Used to set validation on the explanation field for Boolean Plus or No Plus
    if (
      responseType == 'Boolean' ||
      (responseType == 'NoPlus' && selection === true) ||
      (responseType == 'BooleanPlus' && selection === false)
    ) {
      validators = false;
    } else {
      validators = true;
    }
    this.questionsFormArray.controls[index]
      .get('answer_text')
      .setValidators(validators ? DvValidators.required : null);
    this.questionsFormArray.controls[index]
      .get('answer_text')
      .updateValueAndValidity();
  }
  handleExpiryDateChange(date) {
    this.expiryDate = date;
    this.addPreApprovedFrom.patchValue({
      expiryDate: date,
    });
  }
  handleResponseDateChange(date) {
    this.responseDate = date;
  }
  handleChangeSMEAssignedUser(value) {
    this.addPreApprovedFrom.patchValue({
      sme: value,
    });
  }

  handleResponseInputChange(value, property, error = null, index) {
    this.questionsFormArray.controls[index].get('answer_text').setValue(value);
    this.formData.questions[index].response[property] = value;
    this.error = error;
  }

  handleDvInputResponseInputChange(value, property, error = null, index) {
    // this.questionsFormArray.controls[index].get('answer_text').setValue(value);
    this.formData.questions[index].response[property] = value;
    this.error = error;
  }

  setChildSection = (value: number) => {
    this.formData.child_section =
      this.subCategories.find((x) => x.id === value) ||
      this.formData.child_section;
    this.formData.child_section.order =
      this.formData.child_section?.questions?.find((x) => x.id)?.order || 0;
    delete this.formData.child_section?.questions;
  };

  setResponseType(responseType: any, index) {
    // Recreate the answer_text FormControl
    const formArray = this.questionsFormArray.controls[index] as FormGroup;
    formArray.setControl(
      'answer_text',
      new FormControl(null, [DvValidators.required])
    );
    this.formData.questions[0].response = {};
    // Update response type below
    this.questionsFormArray.controls[index]
      .get('responseType')
      .setValue(responseType);
    this.formData.questions[index].responseType = (
      this.responseTypes as Array<any>
    ).find((x) => x.id === responseType).text;
  }

  setTags(tagsId: Array<number>) {
    if (this.source == 'project_history' && !this.qa) {
      //This if section executes only for the bulk questions from Project history page
      this.formData.questions.forEach((question) => {
        question.tag_ids = tagsId;
        question.tagsList = this.tags.filter((x) => tagsId.includes(x.id));
      });
    } else {
      this.formData.questions[0].tag_ids = tagsId;
      this.formData.questions[0].tagsList = this.tags.filter((x) =>
        tagsId.includes(x.id)
      );
    }
    this.addPreApprovedFrom.patchValue({
      tags: tagsId,
    });
  }

  setHintText(hintText: any) {
    if (this.source == 'project_history' && !this.qa) {
      //This if section executes only for the bulk questions from Project history page
      this.formData.questions.forEach((question) => {
        question.hint_text = hintText?.target?.value || '';
      });
    } else {
      this.formData.questions[0].hint_text = hintText?.target?.value || '';
    }
    this.addPreApprovedFrom.patchValue({
      hintText: hintText?.target?.value || '',
    });
  }

  setQuestionText(questionText: any, index) {
    this.formData.questions[index].text = questionText?.target?.value || '';
    this.questionsFormArray.controls[index]
      .get('question_text')
      .setValue(questionText?.target?.value || '');
  }

  getPlainTextFromHtml(htmlText) {
    var tempDivElement = document.createElement('div');
    tempDivElement.innerHTML =
      this.dvSafeHtml.transform(htmlText)[
        'changingThisBreaksApplicationSecurity'
      ];
    return tempDivElement.textContent || tempDivElement.innerText || '';
  }

  getFormattedGridData(gridData, sourceData) {
    let data = [];
    sourceData?.forEach((row, rowIndex) => {
      Object.values(row).forEach((item: any, columnIndex) => {
        let cell = {
          row_id: item.row_id,
          column_id: item.column_id,
          value: gridData[rowIndex][columnIndex],
          row_group_id: item.row_group_id,
          column_group_id: item.column_group_id,
          formula: item.formula,
          is_aggregated: item.is_aggregated,
        };
        data.push(cell);
      });
    });
    return data;
  }

  setDateResponse(response, index) {
    this.questionsFormArray.controls[index]
      .get('answer_text')
      .setValue(response);
    this.formData.questions[index].response.dateResponse = response;
  }

  handleImport() {
    if (!this.files?.length) {
      this.toaster.error('Please select a file');
      return;
    }
    if (
      !this.formData.associated_entities.length &&
      this.current_selected_entity_type != keywordConstants.Firm
    ) {
      this.toaster.error(
        `Please select a ${this.current_selected_entity_type}`
      );
      return;
    }

    this.loading = true;
    this.selected_entity_id =
      this.current_selected_entity_type == keywordConstants.Firm
        ? this.current_firm?.id
        : this.formData.associated_entities.length &&
          this.formData.associated_entities[0].id;
    this.uploadWordFile();
  }

  handleFileUpload(file) {
    this.files = file;
  }

  uploadWordFile() {
    let templateParams = {
      entity_id: this.selected_entity_id,
      entity_type: this.enumEntityType[this.current_selected_entity_type],
      selected_entity_type:
        this.enumEntityType[this.current_selected_entity_type],
      selected_entity_id: this.selected_entity_id,
      name:
        this.files[0].name +
        '_' +
        this.Utils.formatDatetimeForSuggestedName(moment()),
      responseDateStamp: this.datePipe.transform(
        this.responseDate,
        'MM-dd-yyyy'
      ),
    };
    let url = `excel_parser/upload?parserType=Word&entity_type=${
      this.current_selected_entity_type
    }&entity_id=${templateParams.entity_id}&investor_id=${null}`;
    const payload = new FormData();
    let fl = this.files[0];
    payload.append('file', fl);
    this.templateService.uploadTemplateFile(url, payload).subscribe(
      (response: any) => {
        this.parserService.setWordParserData(response);
        this.parserService.setOriginalWordFile(this.files);

        if (templateParams)
          this.parserService.setTemplateParams(templateParams);
        else
          this.parserService.setTemplateParams({
            name: this.files[0].name,
          });

        response.file = this.files;

        this.router.navigateWithParams('app.diligence.word_to_template', {
          doc_id: response.doc_id,
          type: 'QA',
        });
        this.CustomModalService.close();
        this.loading = false;
      },
      (err) => (this.loading = false)
    );
  }
}
