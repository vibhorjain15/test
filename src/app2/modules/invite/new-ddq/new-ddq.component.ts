import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  DiligenceTypeEnum,
  errorMessageMap,
  keywordConstants,
  Regex,
  requestSteps,
  RequestTypes,
} from 'src/app2/shared/constants/constant';

import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';

import { FormControl, FormGroup, Validators } from '@angular/forms';

import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { finalize, take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import {
  DvValidators,
  noHtmlValidator,
} from 'src/app2/shared/validators/no-white-space.validator';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';
import { DvSelectComponent } from 'src/app2/shared/components';
import { NewDdqService } from './new-ddq.service';
import { DatePipe } from '@angular/common';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { validateAllFormFields } from 'src/app2/utils/validateAllFormFields';

@Component({
  styleUrls: ['./new-ddq.component.css'],
  templateUrl: './new-ddq.component.html',
})
export class DiligenceNewddqComponent implements OnInit, OnDestroy {
  @ViewChild('ddInvestor') ddInvestor: DvSelectComponent;
  @ViewChild('ddProduct') ddProduct: DvSelectComponent;
  @ViewChild('ddStrategy') ddStrategy: DvSelectComponent;
  @ViewChild('ddVehicle') ddVehicle: DvSelectComponent;
  @ViewChild('ddTemplate') ddTemplate: DvSelectComponent;
  is_data_loaded: boolean;
  loading_data: boolean;
  suggested_due_date_diff: number = 45;
  alltemplates: any;
  request: any;
  requestId: any;
  headerText: string;
  shownMap: {
    investor: boolean;
    product: boolean;
    template: boolean;
    name: boolean;
    dueDate: boolean;
    asOfDate: boolean;
  };
  current_firm: any;
  minDate: any;
  maxDate: any;
  maxAsOfDate: any;
  accepted = '.docx,.xlsx';
  RequestTypes = RequestTypes;
  funds: any;
  investors: any;
  loading_request: boolean;
  templates: any;
  investor_request_form: any;
  requestSteps = requestSteps;
  // pending_requests: any = [];
  loading: boolean;
  creating_ddq: boolean;
  toastInstance: any;
  ddqForm: FormGroup;
  dueDateError: boolean = false;
  files: any;
  optionType: string;
  parserType;
  source = 'InformationRequestFlow';
  saving_template;
  @Select(UserState.getCurrentUserData) user;

  Regex = Regex;
  errorMessageMap = errorMessageMap;
  investorLoading = false;
  current_selected_entity_type: any;
  vehicles: any;
  strategies: any;
  entityTypes: any[];
  keywordConstants = keywordConstants;
  parserService: any;
  suggestedDueDate: any;
  suggestedAsOfDate: any;

  constructor(
    private readonly router: RouterService,
    private readonly toaster: ToastrService,
    private readonly DueDiligenceDataservice: DueDiligenceDataService,
    private readonly oldTemplateDataService: TemplateDataService,
    private readonly newTemplateDataService: TemplatesDataService,
    private readonly Utils: UtilsService,
    private readonly customModalService: CustomModalService,
    private readonly datePipe: DatePipe,
    private readonly routerService: RouterService,
    private newDdqService: NewDdqService
  ) {
    this.openAddInvestorModal = this.openAddInvestorModal.bind(this);
    this.openAddProductModal = this.openAddProductModal.bind(this);
    this.openAddStrategyModal = this.openAddStrategyModal.bind(this);
    this.openAddVehicleModal = this.openAddVehicleModal.bind(this);
    this.openAddTemplateModal = this.openAddTemplateModal.bind(this);
  }

  async ngOnInit() {
    this.entityTypes = this.getEntityTypes();
    this.newDdqService.cancelDestroyData(); // This function will not clear all the past data of Entities and investors
    this.current_selected_entity_type = '';
    this.suggestedDueDate = this.getSuggestedDueDate();
    this.suggestedAsOfDate = new Date();
    this.ddqForm = new FormGroup({
      investorId: new FormControl(null, [
        Validators.required,
        Validators.pattern('\\d+'),
      ]),
      entityType: new FormControl(null, [Validators.required]),
      entityId: new FormControl(null, [
        Validators.required,
        Validators.pattern('\\d+'),
      ]),
      isFirmDd: new FormControl(null, []),

      name: new FormControl(null, [
        DvValidators.required,
        Validators.maxLength(320),
        Validators.pattern(Regex.avoidFirstSplCharacter),
        noHtmlValidator,
      ]),
      templateId: new FormControl(null, []),
      questionnaire: new FormControl(null, []),
      is_firm_dd: new FormControl(null, []),
      due_at: new FormControl(null, [Validators.required]),
      as_of_date: new FormControl(null, [Validators.required]),
      reuseQuestionnaireCheck: new FormControl(null, []),
    });

    this.is_data_loaded = false;
    this.loading_data = true;

    this.alltemplates = [];
    //initialise investor_id, template_id and entity_id to empty string to fix the selected of undefined error in the select
    this.request = {
      is_firm_dd: null,
      investor_id: null,
      duediligence_type: null,
      due_at: this.getSuggestedDueDate(),
      template_id: null,
      entity_id: null,
      name: null,
      type: null,
      as_of_date: new Date(),
    };

    this.requestId = this.router.getState().params.request;

    this.headerText = '';
    //maintain an object in which the key will be the attribute to display and the value will be the boolean value
    //representing whether the particular attribute is shown or not.
    this.shownMap = {
      investor: false,
      product: false,
      template: false,
      name: false,
      dueDate: false,
      asOfDate: false,
    };

    this.user.pipe(take(1)).subscribe(async (user) => {
      if (user) {
        this.current_firm = JSON.parse(JSON.stringify(user.firmInfo));
        if (this.Utils.isParserAngular())
          this.parserService = this.newTemplateDataService;
        else this.parserService = this.oldTemplateDataService;
        this.newDdqService.setTemplateService(this.parserService);

        this.minDate = new Date();
        this.maxDate = new Date();
        this.maxAsOfDate = moment().add(1, 'month').toDate();

        this.alltemplates = await this.newDdqService
          .getTemplates({
            detail: false,
            include_associated_firms: true,
          })
          .toPromise();

        if (this.requestId) {
          this.getRequest();
        } else {
          this.changeRequestType(
            null,
            this.router.getState().params.type ?? RequestTypes.INVESTOR,
            false
          );
        }
      }
    });
  }

  getEntityTypes() {
    return [
      {
        name: keywordConstants.Firm,
        label: 'My ' + this.Utils.getDisplayEntityType(keywordConstants.Firm),
      },
      {
        name: keywordConstants.Strategy,
        label: this.Utils.getDisplayEntityType(keywordConstants.Strategy),
      },
      {
        name: keywordConstants.Product,
        label: this.Utils.getDisplayEntityType(keywordConstants.Product),
      },
      {
        name: keywordConstants.Vehicle,
        label: this.Utils.getDisplayEntityType(keywordConstants.Vehicle),
      },
    ];
  }

  async init(tabChange) {
    if (!this.funds) {
      const funds: any = await this.newDdqService
        .getProducts({
          include_contacts: false,
          include_custom_fields: false,
          include_dates: false,
          is_active: true,
          filters: {},
        })
        .toPromise();
      this.funds = funds?.data?.filter((val) => val?.name);
    }
    if (!this.strategies) {
      const strategies: any = await this.newDdqService
        .getStrategies({
          include_contacts: false,
          include_custom_fields: false,
          include_dates: true,
          is_active: true,
          filters: {},
          search_for: 'strategy',
        })
        .toPromise();

      this.strategies = strategies?.data?.filter((val) => val?.name);
    }
    if (!this.vehicles) {
      const vehicles: any = await this.newDdqService
        .getVehicles({
          include_contacts: false,
          include_custom_fields: false,
          include_dates: true,
          is_active: true,
          filters: {},
        })
        .toPromise();

      this.vehicles = vehicles?.data?.filter((val) => val?.name);
    }

    if (
      this.request.type.toLowerCase() ===
        this.RequestTypes.INVESTOR.toLowerCase() &&
      !this.investors
    ) {
      const investors: any = await this.newDdqService
        .getInvestors()
        .toPromise();
      this.investors = investors.results;
    }
    this.loadDefaultSettings(tabChange);
  }

  //Function to check if the route has any ids or types present
  loadDefaultSettings(tabChange) {
    let routerParams = this.routerService.getState().params;
    const entityType = routerParams.entity_type;
    const entityId = routerParams.entity_id;
    const type = routerParams.type;
    let found = 0;

    if (entityId && type && entityType) {
      if (tabChange) {
        this.router.navigateWithParams('app.diligence.newddq', {
          type: this.request.type,
          entity_id: entityId,
          entity_type: entityType,
        });
      }
      this.setEntity(entityType);

      if (entityType !== keywordConstants.Firm) {
        if (entityType === keywordConstants.Product)
          found = this.funds.find((fund) => fund.id == entityId);
        else if (entityType === keywordConstants.Strategy)
          found = this.strategies.find((strat) => strat.id == entityId);
        else if (entityType === keywordConstants.Vehicle)
          found = this.vehicles.find((vehicles) => vehicles.id == entityId);

        if (!found) {
          this.loading_data = false;
          this.toaster.error('Entity not found');
          return;
        }
        this.setEntities(entityId, entityType);
      }
    } else {
      if (tabChange)
        this.router.navigateWithParams('app.diligence.newddq', {
          type: this.request.type,
        });
    }

    this.loading_data = false;
  }

  getRequest() {
    this.loading_request = true;

    this.DueDiligenceDataservice.getRequest(this.requestId).subscribe(
      (response: { type: any }) => {
        this.setRequestType(response.type);
        this.prefillData(response);
        this.loading_request = false;
      }
    );
  }

  getSuggestedDueDate() {
    return moment().add(this.suggested_due_date_diff, 'days').toDate();
  }
  setSuggestedDueDate() {
    this.handleDueDate(this.suggestedDueDate);
  }
  setSuggestedAsOfDate() {
    this.handleAsOfDate(this.suggestedAsOfDate);
  }
  filterTemplates() {
    if (this.request['duediligence_type'] === 'dd_profile') {
      this.templates = this.alltemplates.filter(
        (template) => template.type === 'dd_profile'
      );
    } else {
      this.templates = this.alltemplates.filter(
        (template) => template.type !== 'dd_profile'
      );
    }
  }

  setDDType(type: { toLowerCase: () => any }) {
    if (
      type.toLowerCase() === this.RequestTypes.SHAREABLE.toLowerCase() ||
      type.toLowerCase() === this.RequestTypes.INVESTOR.toLowerCase()
    ) {
      this.request['duediligence_type'] = 'dd_new';
    } else if (
      type.toLowerCase() === this.RequestTypes.PREAPPROVED.toLowerCase()
    ) {
      this.request['duediligence_type'] = 'dd_profile';
    }
  }

  setRequestType(request: any, tabChange = false) {
    this.resetParams();
    this.request['type'] = request;
    this.setDDType(request);
    this.init(tabChange);
    this.filterTemplates();
    this.checkAllFields();
    this.disableFields();
  }

  disableFields() {
    this.disableTemplateSelection(false);
  }

  changeRequestType(event, type: any, tabChanged = false) {
    if (event) event.stopPropagation();
    if (type === this.RequestTypes.INVESTOR) {
      this.ddqForm.get('investorId').enable();
    } else {
      this.ddqForm.get('investorId').disable();
    }
    this.current_selected_entity_type = '';
    this.ddqForm.patchValue({
      entityType: null,
      entityId: null,
    });
    this.ddqForm.updateValueAndValidity();
    this.setRequestType(type, tabChanged);
  }

  prefillData(request: any) {
    this.request = JSON.parse(JSON.stringify(request));
    this.setDDType(this.request.type);
    if (
      this.request.entity_type &&
      this.request.entity_type.toLowerCase() ===
        keywordConstants.Firm.toLowerCase()
    ) {
      this.ddqForm.patchValue({
        is_firm_dd: true,
      });
      this.request.entity_id = null;
    }

    if (this.request.due_at) {
      this.request.due_at = moment(this.request.due_at).toDate();
    }
    if (this.request.as_of_date) {
      this.request.as_of_date = moment(this.request.as_of_date).toDate();
    }

    return this.checkAllFields();
  }

  getRequestLabel(latest_step: any) {
    switch (latest_step) {
      case this.requestSteps.DOC_PARSER:
        return 'DOCUMENT PARSER';
      case this.requestSteps.EXCEL_PARCER:
        return 'EXCEL PARSER';
      case this.requestSteps.TEMPLATE_BUILDER:
        return 'TEMPLATE BUILDER';
      case this.requestSteps.COMPLETE_REQUEST:
        return 'REQUEST COMPLETION';
      default:
        return '';
    }
  }

  resetParams() {
    this.request.is_firm_dd = null;
    this.request.due_at = this.getSuggestedDueDate();
    this.request.template_id = null;
    this.request.entity_id = null;
    this.request.name = null;
    this.request.investor_id = null;
    this.request.as_of_date = new Date();

    this.ddqForm.patchValue({
      investorId: null,
      entityId: null,
      isFirmDd: null,
      name: null,
      templateId: null,
      is_firm_dd: null,
      questionnaire: null,
      reuseQuestionnaireCheck: null,
      // filter_all_templates: null,
    });
    this.ddqForm.get('questionnaire').setValidators([]);
    this.ddqForm.get('questionnaire').updateValueAndValidity();
    validateAllFormFields(this.ddqForm, false);
    this.checkAllFields();
  }

  createDueDiligence() {
    validateAllFormFields(this.ddqForm);
    if (this.dueDateError) return;
    const {
      templateId,
      investorId,
      entityId,
      name,
      is_firm_dd,
      entityType,
      as_of_date,
      due_at,
    } = this.ddqForm.value;

    if (this.ddqForm.get('reuseQuestionnaireCheck').value && !templateId) {
      this.toaster.error('Please select valid questionnaire');
      return;
    } else if (
      !this.ddqForm.get('reuseQuestionnaireCheck').value &&
      !this.ddqForm.get('questionnaire').value
    ) {
      this.toaster.error('Please upload questionnaire file');
      return;
    }

    if (this.ddqForm.valid) {
      this.creating_ddq = true;
      this.newDdqService.createDiligence(
        templateId,
        investorId,
        entityId,
        name,
        is_firm_dd,
        entityType,
        this.datePipe.transform(due_at, 'MM-dd-yyyy'),
        this.datePipe.transform(as_of_date, 'MM-dd-yyyy'),
        this.current_firm,
        this.request.duediligence_type,
        () => {
          this.creating_ddq = false;
        },
        () => {
          this.creating_ddq = false;
        }
      );
    }
  }

  openAddInvestorModal(name: any) {
    this.ddInvestor?.close();
    return this.newDdqService.handleAddInvestor(name, (investor) => {
      this.investors = this.investors.concat(investor);
      this.request.investor_id = investor.id;
      this.ddqForm.patchValue({
        investorId: investor.id,
      });
      return this.checkAllFields();
    });
  }

  openAddProductModal(name: any) {
    this.ddProduct?.close();
    return this.newDdqService.handleAddProduct(name, (product) => {
      this.funds = this.funds.concat(product);
      this.request.entity_id = product.id;
      this.ddqForm.patchValue({
        entityId: this.request.entity_id,
      });
      return this.checkAllFields();
    });
  }

  openAddStrategyModal(name: any) {
    this.ddStrategy?.close();
    return this.newDdqService.handleAddStrategy(name, (strategy) => {
      this.strategies = this.strategies.concat(strategy);
      this.request.entity_id = strategy.id;
      this.ddqForm.patchValue({
        entityId: this.request.entity_id,
      });
      return this.checkAllFields();
    });
  }

  openAddVehicleModal(name: any) {
    this.ddVehicle?.close();
    return this.newDdqService.handleAddVehicle(name, (vehicle) => {
      this.vehicles = this.vehicles.concat(vehicle);
      this.request.entity_id = vehicle.id;
      this.ddqForm.patchValue({
        entityId: this.request.entity_id,
      });
      return this.checkAllFields();
    });
  }

  openAddTemplateModal(
    name: any,
    selectedOptionType: any = requestSteps.TEMPLATE_BUILDER
  ) {
    this.ddTemplate?.close();
    let optionType: any, templateType: string;

    if (
      !this.ddqForm.value.entityType ||
      !(this.ddqForm.value.is_firm_dd
        ? this.current_firm.id
        : this.ddqForm.value.entityId)
    ) {
      this.ddqForm.markAllAsTouched();
      this.toaster.error('Please select an entity');
      return;
    }

    if (!this.ddqForm.value.name) {
      this.ddqForm.markAllAsTouched();
      this.toaster.error('Please enter the project name');
      return;
    }

    if (
      this.request.type.toLowerCase() ===
        this.RequestTypes.SHAREABLE.toLowerCase() ||
      this.request.type.toLowerCase() ===
        this.RequestTypes.INVESTOR.toLowerCase()
    ) {
      templateType = 'dd_new';
      optionType = this.requestSteps.DOC_PARSER;
    } else if (
      this.request.type.toLowerCase() ===
      this.RequestTypes.PREAPPROVED.toLowerCase()
    ) {
      templateType = 'dd_profile';
    }

    if (selectedOptionType) {
      optionType = selectedOptionType;
    }

    const params = {
      pageUrl: this.newDdqService.generatePageUrl(
        this.request.entity_type,
        this.request.entity_id,
        this.current_firm
      ),
    };

    this.request.params = JSON.stringify(params);
    const localParams: any = {};
    this.request.investor_id = this.ddqForm.value.investorId;
    this.request.entity_type = this.ddqForm.value.entityType;
    this.request.entity_id = this.ddqForm.value.is_firm_dd
      ? this.current_firm.id
      : this.ddqForm.value.entityId;

    this.request.name = this.ddqForm.value.name;
    this.request.template_id = this.ddqForm.value.templateId;

    localParams.apiParams = this.request;
    localParams.pageUrl = this.newDdqService.generatePageUrl(
      this.request.entity_type,
      this.request.entity_id,
      this.current_firm
    );

    this.parserService.setDiligenceParams(localParams);
    this.customModalService.invoke('new-template', {
      initialState: {
        pendingrequest: this.request,
        templateOptions: {
          templateType,
          optionType,
          templateName: typeof name == 'string' ? name : null,
        },
        source: 'InformationRequestFlow',
      },
    });
    return;
  }

  onInvestorChange() {
    this.checkAllFields();
    this.filterTemplates();
  }

  onProductChange() {
    const { entityId, is_firm_dd } = this.ddqForm.value;
    if (is_firm_dd || (!is_firm_dd && !entityId)) {
      this.ddqForm.patchValue({
        entityId: null,
      });
    }
    this.checkAllFields();
  }
  setEntity(entityName) {
    if (entityName == keywordConstants.Firm) {
      this.request.is_firm_dd = true;
    }
    this.ddqForm.patchValue({
      entityType: entityName,
      entityId:
        entityName == keywordConstants.Firm ? this.current_firm.id : null,
      is_firm_dd: entityName == keywordConstants.Firm,
    });

    this.request.is_firm_dd = false;
    this.current_selected_entity_type = entityName;
    this.checkAllFields();
  }

  setEntities(selectedOption, entityType) {
    this.ddqForm.patchValue({
      entityType: entityType,
      is_firm_dd: false,
      entityId: +selectedOption,
    });
    this.request.is_firm_dd = false;
    const { entityId, is_firm_dd } = this.ddqForm.value;
    this.checkAllFields();
  }

  onTemplateChange() {
    this.checkAllFields();
  }

  checkConditionsForDisplay(field: string | number) {
    //instead of adding the conditions in the template, we added the conditions here
    switch (field) {
      case 'investor':
        this.shownMap[field] = false;
        if (
          this.request.type &&
          this.request.type.toLowerCase() ===
            this.RequestTypes.INVESTOR.toLowerCase()
        ) {
          this.shownMap[field] = true;
        }
        break;
      case 'template':
        this.shownMap[field] = false;
        if (this.request.type) {
          this.shownMap[field] = true;
        }
        break;
      case 'product':
        this.shownMap[field] = false;
        if (this.request.type) {
          this.shownMap[field] = true;
        }
        break;
      case 'name':
        this.shownMap[field] = false;
        if (this.request.type) {
          this.shownMap[field] = true;
        }
        break;
      case 'dueDate':
        this.shownMap[field] = false;
        if (
          this.request.type &&
          this.request.type.toLowerCase() !==
            this.RequestTypes.PREAPPROVED.toLowerCase()
        ) {
          this.shownMap[field] = true;
        }
        break;
      case 'asOfDate':
        this.shownMap[field] = false;
        if (this.request.type) {
          this.shownMap[field] = true;
        }
        break;
    }
  }

  checkInvestor() {
    return (
      this.request.type !== 'investor_request' || this.ddqForm.value.investorId
    );
  }

  checkOnlyInvestor() {
    return this.request.type === this.RequestTypes.INVESTOR;
  }

  checkProduct() {
    return this.ddqForm.value.entityId || this.ddqForm.value.is_firm_dd;
  }

  checkTemplate() {
    return this.request.template_id;
  }

  checkAllFields() {
    //this function calls the checkConditionsForDisplay method for each entry in the shownMap object.
    Object.keys(this.shownMap).forEach((key: any) => {
      this.checkConditionsForDisplay(key);
    });
  }

  disableTemplateSelection(value) {
    if (this.request.type && !value) {
      this.ddqForm.get('templateId').disable();
    } else {
      this.ddqForm.get('templateId').enable();
    }
  }

  getSuggestedProjectName() {
    let entityName: string, investorName: string;
    const { investorId, entityId, is_firm_dd, entityType } = this.ddqForm.value;
    if (investorId && investorId !== '') {
      const investor = this.investors.find((investor: { id: any }) => {
        return investor.id === investorId;
      });
      if (investor) {
        investorName = investor.name + '_';
      } else {
        investorName = '';
      }
    } else {
      investorName = '';
    }

    if (is_firm_dd) {
      entityName = this.current_firm.name + '_';
    } else if (entityId && entityId !== '') {
      let entity;
      if (entityType === keywordConstants.Strategy)
        entity = this.strategies.find((strat: { id: any }) => {
          return strat.id === entityId;
        });
      else if (entityType === keywordConstants.Vehicle)
        entity = this.vehicles.find((vehicle: { id: any }) => {
          return vehicle.id === entityId;
        });
      else if (entityType === keywordConstants.Product)
        entity = this.funds.find((fund: { id: any }) => {
          return fund.id === entityId;
        });
      if (entity) {
        entityName = entity.name + '_';
      } else {
        entityName = '';
      }
    } else {
      entityName = '';
    }

    const dateInfo = this.Utils.formatDatetimeForSuggestedName(moment());

    return `${investorName}${entityName}${dateInfo}`;
  }

  handleReuseQuestionnaire(value) {
    if (!value) {
      this.ddqForm.patchValue({
        templateId: null,
      });
      this.ddqForm.get('templateId').disable();
      this.ddqForm.get('questionnaire').setValidators([Validators.required]);
    } else {
      this.ddqForm.get('questionnaire').setValidators([]);
      this.ddqForm.get('templateId').enable();
    }
    this.ddqForm.get('questionnaire').updateValueAndValidity();
  }

  setSuggestedProjectName() {
    this.ddqForm.patchValue({ name: this.getSuggestedProjectName() });
  }

  trackById(index: number, val: any): number {
    return val.id;
  }
  trackByKey(index: number, val: any): number {
    return val.key;
  }
  trackByInvestorId(index: number, val: any): number {
    return val.investor_id;
  }

  handleDateValidation() {
    this.dueDateError = moment(this.ddqForm.get('as_of_date').value).isAfter(
      this.ddqForm.get('due_at').value,
      'day'
    );
  }

  handleAsOfDate(date) {
    this.request.as_of_date = date;
    this.ddqForm.patchValue({
      as_of_date: date,
    });
    this.handleDateValidation();
  }

  handleDueDate(date) {
    this.request.due_at = date;
    this.ddqForm.patchValue({
      due_at: date,
    });
    this.handleDateValidation();
  }

  handleQuestionnaireUpload(response: any) {
    if (response.length > 0) {
      this.files = response;
      this.ddqForm.patchValue({
        questionnaire: response[0].name,
      });
    }
  }

  uploadParserFile() {
    const {
      templateId,
      entityId,
      entityType,
      name,
      as_of_date,
      investorId,
      is_firm_dd,
      due_at,
    } = this.ddqForm.value;

    this.saving_template = true;
    let parserParams = this.newDdqService.getParserParams(
      this.files,
      this.ddqForm.get('name').value,
      'questionnaire',
      'InformationRequestFlow',
      DiligenceTypeEnum.dd_new
    );

    this.newDdqService.uploadParserFileNewProjectFlow(
      this.files,
      parserParams.parserType,
      parserParams.templateParams,
      entityType,
      entityId,
      this.current_firm,
      name,
      as_of_date,
      due_at,
      templateId,
      investorId,
      DiligenceTypeEnum.dd_new,
      () => {
        this.saving_template = false;
      },
      () => {
        this.saving_template = false;
      }
    );
  }

  handleGoBack() {
    window.history.back();
  }

  ngOnDestroy(): void {
    this.newDdqService.destroyData();
  }
}
