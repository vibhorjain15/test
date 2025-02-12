import { HttpClient } from '@angular/common/http';
import {
  Component,
  NgZone,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import * as moment from 'moment';
import { TooltipDirective } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { ModalService } from 'src/app2/services/modal.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { DatePickerComponent } from 'src/app2/shared/components/date-picker/date-picker.component';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import { DvStepperComponent } from 'src/app2/shared/components/dv-stepper/dv-stepper.component';
import {
  FILTER_TERNARY_OPERATORS,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import {
  DvValidators,
  noHtmlValidator,
} from 'src/app2/shared/validators/no-white-space.validator';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { ReviewGridService } from './service/review.grid';
import { ScheduledRequestGridService } from './service/scheduled-request.grid';
import { shortDateFormat } from './util/date.util';
import { InvestorService, filterEnum } from './service/investor.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'investor-invite',
  templateUrl: './investor.component.html',
  styleUrls: ['./investor.component.css'],
})
export class DiligenceInviteInvestor implements OnInit {
  @ViewChildren(TooltipDirective) items: QueryList<TooltipDirective>;
  @ViewChildren(DatePickerComponent) calendars: QueryList<DatePickerComponent>;
  assignedApprovers: any;
  assignedApproversList: any;
  nextBtnText: string;
  saveAsDraft: boolean;
  isPendingOrDraftRequestSelected: boolean;
  is_pending_data_loaded: boolean;
  selectedRequestDraftId: any;
  currentUserId: any;
  currentUserIsApprover: boolean;
  display_wizard_top_back_button: boolean;
  email_templates: any;
  internalSubscribers: any;
  review_entity_type: string;
  review_diligence_templates: any;
  resetStepsArray: boolean;
  selected_entities: any = [];
  selected_funds: any;
  combinedDiligences: any;
  filters_section: any;
  filter: any;
  selected_vehicles: any = [];
  showReviewDDFlow: boolean;
  sender_emails: any;
  selection_list: any = [];
  cc_emails: any;
  bcc_emails: any;
  use_email_templates: boolean;
  disallow_custom_edits: boolean;
  email_text: string = '';
  due_date_map: any;
  request: any;
  minDate: any;
  maxAsOfDate: any;
  is_data_loaded: boolean;
  is_admin: any;
  entity_type: any;
  currentUser: any;
  selected_sender_email: string;
  selected_cc_email_list: any;
  selected_bcc_email_list: any;
  showAdvanceOptions: boolean;
  show_bulk_edit_actions: boolean;
  minDateEditSection: any;
  scheduled_diligences_scheduled_date: any;
  scheduled_diligences_due_date: any;
  loading: boolean;
  maxSelectedTemplates: number;
  maxSelectedVehicleTemplates: number;
  selectedFilters: any;
  selectedSubFilters: any;
  selectedGlobalTernaryOperator: any;
  selectedSubGlobalTernaryOperator: any;
  allFilterTemplateId: any;
  allSubFilterTemplateId: any;
  filterApplied: boolean;
  subFilterApplied: boolean;
  unfilteredSelectedEntities: any;
  unfilteredSelectedSubEntities: any;
  entitySearchMap: any;
  subEntitySearchMap: any;
  showMainFilterBasedSelection: boolean;
  showSubFilterBasedSelection: boolean;
  mainFilterSelectionValid: boolean;
  subFilterSelectionValid: boolean;
  subdd_for: string;
  selectedSubEntities: any;
  $scope: any;
  dd_for: string;
  Restangular: any;
  events: any;
  firm_preferences: any;
  default_email_template_message_id: any;
  keywordConstants: any = keywordConstants;
  templates: any;
  $q: any;
  dateFiltersMap: any;
  dateRangeValue: any;
  activeDateRange: any;
  scheduled_diligences: any;
  ScheduledDiligenceResource: any;
  temp_diligences_obj: any;
  $rootScope: any;
  is_loading_scheduled_dds: boolean = false;
  searchByFiltersData: any;
  searchBySubFiltersData: any;
  showVehicles: boolean;
  showFunds: boolean;
  display_entity_selection_error: boolean;
  functions: any;
  teamMembers: any;
  template_selection_form: any;
  review_template_selection_form: any;
  show_review_step: boolean;
  diligencesCopy: any;
  display_wizard_footer: boolean;
  show_dilignece_zero_text: boolean;
  select_all_entities: boolean;
  disable_select_all: boolean;
  show_vehicles_selection_error: boolean;
  show_funds_selection_error: boolean;
  active_step_template: any;
  project_name: any;
  $state: any;
  diligence_funds: any;
  diligence_firms: any;
  diligence_strategies: any;
  diligence_vehicles: any;
  selected_entity_grid: any = null;
  selected_entities_temp: any = [];
  all_selected_entities_arr: any = [];
  all_selected_entities_contacts_arr: any;
  loading_grid: boolean;
  selectedGridResource: any;
  SelectedEntitiesResource: any;
  show_bulk_actions: boolean;
  totalSelectedRecords: any;
  scheduled_diligences_grid: any;
  select_all: boolean;
  final_schedule_diligences_list: any = [];
  review_templates: any = [];
  WizardHandler: any;
  scheduled_dd_project_name_form: any;
  $http: any;
  baseUrl: any;
  total_entity_records: any;
  project_name_form: any;
  accept_confidential_agreement: any;
  autoSubscribeOwners: any;
  requestAuthorJsonData: any;
  toastInstance: any;
  requestDataById: any;
  requestApproverJsonData: any;
  isUnfiltered = false;
  isSubUnfiltered = false;
  questionPageTouched = false;
  diligences = [];
  stateParams;
  templateSelectionForm: FormGroup;
  template = [];
  tinyMceInit;
  reviewTemplateSelectionForm;
  evaluationTemplate: Boolean = false;
  activeReviewTemplate = 0;
  copyOfSelectedEntity = null;
  scheduled_diligences_grid_copy;
  scheduledDiligencesSelectedGrid = {};
  filterAndUnFilteredError = false;
  subfilterAndUnFilteredError = false;
  isOwner;
  templateMap = {};
  gridNameApprovalReview = 'request_approval';
  gridNameReview = 'request_review';
  gridNameScheduled = 'investor-scheduled';

  @ViewChild('grid') gridApi: DvGridComponent; // ref of common grid component to call the deSelect method
  @ViewChild('dvStepper') stepInstance: DvStepperComponent; // ref of common grid component to call the deSelect method
  eventTriggerName: string;

  isFilteredTemplate;
  isSubFilterTemplate;
  filterBy = '';
  @Select(UserState.getCurrentUserData) user$;
  @Select(UserState.getSubscriptionLimitsData) subList;

  filteredListMeta = { count: 0 };

  requestTypes = {
    NewRequest: 'NewRequest',
    ScheduledRequest: 'ScheduledRequest',
  };

  requestType = '';
  isDueDateGreaterThenAsOfDate = false;
  canExitQuestionnaire: boolean = false;
  emailUrl: any;
  hideQuestionnaireIfEntitiesEmpty = false;
  isProductVehicleLoaded = false;
  constructor(
    private readonly http: HttpClient,
    private readonly Utils: UtilsService,
    private readonly router: RouterService,
    private readonly ModalFactory: ModalService,
    private readonly DueDiligenceDataservice: DueDiligenceDataService,
    private readonly toaster: ToastrService,
    private readonly BaseDataService: BaseDataService,
    private readonly ReviewGridService: ReviewGridService,
    private readonly ScheduledRequestGridService: ScheduledRequestGridService,
    private readonly store: Store,
    private readonly SweetAlert: SweetAlertService,
    private readonly investor: InvestorService,
    private readonly customModalService: CustomModalService,
    private readonly datePipe: DatePipe,
    private ngZone: NgZone
  ) {
    this.onRowSelected = this.onRowSelected.bind(this);
  }

  defaultRequest() {
    this.request.as_of_date = new Date();
    this.request.due_at = null;
    this.request.template_id = [];
    this.request.entity_id = null;
    this.request.review_template = [];
    this.request.vehicleTemplate = null;
    this.request.productsTemplate = null;
    this.request.template = null;
    this.request.event_trigger = null;
    if (this.stateParams.templateId != null) {
      const template = this.templates.find(
        (val) => val.id === Number(this.stateParams.templateId)
      );
      if (template) {
        this.request.template = [template];
      }
      this.request.review_template = template;
    }
  }

  ngOnInit() {
    this.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        let userCopy = JSON.parse(JSON.stringify(user));
        this.currentUserId = userCopy.id;
        this.is_admin = userCopy.isAdmin;
        this.isOwner = userCopy.isOwner;
        this.subList.pipe(take(2)).subscribe((sub) => {
          if (sub) this.entity_type = this.Utils.getEntityType(sub[0]);
        });
        this.currentUser = userCopy;
        this.init();
      }
    });
  }

  init(isLoaded = false) {
    this.templateSelectionForm = new FormGroup({
      asOfDate: new FormControl(null, [Validators.required]),
      project_name: new FormControl(null, [
        DvValidators.required,
        noHtmlValidator,
      ]),
    });
    this.reviewTemplateSelectionForm = new FormGroup({
      review_template: new FormControl(null),
    });
    this.tinyMceInit = {
      placeholder: 'Start typing here',
    };
    this.assignedApprovers = [];
    this.assignedApproversList = [];
    this.nextBtnText = 'Send Request';
    this.saveAsDraft = false;
    this.isPendingOrDraftRequestSelected = false;
    this.is_pending_data_loaded = true;
    this.selectedRequestDraftId = null;
    this.currentUserIsApprover = false;
    this.display_wizard_top_back_button = false;

    this.email_templates = [];
    this.internalSubscribers = [];
    this.review_entity_type = 'All';
    this.review_diligence_templates = [];
    this.resetStepsArray = false;
    this.selected_entities = [];
    this.selected_funds = [];
    // @showProjectsSelection = false
    this.combinedDiligences = [];
    this.filters_section = {};
    this.filter = {};
    this.selected_vehicles = [];
    this.showReviewDDFlow = false;
    this.sender_emails = [];
    this.selection_list = [];
    this.cc_emails = [];
    this.bcc_emails = [];
    this.use_email_templates = false;
    this.disallow_custom_edits = false;
    this.email_text = '';
    this.due_date_map = {
      dd_new: 45,
      dd_review: 45,
      dd_ongoing: 30,
      dd_event_related: 10,
    };
    this.request = {
      all_entity_flag: false,
      diligence_reason: null,
      duediligence_type: null,
      as_of_date: new Date(),
      due_at: null,
      template_id: [],
      entity_id: null,
      review_template: [],
      vehicleTemplate: null,
      productsTemplate: null,
      template: null,
      event_trigger: null,
      DDTypeDisplayName: null,
    };
    this.minDate = new Date();
    this.maxAsOfDate = moment().add(1, 'month').toDate();
    this.is_data_loaded = isLoaded;
    this.selected_sender_email = '';
    this.selected_cc_email_list = [];
    this.selected_bcc_email_list = [];
    this.showAdvanceOptions = false;
    this.show_bulk_edit_actions = false;
    this.minDateEditSection = moment().add(1, 'days').toDate();
    this.scheduled_diligences_scheduled_date = this.minDateEditSection;
    this.scheduled_diligences_due_date = this.minDateEditSection;
    this.loading = false;
    this.maxSelectedTemplates = 10000;
    this.maxSelectedVehicleTemplates = 10000;
    this.selectedFilters = [];
    this.selectedSubFilters = [];
    this.selectedGlobalTernaryOperator = FILTER_TERNARY_OPERATORS.AND;
    this.selectedSubGlobalTernaryOperator = FILTER_TERNARY_OPERATORS.AND;

    this.allFilterTemplateId = null;
    this.allSubFilterTemplateId = null;
    this.filterApplied = false;
    this.subFilterApplied = false;
    this.unfilteredSelectedEntities = null;
    this.unfilteredSelectedSubEntities = null;
    this.entitySearchMap = {};
    this.subEntitySearchMap = {};
    this.showMainFilterBasedSelection = false;
    this.showSubFilterBasedSelection = false;
    this.mainFilterSelectionValid = true;
    this.subFilterSelectionValid = true;
    this.subdd_for = '';
    this.selectedSubEntities = [];
    this.stateParams = this.router.getState().params;
    this.totalSelectedRecords = 0;
    this.dd_for = 'Product';
    this.requestType = '';
    this.accept_confidential_agreement = false;
    forkJoin([
      this.http.get('events'),
      this.http.get('firm_preferences'),
      this.http.get('EmailTemplateMessages'),
      this.http.get('templates', {
        params: { detail: false, is_new_information_request: true },
      }),
    ]).subscribe((res: any) => {
      this.is_data_loaded = true;
      if (this.default_email_template_message_id && this.use_email_templates) {
        this.renderEmailTemplate(this.default_email_template_message_id);
      }

      const [events, firmPreferences, emailTemplates, templates] = res;
      this.events = events;
      this.email_templates = emailTemplates;

      let response = this.filterbyStandardTemplate(templates);
      this.templates = response;
      this.templates.map((tem) => {
        this.templateMap[tem.id] = tem;
      });

      if (this.stateParams.templateId != null) {
        const template = response.find(
          (val) => val.id === Number(this.stateParams.templateId)
        );
        if (template) {
          this.request.template = [template];
        }
        this.request.review_template = template;
      }
      if (this.stateParams.type === 'pending_requests') {
        setTimeout(() => {
          this.setDDType('dd_pending');
          if (this.stateParams.requestId) {
            this.goToRequestDetailPage(this.stateParams.requestId);
          }
        }, 1000);
      }

      this.firm_preferences = firmPreferences;

      this.assignedApprovers =
        firmPreferences.approver_list_for_information_request;

      this.getTeamMembers();
      this.getFunctions();

      this.default_email_template_message_id =
        firmPreferences.default_email_template_message_id;
      if (firmPreferences.disallow_custom_email_template_edit) {
        this.disallow_custom_edits = true;
        this.use_email_templates = true;
      }

      if (firmPreferences.customize_intro) {
        this.use_email_templates = true;
      }

      if (
        firmPreferences.set_firm_entity_default &&
        firmPreferences.set_firm_entity_default.toLowerCase() ===
          this.keywordConstants.Firm.toLowerCase()
      ) {
        this.setDDFor('Firm');
      } else {
        this.setDDFor('Product');
      }

      if (firmPreferences.sender_email) {
        this.sender_emails = firmPreferences.sender_email
          .replace(/\s/g, '')
          .split(',');
        this.sender_emails = this.sender_emails.map((ccEmail) => {
          return {
            id: ccEmail,
            name: ccEmail,
          };
        });
        if (
          this.sender_emails.length > 0 &&
          this.firm_preferences.add_sender_email
        ) {
          this.selected_sender_email = this.sender_emails[0].name;
        }
      }

      if (firmPreferences.cc_email) {
        this.cc_emails = firmPreferences.cc_email.replace(/\s/g, '').split(',');
        this.cc_emails = this.cc_emails.map((ccEmail) => {
          return {
            id: ccEmail,
            name: ccEmail,
          };
        });
        if (this.cc_emails.length > 0 && this.firm_preferences.add_cc_email) {
          this.selected_cc_email_list.push(this.cc_emails[0].name);
        }
      }

      if (firmPreferences.bcc_email) {
        this.bcc_emails = firmPreferences.bcc_email
          .replace(/\s/g, '')
          .split(',');
        this.bcc_emails = this.bcc_emails.map((bccEmail) => {
          return {
            id: bccEmail,
            name: bccEmail,
          };
        });
        if (this.bcc_emails.length > 0 && this.firm_preferences.add_cc_email) {
          this.selected_bcc_email_list.push(this.bcc_emails[0].name);
        }
      }
    });

    this.dateFiltersMap = [
      {
        name: 'Current Month',
        value: 'current-month',
      },
      {
        name: 'Next Month',
        value: 'next-month',
      },
      {
        name: 'Next Three Months',
        value: 'next-three-months',
      },
      {
        name: 'Show All',
        value: 'show-all',
      },
    ];

    this.dateRangeValue = [undefined, undefined];

    this.activeDateRange = null;

    this.scheduled_diligences = {
      type: 'scheduled',
      start_date: this.dateRangeValue[0],
      end_date: this.dateRangeValue[1],
    };

    this.temp_diligences_obj = null;

    this.accept_confidential_agreement = false;
    this.emailUrl = this.handleEmailRouter();
  }

  beforeLoadingQuestionnaireSelect() {
    let filter: {
        hasOwnProperty: (arg0: string) => any;
        condition: any;
        advance_filter_value: string;
      },
      index: number;
    this.getSelectedEntitiesCount();
    this.searchByFiltersData = [];
    this.selected_entities = this.selected_entities.filter(
      (entity: { notification_contacts: { length: any } }) =>
        entity.notification_contacts.length
    );

    for (index = 0; index < this.selectedFilters.length; index++) {
      filter = this.selectedFilters[index];
      if (filter) {
        if (
          filter.hasOwnProperty('condition') &&
          filter.hasOwnProperty('advance_filter_value') &&
          filter.condition !== null &&
          filter.advance_filter_value !== null &&
          filter.advance_filter_value !== '' &&
          filter.advance_filter_value !== undefined
        ) {
          this.searchByFiltersData.push(filter);
        }
      }
    }
    if (this.searchByFiltersData.length === 0) {
      this.filterApplied = false;
      this.showMainFilterBasedSelection = false;
    } else {
      this.filterApplied = true;
    }

    this.searchBySubFiltersData = [];
    for (index = 0; index < this.selectedSubFilters.length; index++) {
      filter = this.selectedSubFilters[index];
      if (filter) {
        if (
          filter.hasOwnProperty('condition') &&
          filter.hasOwnProperty('advance_filter_value') &&
          filter.condition !== null &&
          filter.advance_filter_value !== null &&
          filter.advance_filter_value !== '' &&
          filter.advance_filter_value !== undefined
        ) {
          this.searchBySubFiltersData.push(filter);
        }
      }
    }
    if (this.searchBySubFiltersData.length === 0) {
      this.subFilterApplied = false;
      this.showSubFilterBasedSelection = false;
    } else {
      this.subFilterApplied = true;
    }

    if (this.dd_for === 'Product' && this.showVehicles) {
      this.selectedSubEntities = this.selected_vehicles;
      if (this.request.vehicleTemplate) {
        this.selectedSubEntities.forEach((entity) => {
          entity.templates = this.request.vehicleTemplate;
        });
      }
      this.subdd_for = 'Vehicle';
    } else if (this.dd_for === 'Strategy' && this.showFunds) {
      this.selectedSubEntities = this.selected_funds;
      if (this?.request?.productsTemplate) {
        this.selectedSubEntities.forEach((entity) => {
          entity.templates = this.request.productsTemplate;
        });
      }
      this.subdd_for = 'Product';
    }
  }

  getSelectedEntitiesCount() {
    if (this.dd_for === 'Product' && this.showVehicles) {
      this.maxSelectedTemplates = 1;
      this.maxSelectedVehicleTemplates = 1;
      if (this.request.template && this.request.template.length > 0) {
        this.request.template = [this.request.template[0]];
      }
      if (
        this.request.vehicleTemplate &&
        this.request.vehicleTemplate.length > 0
      ) {
        this.request.vehicleTemplate = [this.request.vehicleTemplate[0]];
      }
    } else if (this.dd_for === 'Strategy' && this.showFunds) {
      this.maxSelectedTemplates = 1;
      this.maxSelectedVehicleTemplates = 1;
      if (this.request.template && this.request.template.length > 0) {
        this.request.template = [this.request.template[0]];
      }
      if (
        this.request.productsTemplate &&
        this.request.productsTemplate.length > 0
      ) {
        this.request.productsTemplate = [this.request.productsTemplate[0]];
      }
    } else {
      this.maxSelectedTemplates = 10000;
      this.maxSelectedVehicleTemplates = 10000;
    }
  }

  handleScheduleBackEvent() {
    this.stepInstance.previous();
    this.scheduled_diligences_grid = this.scheduled_diligences_grid_copy;
    this.activeDateRange = undefined;
    this.scheduled_diligences_grid = this.scheduled_diligences_grid_copy;
    this.getDataForDateRange([undefined, undefined]);
  }

  handleEntityPrevious(step) {
    // remove products and vehicle if already selected
    this.selected_vehicles = [];
    this.selected_funds = [];
    step.previous();
  }

  handleTemplateStepPrevious(step) {
    this.display_entity_selection_error = false;
    this.selected_entities = [];
    this.selectedFilters = [];
    this.setDDFor('Firm');
    this.resetFilterBasedSelectionAttributes();
    step.previous();
  }
  canProceedToTemplateStep(step) {
    this.show_funds_selection_error = false;
    this.show_vehicles_selection_error = false;
    this.selected_entities = this.selected_entities.filter((entity) => {
      if (entity.filter) {
        if (
          entity.notification_contacts.find(
            (fund_contact) => fund_contact.isFilterApplied
          )
        ) {
          return true;
        }
      } else return true;
    });
    this.copyOfSelectedEntity = this.selected_entities;
    const can_proceed =
      this.areSelectedEntitiesValid() || this.request.all_entity_flag;
    const bouncedEntitiesList = [];
    let allEntitiesList = this.selected_entities;
    const bouncedEmailsList = [];
    const allEmailsList = [];
    let isFilterApplied = [];
    isFilterApplied = this.selected_entities.some((x) => x.filter);
    if (isFilterApplied) {
      // filtering records if filter is applied and checking notification contacts for filter is applied or not
      allEntitiesList = this.selected_entities.filter((x) =>
        x.notification_contacts.some((n: any) => n.isFilterApplied)
      );
    }
    allEntitiesList.forEach((entity: { notification_contacts: any }) => {
      let bouncedContactsCount = 0;
      const notification_contacts = [];
      entity.notification_contacts.forEach((contact: any) => {
        if (!contact.is_removed) {
          allEmailsList.push(contact);
        }
        if (!contact.is_removed) {
          notification_contacts.push(contact);
        }
        if (contact.has_bounce_history && !contact.is_removed) {
          bouncedContactsCount++;
          bouncedEmailsList.push(contact);
        }
      });
      if (
        (bouncedContactsCount === notification_contacts.length &&
          notification_contacts.length > 0) ||
        notification_contacts.length === 0
      ) {
        bouncedEntitiesList.push(entity);
      }
    });

    if (bouncedEmailsList.length > 0 || bouncedEntitiesList.length > 0) {
      this.customModalService.invoke('alert-bounced-contacts', {
        initialState: {
          entitiesList: {
            bounced: bouncedEntitiesList,
            all: allEntitiesList,
            entity_type: this.dd_for,
          },
          contactsList: {
            bounced: bouncedEmailsList,
            all: allEmailsList,
          },
          success: (response: string) => {
            if (response !== 'canceled') {
              if (
                this.selected_entities.length !== bouncedEntitiesList.length
              ) {
                const entIds = bouncedEntitiesList.map((val) => val.id);
                this.selected_entities.forEach((ent: any) => {
                  if (entIds.includes(ent.id)) {
                    ent.is_selected = false;
                  }
                });
                this.selected_entities = JSON.parse(
                  JSON.stringify(
                    this.selected_entities.filter((x) => x.is_selected)
                  )
                );
              }
              if (!can_proceed) {
                this.display_entity_selection_error = true;
              }
              if (can_proceed) {
                this.handleNextClick(step);
                this.items.forEach((x) => x.hide());
              }
            }
          },
        },
      });
    } else {
      if (!can_proceed) {
        this.display_entity_selection_error = true;

        if (this.areSelectedEntitiesValid()) {
          this.display_entity_selection_error = false;

          if (this.request.all_entity_flag) {
            this.display_entity_selection_error = false;
          }
        }
        if (can_proceed) {
          this.handleNextClick(step);
        }
      }
      if (can_proceed) {
        this.handleNextClick(step);
      }
    }
  }

  getDiligenceTemplates() {
    const arr = [];
    const dupes = [];
    this.diligences.map((diligence) => {
      if (dupes.indexOf(diligence.template_id) === -1) {
        arr.push({ id: diligence.template_id, name: diligence.template_name });
        dupes.push(diligence.template_id);
      }
    });
    return arr;
  }

  getFunctions() {
    this.http
      .get('function_assignments', {
        params: {
          entity_id: this.currentUser.firmInfo.id,
          entity_type: 'Firm',
        },
      })
      .subscribe((response: any) => {
        this.functions = response;
      });
  }

  getTeamMembers() {
    this.BaseDataService.getTeamMembers().subscribe((teamMembers: any) => {
      this.teamMembers = teamMembers.map((teamMember) => {
        teamMember.fullName = [teamMember.firstName, teamMember.lastName].join(
          ' '
        );
        return teamMember;
      });
      let currentUser: any = JSON.parse(JSON.stringify(this.currentUser));
      currentUser.type = 'user';
      this.teamMembers.push(currentUser);
      this.internalSubscribers.push(currentUser);
      this.teamMembers.map((member: { id: any }) => {
        this.assignedApprovers.map((assignedApprover: any) => {
          const isUserExisting = this.assignedApproversList.findIndex(
            (x: { id: any }) => x.id === member.id
          );
          if (member.id === assignedApprover && isUserExisting === -1) {
            this.assignedApproversList.push(member);
          }
        });
      });
    });
  }

  showProjectsSelection(template: { id: any }) {
    const ids = this.review_diligence_templates.map((val) => val.id);
    if (ids.indexOf(template.id) > -1) {
      return true;
    } else {
      return false;
    }
  }

  getDataForSteps(data) {
    const selectedTemplate = this.review_templates.find((x) => x.id == data);
    this.request.review_template = selectedTemplate;
    this.getDiligences();
  }

  clearEntityFilter() {
    this.setEntityType(this.review_entity_type);
  }

  getDiligences() {
    if (
      this.request.review_template &&
      this.request.review_template.mapped_templates
    ) {
      const params: any = {};
      params.template_ids = this.request.review_template.mapped_templates.map(
        (val) => val.id
      );
      params.start_date = null;
      params.end_date = null;
      params.include_custom_review_diligences = true;
      params.include_inprogress_diligences = true;
      this.review_diligence_templates = [];
      this.show_review_step = false;
      this.resetStepsArray = false;
      this.diligences = [];
      this.review_diligence_templates = [];
      this.diligencesCopy = [];
      this.display_wizard_footer = false;
      let infoToaster = this.toaster.info('Fetching projects , please wait..');
      this.show_dilignece_zero_text = false;
      this.http.post('diligences/GetByTemplate', params).subscribe(
        (response: any) => {
          this.diligences = response;
          this.toaster.clear();
          if (this.diligences.length) {
            this.display_wizard_footer = true;
          } else {
            this.show_dilignece_zero_text = true;
          }
          this.diligencesCopy = JSON.parse(JSON.stringify(response));
          this.request.is_internal = true;
          this.review_diligence_templates = this.getDiligenceTemplates();
          if (
            this.review_diligence_templates &&
            this.review_diligence_templates.length
          ) {
            this.review_diligence_templates.map(
              (row) => (row.selection_list = [])
            );
          }
        },
        (error: any) => {
          this.toaster.remove(infoToaster.toastId);
        }
      );
    }
  }

  toggleFiltersSection() {
    this.filters_section.show = !this.filters_section.show;
  }

  canProceedToDiligenceSelection(step) {
    if (!this.isValidDueDate()) return;
    this.evaluationTemplate = true;
    let can_proceed = false;
    this.filter.diligence_entity = null;
    if (
      this.diligencesCopy &&
      this.diligencesCopy.length &&
      this.request.due_at
    ) {
      can_proceed = true;
    }
    if (can_proceed) {
      this.calendars.forEach((x) => x?.close());
      step.next();
    }
  }

  canProceedToReviewOpinionDiligenceNext() {
    const selectedDiligences = [];
    let can_proceed = false;
    this.review_diligence_templates.map((entry) => {
      entry.selection_list.map((diligence) => {
        selectedDiligences.push(diligence);
      });
    });
    if (selectedDiligences.length > 0) {
      can_proceed = true;
    }
    if (!can_proceed) {
      const message = 'Please select at least one project!';
      this.toaster.error('', message);
    }
    return can_proceed;
  }

  addToSelection(
    entry: { rowIndex: string | number },
    diligence: { id: any; is_selected: boolean },
    index = null
  ) {
    const ids = this.review_diligence_templates[index].selection_list.map(
      (val) => val.id
    );
    if (!ids.includes(diligence.id)) {
      diligence.is_selected = true;
      this.review_diligence_templates[index].selection_list.push(diligence);
    }
  }

  removeFromSelection(
    entry: {
      selection_list: {
        splice: (arg0: any, arg1: number) => any;
        indexOf: (arg0: any) => any;
      };
    },
    diligence: { entity_type: any }
  ) {
    this.handleDeselection([diligence]);
    entry.selection_list.splice(entry.selection_list.indexOf(diligence), 1);
  }

  clearSelectionList(entry: { selection_list: { length: number } }) {
    this.handleDeselection(entry.selection_list);
    entry.selection_list.length = 0;
    this.disable_select_all = false;
  }

  handleDeselection(diligences: any) {
    diligences.forEach((diligence) => {
      const diligence_from_main_list: any = this.diligences.find(
        (val) => val.id === diligence.id
      );

      if (diligence_from_main_list) {
        diligence_from_main_list.is_selected = false;
      }
    });

    this.select_all_entities = false;
  }

  canExitVehiclesStep(step) {
    if (this.showVehicles && this.hideQuestionnaireIfEntitiesEmpty) {
      this.show_vehicles_selection_error = false;
      this.showVehicles = false;
    }
    this.show_vehicles_selection_error = !this.selected_vehicles.length;
    if (!this.show_vehicles_selection_error) {
      this.beforeLoadingQuestionnaireSelect();
      step.next();
    }
  }

  canExitProductsStep(step) {
    if (this.showFunds && this.hideQuestionnaireIfEntitiesEmpty) {
      this.show_funds_selection_error = false;
      this.showFunds = false;
    }
    const selected_funds_valid_arr = [];
    const bouncedEntitiesList = [];
    this.selected_funds = this.selected_funds.filter((entity) => {
      if (entity.filter) {
        if (
          entity.notification_contacts.find(
            (fund_contact) => fund_contact.isFilterApplied
          )
        ) {
          return true;
        }
      } else return true;
    });
    const allEntitiesList = this.selected_funds;
    const bouncedEmailsList = [];
    const allEmailsList = [];
    const can_proceed =
      this.areSelectedEntitiesValid() || this.request.all_entity_flag;
    if (this.selected_funds.length > 0) {
      this.selected_funds.forEach(
        (fund: { id: any; notification_contacts: any }) => {
          const entity_item = {
            id: fund.id,
            notification_contacts: [],
          };
          const notification_contacts = [];
          let bouncedContactsCount = 0;
          if (fund.notification_contacts?.length) {
            fund.notification_contacts.forEach(
              (contact: { is_removed: any; has_bounce_history: any }) => {
                if (!contact.is_removed) {
                  entity_item.notification_contacts.push(contact);
                  allEmailsList.push(contact);
                }
                if (!contact.is_removed) {
                  notification_contacts.push(contact);
                }
                if (contact.has_bounce_history && !contact.is_removed) {
                  bouncedContactsCount++;
                  bouncedEmailsList.push(contact);
                }
              }
            );
            if (entity_item.notification_contacts.length > 0) {
              selected_funds_valid_arr.push(entity_item);
              this.show_funds_selection_error = false;
            }
          } else {
            bouncedContactsCount++;
            this.show_funds_selection_error = true;
            fund.notification_contacts = [];
            bouncedEmailsList.push(fund);
            bouncedEntitiesList.push(fund);
          }
        }
      );
      if (bouncedEmailsList.length > 0 || bouncedEntitiesList.length > 0) {
        this.customModalService.invoke('alert-bounced-contacts', {
          initialState: {
            entitiesList: {
              bounced: bouncedEntitiesList,
              all: allEntitiesList,
              entity_type: this.showFunds ? 'Products' : this.dd_for,
            },
            contactsList: {
              bounced: allEmailsList.length ? bouncedEmailsList : [],
              all: allEmailsList,
            },
            success: (response: string) => {
              if (response !== 'canceled') {
                if (this.selected_funds.length !== bouncedEntitiesList.length) {
                  const entIds = bouncedEntitiesList.map((val) => val.id);
                  this.selected_funds.forEach((ent: any) => {
                    if (entIds.includes(ent.id)) {
                      ent.is_selected = false;
                    }
                  });
                  this.selected_funds = JSON.parse(
                    JSON.stringify(
                      this.selected_funds.filter((x) => x.is_selected)
                    )
                  );
                }
                if (!can_proceed) {
                  this.display_entity_selection_error = true;
                }
                if (can_proceed) {
                  if (selected_funds_valid_arr.length > 0) {
                    this.show_funds_selection_error = false;
                    this.beforeLoadingQuestionnaireSelect();
                    step.next();
                  } else {
                    this.show_funds_selection_error = true;
                  }
                }
              }
            },
          },
        });
      } else {
        if (!can_proceed) {
          this.display_entity_selection_error = true;
        }
        if (selected_funds_valid_arr.length > 0) {
          this.show_funds_selection_error = false;
          this.beforeLoadingQuestionnaireSelect();
          step.next();
        } else {
          this.show_funds_selection_error = true;
        }
      }
    } else {
      this.show_funds_selection_error = true;
    }
  }

  getDiligenceFunds() {
    const arr = [];
    if (this.active_step_template && this.active_step_template.id) {
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Fund' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
    }
    return arr;
  }

  getDiligenceFirms() {
    const arr = [];
    if (this.active_step_template && this.active_step_template.id) {
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Firm' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
    }
    return arr;
  }

  getDiligenceStrategies() {
    const arr = [];
    if (this.active_step_template && this.active_step_template.id) {
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Strategy' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
    }
    return arr;
  }

  getDiligenceVehicles() {
    const arr = [];
    if (this.active_step_template && this.active_step_template.id) {
      const dupes = [];
      this.diligences.map((diligence) => {
        if (
          diligence.entity_type === 'Vehicle' &&
          diligence.template_id === this.active_step_template.id &&
          dupes.indexOf(diligence.entity_id) === -1
        ) {
          arr.push(diligence);
          dupes.push(diligence.entity_id);
        }
      });
    }
    return arr;
  }

  combineSelectedDiligences() {
    this.combinedDiligences = [];
    this.review_diligence_templates.map((entry) => {
      entry.selection_list.map((diligence) => {
        this.combinedDiligences.push(diligence);
      });
    });
  }

  sendReviewDDRequest() {
    this.templateSelectionForm
      .get('project_name')
      .markAsTouched({ onlySelf: true });
    if (this.templateSelectionForm.get('project_name').invalid) {
      return;
    }
    if (this.combinedDiligences.length) {
      this.loading = true;
      const params: any = {};
      params.name = this.templateSelectionForm.value.project_name;
      params.due_date = this.request.due_at;
      params.as_of_date = this.datePipe.transform(
        this.request.as_of_date,
        'MM-dd-yyyy'
      );
      params.review_template_id = this.request.review_template.id;
      params.mapped_diligence_ids = this.combinedDiligences.map(
        (val) => val.id
      );
      params.entity_ids = this.combinedDiligences.map((val) => val.entity_id);
      this.http
        .post('review_projects', params)
        .subscribe((response: { id: any }) => {
          this.loading = false;
          this.toaster.success('New request has been successfully added', '', {
            timeOut: 3000,
          });
          this.router.navigateWithParams(
            'app.diligence.project.questionnaire',
            {
              diligenceId: response.id,
            }
          );
        });
    } else {
      if (this.combinedDiligences.length === 0) {
        this.toaster.error('Please select at least one project!');
      }
    }
  }

  projectsSelectionBeforeEnter(template: any, index: any) {
    this.active_step_template = template;
    this.filterByEntity(this.review_entity_type);
    this.diligence_funds = this.getDiligenceFunds();
    this.diligence_firms = this.getDiligenceFirms();
    this.diligence_strategies = this.getDiligenceStrategies();
    this.diligence_vehicles = this.getDiligenceVehicles();
    this.filter.diligence_entity = null;
  }

  getDefaultEmailTemplate(use_email_template: any) {
    if (use_email_template) {
      this.renderEmailTemplate(this.default_email_template_message_id);
    } else {
      this.email_text = '';
    }
  }

  setEntityType(entity_type: any) {
    this.review_entity_type = entity_type;
    this.filter.diligence_entity = null;
    this.filterByEntity(entity_type);
    this.diligence_funds = this.getDiligenceFunds();
    this.diligence_firms = this.getDiligenceFirms();
    this.diligence_strategies = this.getDiligenceStrategies();
    this.diligence_vehicles = this.getDiligenceVehicles();
    this.filters_section.show = false;
  }

  filterDiligences(value: { entity_id: any }, type: string) {
    if (
      (type === 'Fund' ||
        type === 'Firm' ||
        type === 'Strategy' ||
        type === 'Vehicle') &&
      this.active_step_template &&
      this.active_step_template.id
    ) {
      this.diligences = this.diligencesCopy.filter(
        (diligence: { entity_id: any; template_id: any }) =>
          diligence.entity_id === value.entity_id &&
          diligence.template_id === this.active_step_template.id
      );
    }
  }

  filterByEntity(type: string) {
    if (this.active_step_template && this.active_step_template.id) {
      if (type === 'Firm') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Firm' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'Strategy') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Strategy' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'Fund') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Fund' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'Vehicle') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Vehicle' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'Custom' || type === 'Review') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { entity_type: string; template_id: any }) =>
            diligence.entity_type === 'Review' &&
            diligence.template_id === this.active_step_template.id
        );
      } else if (type === 'All') {
        this.diligences = this.diligencesCopy.filter(
          (diligence: { id: any; template_id: any }) =>
            diligence.id &&
            diligence.template_id === this.active_step_template.id
        );
      }
    }
  }

  filterbyStandardTemplate(templates: any) {
    return templates.filter(
      (template: { type: string }) => template.type !== 'dd_profile'
    );
  }

  areSelectedEntitiesValid() {
    const all_selected_entities_arr = [];
    this.selected_entities.forEach(
      (entity: { id: any; notification_contacts: any }) => {
        const entity_item = {
          id: entity.id,
          notification_contacts: [],
        };
        if (entity.notification_contacts?.length) {
          entity.notification_contacts.forEach(
            (contact: { is_removed: any; id: any }) => {
              if (!contact.is_removed) {
                entity_item.notification_contacts.push(contact.id);
              }
            }
          );
          if (entity_item.notification_contacts.length) {
            all_selected_entities_arr.push(entity_item);
          }
        } else {
          entity.notification_contacts = [];
        }
      }
    );
    return all_selected_entities_arr.length;
  }

  setSuggestedDueDate() {
    this.request.due_at = this.getSuggestedDueDate();
  }

  renderEmailTemplate(id: any) {
    const template = this.email_templates.find((val) => val.id === id);
    if (template) {
      this.email_text = template.content;
    } else {
      this.email_text = '';
    }
  }

  getSuggestedDueDate(purpose = null) {
    return moment()
      .add(this.due_date_map[purpose || this.request.duediligence_type], 'days')
      .toDate();
  }

  handleQuestionnaireStepPrevious(step) {
    step.previous();
  }

  canExitQuestionnaireStep(step = null) {
    this.canExitQuestionnaire = false;
    if (!this.isValidDueDate()) return; // due date validation
    this.filterAndUnFilteredError = false;
    this.accept_confidential_agreement = false;
    this.subfilterAndUnFilteredError = false;
    this.questionPageTouched = step ? true : false;
    if (this.showSubFilterBasedSelection) {
      let keys =
        this.selectedGlobalTernaryOperator == FILTER_TERNARY_OPERATORS.OR
          ? Object.keys(this.subEntitySearchMap)
          : [Object.keys(this.subEntitySearchMap)[0]];
      if (!keys.length) {
        this.subfilterAndUnFilteredError = true;
        return;
      }
      keys.forEach((entityKey) => {
        if (!this.subEntitySearchMap[entityKey]) {
          this.subfilterAndUnFilteredError = true;
          return;
        }
        if (this.subEntitySearchMap[entityKey])
          this.subEntitySearchMap[entityKey].data.forEach((entity) => {
            if (entity.selected && !entity.templates) {
              this.subfilterAndUnFilteredError = true;
              return;
            }
          });
      });

      if (
        this.isSubUnfiltered &&
        !this.unfilteredSelectedSubEntities &&
        !this.unfilteredSelectedSubEntities?.data
      ) {
        this.subfilterAndUnFilteredError = true;
      }

      if (
        this.unfilteredSelectedSubEntities &&
        this.unfilteredSelectedSubEntities?.data
      ) {
        this.unfilteredSelectedSubEntities.data.forEach((entity) => {
          if (entity.selected && !entity.templates) {
            this.subfilterAndUnFilteredError = true;
            return;
          }
        });
      }
    } else if (this.selectedSubEntities && this.selectedSubEntities.length) {
      this.isSubFilterTemplate = true;
      this.selectedSubEntities.forEach((entity) => {
        if (!entity.templates) {
          this.isSubFilterTemplate = false;
        }
      });
      if (!this.isSubFilterTemplate) return;
    }
    if (this.showMainFilterBasedSelection) {
      let keys =
        this.selectedGlobalTernaryOperator == FILTER_TERNARY_OPERATORS.OR
          ? Object.keys(this.entitySearchMap)
          : [Object.keys(this.entitySearchMap)[0]];
      if (!keys.length) {
        this.filterAndUnFilteredError = true;
        return;
      }

      keys.forEach((entityKey) => {
        if (!this.entitySearchMap[entityKey]) {
          this.filterAndUnFilteredError = true;
          return;
        }
        if (this.entitySearchMap[entityKey])
          this.entitySearchMap[entityKey].data.forEach((entity) => {
            if (entity.selected && !entity.templates?.length) {
              this.filterAndUnFilteredError = true;
              return;
            }
          });
      });

      if (
        this.isUnfiltered &&
        !this.unfilteredSelectedEntities &&
        !this.unfilteredSelectedEntities?.data
      ) {
        this.filterAndUnFilteredError = true;
      }
      if (
        this.unfilteredSelectedEntities &&
        this.unfilteredSelectedEntities?.data
      ) {
        this.unfilteredSelectedEntities.data.forEach((entity) => {
          if (entity.selected && !entity.templates) {
            this.filterAndUnFilteredError = true;
            return;
          }
        });
      }
    }

    if (
      this.request.duediligence_type == 'dd_event_related' &&
      !this.request.event_trigger
    )
      return;
    if (this.subfilterAndUnFilteredError) return;
    if (this.filterAndUnFilteredError) return;
    if (!this.showMainFilterBasedSelection && !this.request.template) return;
    if (
      !this.showSubFilterBasedSelection &&
      this.showVehicles &&
      !this.request.vehicleTemplate
    )
      return;
    if (
      !this.showSubFilterBasedSelection &&
      this.showFunds &&
      !this.request.productsTemplate
    )
      return;

    if (this.request?.due_at) {
      this.setEntities();
      if (this.selected_entity_grid.length > 0) {
        this.filterAndUnFilteredError = false;
        this.getDefaultEmailTemplate(this.use_email_templates);
        this.questionPageTouched = false;
        this.loadGrid();
        this.calendars.forEach((x) => x.close());
        if (step) {
          step.next();
        } else {
          this.canExitQuestionnaire = true;
        }
      }
    }
  }

  setEntities() {
    let entity_type: string;
    if (this.dd_for === 'Product') {
      entity_type = 'Fund';
    } else if (this.dd_for === 'Firm') {
      entity_type = 'Firm';
    } else if (this.dd_for === 'Strategy') {
      entity_type = 'Strategy';
    } else {
      entity_type = 'Vehicle';
    }
    this.selected_entities_temp = [];
    this.all_selected_entities_arr = [];
    this.all_selected_entities_contacts_arr = [];
    this.selected_entity_grid = [];
    let searchMap: any;
    let template: any;
    let unFilteredTemplate: any;
    if (this.showMainFilterBasedSelection) {
      if (this.selectedGlobalTernaryOperator === FILTER_TERNARY_OPERATORS.AND) {
        const keys = Object.keys(this.entitySearchMap || {});
        searchMap = keys.length ? [this.entitySearchMap[keys[0]]] : [];
      } else {
        searchMap = Object.values(this.entitySearchMap || {});
      }
      searchMap.forEach((filter) => {
        filter.data.forEach((entity) => {
          if (entity.selected && entity.templates) {
            let localTemplates = entity.templates?.map(
              (data) => this.templateMap[data]
            );
            const gridItem = {
              id: entity.id,
              name: entity.display_name,
              template: localTemplates,
              notification_contacts: [],
            };
            this.generateRequestList(
              entity,
              localTemplates,
              entity_type,
              gridItem
            );
            this.selected_entity_grid.push(gridItem);
          }
        });
      });

      if (
        this.unfilteredSelectedEntities &&
        this.unfilteredSelectedEntities?.data?.length > 0
      ) {
        (this.unfilteredSelectedEntities.data as Array<any>).forEach(
          (entity) => {
            if (entity.selected) {
              const gridItem = {
                id: entity.id,
                name: entity.display_name,
                template: entity.templates,
                notification_contacts: [],
              };
              this.generateRequestList(
                entity,
                entity.templates,
                entity_type,
                gridItem
              );
              this.selected_entity_grid.push(gridItem);
            }
          }
        );
      }
    } else {
      this.selected_entities.forEach((entity: any) => {
        let canAdd = false;
        if (entity.filter) {
          if (
            entity.notification_contacts.find(
              (fund_contact) => fund_contact.isFilterApplied
            )
          ) {
            canAdd = true;
          }
        } else canAdd = true;

        if (canAdd) {
          let template = this.request.template ?? entity.templates;
          const gridItem = {
            id: entity.id ?? entity.entity_id,
            name: entity.display_name ?? entity.entity_name,
            template: template,
            notification_contacts: [],
          };
          this.generateRequestList(entity, template, entity_type, gridItem);
          this.selected_entity_grid.push(gridItem);
        }
      });
    }
    if (
      this.selected_entities_temp.length >
        this.firm_preferences.threshold_for_approval_flow &&
      this.firm_preferences.enable_approval_flow_information_request &&
      this.request.DDTypeDisplayName !== 'Pending Requests'
    ) {
      this.nextBtnText = 'Send Request for Approval';
    } else {
      this.nextBtnText = 'Send Request';
    }
    this.generateSubEntityRequestList();
    this.loadGrid();
  }

  loadGrid() {
    const defaultColumnDef = this.ReviewGridService.getMyReviewGridColDef();

    let gridName;
    if (this.request.duediligence_type == 'dd_pending')
      gridName = this.gridNameApprovalReview;
    else gridName = this.gridNameReview;

    this.store.dispatch(
      new SetDefaultColumnDef({ [gridName]: defaultColumnDef })
    );
  }

  handleEditorTextChange(data) {
    this.email_text = data;
  }

  loadscheduleRequest() {
    const defaultColumnDef =
      this.ScheduledRequestGridService.getMyApprovalGridColDef();
    defaultColumnDef.map((x) => (x.cellClass = 'my-permission-cursor-pointer'));
    this.store.dispatch(
      new SetDefaultColumnDef({ ['investor-scheduled']: defaultColumnDef })
    );
  }

  getScheduledDDRequest() {
    this.loadscheduleRequest();
    this.is_loading_scheduled_dds = true;
    this.ScheduledRequestGridService.getData().subscribe((res) => {
      this.scheduled_diligences_grid = res;
      this.scheduled_diligences_grid_copy = res;
      this.is_loading_scheduled_dds = false;
    });
  }

  generateSubEntityRequestList() {
    if (this.showSubFilterBasedSelection) {
      let keys;
      let searchMap;
      if (
        this.selectedSubGlobalTernaryOperator === FILTER_TERNARY_OPERATORS.AND
      ) {
        keys = Object.keys(this.subEntitySearchMap);
        searchMap = keys.length > 0 ? [this.subEntitySearchMap[keys[0]]] : [];
      } else searchMap = Object.values(this.subEntitySearchMap || {});
      searchMap.forEach((filter) => {
        filter.data.forEach((entity) => {
          if (entity.selected && entity.templates) {
            let contacts = [];
            entity.notification_contacts.forEach((contact) => {
              if (!contact.is_removed) {
                if (contact.name.trim() != '') contacts.push(contact.name);
                else contacts.push(contact.email);
              }
            });
            let localTemplates = entity.templates?.map(
              (data) => this.templateMap[data]
            );
            this.selected_entity_grid.push({
              id: entity.id,
              name: entity.display_name,
              template: localTemplates.map((x) => x.name).join(','),
              notification_contacts: contacts.join(','),
            });
          }
        });
      });

      if (
        this.unfilteredSelectedSubEntities &&
        this.unfilteredSelectedSubEntities?.data?.length > 0
      ) {
        this.unfilteredSelectedSubEntities.data.forEach((entity) => {
          if (entity.selected) {
            let contacts = [];
            entity.notification_contacts.forEach((contact) => {
              if (!contact.is_removed) {
                if (contact.name.trim() != '') contacts.push(contact.name);
                else contacts.push(contact.email);
              }
            });
            this.selected_entity_grid.push({
              id: entity.id,
              name: entity.display_name,
              template: entity.templates.map((x) => x.name).join(','),
              notification_contacts: contacts.join(','),
            });
          }
        });
      }
    } else {
      let dd_for = '';
      let template: any;
      let selected_entities = [];
      if (!this.subFilterApplied) {
        if (this.dd_for === 'Product' && this.showVehicles) {
          selected_entities = this.selected_vehicles;
          dd_for = 'Vehicle';
          template = this.request.vehicleTemplate;
        } else if (this.dd_for === 'Strategy' && this.showFunds) {
          selected_entities = this.selected_funds;
          dd_for = 'Product';
          template = this.request.productsTemplate;
        }
      } else {
        selected_entities = this.selectedSubEntities;
      }

      selected_entities?.forEach((entity) => {
        let canAdd = false;
        if (entity.filter) {
          if (
            entity.notification_contacts.find(
              (fund_contact) => fund_contact.isFilterApplied
            )
          ) {
            canAdd = true;
          }
        } else canAdd = true;
        if (canAdd) {
          const contacts = [];
          entity.notification_contacts?.forEach((contact) => {
            if (!contact.is_removed) {
              if (contact.name.trim() !== '') {
                contacts.push(contact.name);
              } else {
                contacts.push(contact.email);
              }
            }
          });
          if (!template) template = entity.templates;
          this.selected_entity_grid.push({
            id: entity.id,
            name: entity.display_name,
            template: template.map((x) => x.name).join(','),
            notification_contacts: contacts.join(','),
          });
        }
      });
    }
    const uniqueEntities = [];
    const idSet = new Set();

    for (const obj of this.selected_entity_grid) {
      const existing_templates = uniqueEntities.find((x) => x.id === obj.id);
      if (existing_templates && existing_templates.template !== obj.template) {
        existing_templates.template += ', ' + obj.template;
      }
      if (!idSet.has(obj.id)) {
        uniqueEntities.push(obj);
        idSet.add(obj.id);
      }
    }
    this.selected_entity_grid = uniqueEntities;
    this.all_selected_entities_contacts_arr = [];
    this.selected_entity_grid.forEach((entity: any) => {
      const notification_contacts = entity.notification_contacts.split(',');
      this.all_selected_entities_contacts_arr =
        this.all_selected_entities_contacts_arr.concat(notification_contacts);
    });
  }

  generateRequestList(entity: any, template: any, entity_type: any, gridItem) {
    let entity_item: {
      notification_contacts: any;
      id?: any;
      entity_type?: any;
      template_id?: null;
    };
    entity_item = {
      id: entity.id,
      notification_contacts: [],
      entity_type,
      template_id: null,
    };
    entity.notification_contacts.forEach((contact) => {
      if (!contact.is_removed && !contact.has_bounce_history) {
        entity_item.notification_contacts.push(contact.id);
        let name = contact?.name ?? contact?.fullName;
        if (name.trim() !== '') {
          this.all_selected_entities_contacts_arr.push(name);
          gridItem.notification_contacts.push({
            user_name: name,
          });
        } else {
          this.all_selected_entities_contacts_arr.push(contact.email);
          gridItem.notification_contacts.push({
            user_name: contact.email,
          });
        }
      }
    });

    if (entity_item.notification_contacts.length && template?.length) {
      template.forEach((template) => {
        const request = JSON.parse(JSON.stringify(entity_item));
        request.template_id = template.id;
        this.selected_entities_temp.push(request);
      });
      this.all_selected_entities_arr.push(entity.name);
    }
    if (gridItem.template?.length) {
      gridItem.template = gridItem.template.map((x) => x.name).join(',');
    }
    if (gridItem.notification_contacts?.length) {
      gridItem.notification_contacts = gridItem.notification_contacts
        .map((x) => x.user_name)
        .join(',');
    }
  }

  clearDateRange(event) {
    event.stopPropagation();
    this.activeDateRange = undefined;
    this.scheduled_diligences_grid = this.scheduled_diligences_grid_copy;
    this.getDataForDateRange([undefined, undefined]);
  }

  onRowSelected(data) {
    this.show_bulk_actions = true;
    if (!data.data) return;
    if (data.node.selected) {
      this.scheduledDiligencesSelectedGrid[data.data.id] = data.data;
    } else {
      delete this.scheduledDiligencesSelectedGrid[data.data.id];
    }
    if (Object.keys(this.scheduledDiligencesSelectedGrid).length === 0) {
      this.show_bulk_actions = false;
    }
    this.totalSelectedRecords = Object.keys(
      this.scheduledDiligencesSelectedGrid
    ).length;
  }

  getDataForDateRange(date_range) {
    this.show_bulk_actions = false;
    this.scheduled_diligences.start_date = date_range[0]
      ? moment(date_range[0]).format('M-D-YYYY')
      : undefined;
    this.scheduled_diligences.end_date = date_range[1]
      ? moment(date_range[1]).format('M-D-YYYY')
      : undefined;
  }

  filterByDateRange(event, date_range: { value: string }) {
    event.stopPropagation();
    if (
      (this.activeDateRange &&
        this.activeDateRange.value === date_range.value) ||
      date_range.value === 'show-all'
    ) {
      this.scheduled_diligences_grid = this.scheduled_diligences_grid_copy;
      this.activeDateRange = undefined;
      this.scheduled_diligences_grid = this.scheduled_diligences_grid_copy;
      this.getDataForDateRange([undefined, undefined]);
    } else {
      let startDate;
      let endDate;
      if (date_range.value === 'current-month') {
        startDate = new Date(moment().startOf('month').toLocaleString());
        endDate = new Date(moment().endOf('month').toLocaleString());
      } else if (date_range.value === 'next-month') {
        startDate = new Date(
          moment().add(1, 'months').startOf('month').toLocaleString()
        );
        endDate = new Date(
          moment().add(1, 'months').endOf('month').toLocaleString()
        );
      } else if (date_range.value === 'next-three-months') {
        startDate = new Date(
          moment().add(1, 'months').startOf('month').toLocaleString()
        );
        endDate = new Date(
          moment().add(3, 'months').endOf('month').toLocaleString()
        );
      }
      this.scheduled_diligences_grid =
        this.scheduled_diligences_grid_copy.filter((a) => {
          let date = new Date(a.due_date);
          return date >= startDate && date <= endDate;
        });
      this.activeDateRange = date_range;
    }
  }

  performScheduledDDBulkActions(action: string) {
    const selected_diligences = Object.keys(
      this.scheduledDiligencesSelectedGrid
    );
    if (action === 'delete') {
      this.http
        .put('v2/diligences/bulk_delete', selected_diligences)
        .subscribe(() => {
          this.scheduled_diligences_grid =
            this.scheduled_diligences_grid.filter(
              (val) => !selected_diligences.includes(`${val.id}`)
            );
          this.scheduled_diligences_grid_copy = this.scheduled_diligences_grid;
          this.show_bulk_actions = false;
          this.select_all = false;
          this.scheduledDiligencesSelectedGrid = [];
          this.toaster.success(
            '',
            'All the selected scheduled diligence projects have been deleted'
          );
        });
    }
  }

  confirmScheduledDDBulkAction(action: string) {
    let confirm_button_text: string, custom_class: string;
    if (action === 'pause') {
      custom_class = 'warning';
      confirm_button_text = 'Pause';
    } else if (action === 'delete') {
      custom_class = 'danger';
      confirm_button_text = 'Delete';
    }
    this.SweetAlert.confirm({
      title: `Are you sure you want to ${action} the selected scheduled diligence projects?`,
      showLoaderOnConfirm: true,
      customClass: custom_class,
      focusCancel: true,
      confirmButtonText: confirm_button_text,
      preConfirm: () => {
        this.performScheduledDDBulkActions(action);
        swal.close();
      },
    });
  }

  minValChange(date) {
    this.scheduled_diligences_due_date = date;
  }

  maxValChange(date) {
    this.scheduled_diligences_scheduled_date = date;
  }

  editScheduledDDBulkAction() {
    this.loading = true;
    const selected_diligences = Object.keys(
      this.scheduledDiligencesSelectedGrid
    );
    const scheduled_diligences_updated_data = {
      diligence_ids: selected_diligences,
      scheduled_at: moment(this.scheduled_diligences_scheduled_date).format(
        'YYYY-MM-DD'
      ),
      due_at: moment(this.scheduled_diligences_due_date).format('YYYY-MM-DD'),
    };
    if (
      this.scheduled_diligences_scheduled_date &&
      this.scheduled_diligences_due_date
    ) {
      this.http
        .put(
          'diligences/bulk_schedule_diligences',
          scheduled_diligences_updated_data
        )
        .subscribe(
          () => {
            this.scheduled_diligences_grid = this.scheduled_diligences_grid.map(
              (val) => {
                if (selected_diligences.includes(`${val.id}`)) {
                  val.scheduled_date = shortDateFormat(
                    this.scheduled_diligences_scheduled_date
                  );
                  val.due_date = shortDateFormat(
                    this.scheduled_diligences_due_date
                  );
                }
                return val;
              }
            );
            this.scheduled_diligences_grid_copy =
              this.scheduled_diligences_grid;
            this.show_bulk_actions = false;
            this.select_all = false;
            this.show_bulk_edit_actions = false;
            this.loading = false;
            this.toaster.success(
              '',
              'All the selected scheduled diligence projects have been updated'
            );
          },
          () => (this.loading = false)
        );
    }
  }

  editScheduledDDBulkActionActive() {
    this.show_bulk_edit_actions = true;
  }

  handleScheduleRequestPrevious(step) {
    step.previous();
    this.show_bulk_edit_actions = false;
    this.show_bulk_actions = false;
    this.scheduledDiligencesSelectedGrid = {};
    this.accept_confidential_agreement = false;
    this.templateSelectionForm.get('project_name').setValue('');
    this.templateSelectionForm.get('project_name').markAsUntouched();
    this.templateSelectionForm.get('project_name').updateValueAndValidity();
  }

  closeQuickActions() {
    this.show_bulk_edit_actions = false;
    this.show_bulk_actions = false;
    this.gridApi.deSelectAllRows();
  }

  canProceedToScheduledDDReviewStep(step) {
    let can_proceed = false;
    this.accept_confidential_agreement = false;
    can_proceed = Object.keys(this.scheduledDiligencesSelectedGrid).length > 0;
    this.final_schedule_diligences_list = Object.keys(
      this.scheduledDiligencesSelectedGrid
    );

    if (!can_proceed) {
      const message = 'Please select at least one diligence project!';
      this.toaster.error('', message);
    }

    if (can_proceed) {
      if (this.use_email_templates) {
        this.getDefaultEmailTemplate(this.use_email_templates);
      }
      this.calendars.forEach((x) => x?.close());
      step.next();
    }
    const is_threshold_and_not_pending_request =
      this.totalSelectedRecords >
        this.firm_preferences.threshold_for_approval_flow &&
      this.firm_preferences.enable_approval_flow_information_request &&
      this.request.DDTypeDisplayName !== 'Pending Requests';
    if (is_threshold_and_not_pending_request) {
      this.nextBtnText = 'Send Request for Approval';
    } else {
      this.nextBtnText = 'Send Request';
    }
  }

  getReviewTemplates() {
    this.diligences = [];
    this.review_diligence_templates = [];
    this.request.review_template = {};
    this.diligencesCopy = [];
    this.http.get('review_templates').subscribe((response: any) => {
      this.review_templates = response;
      this.display_wizard_footer = false;
      if (this.stateParams.templateId != null) {
        this.request.review_template = this.review_templates.find(
          (val) => val.id === Number(this.stateParams.templateId)
        );
        if (this.request.review_template)
          this.reviewTemplateSelectionForm.controls.review_template.setValue(
            Number(this.stateParams.templateId)
          );
        this.getDiligences();
      }
    });
  }

  shouldFooterBeVisible() {
    if (this.diligences && this.diligences.length) {
      this.display_wizard_footer = true;
    } else {
      this.display_wizard_footer = false;
    }
  }

  setDDType(type: string, step: DvStepperComponent = null) {
    if (this.request.DDTypeDisplayName == 'Pending Requests') {
      this.all_selected_entities_arr = [];
      this.all_selected_entities_contacts_arr = [];
      this.selected_entities = [];
    }
    if (type === 'dd_scheduled') {
      this.request['duediligence_type'] = type;
      this.request.DDTypeDisplayName = 'Scheduled Requests';
      if (step) step.next();
    } else if (type === 'dd_review') {
      this.request['duediligence_type'] = type;
      // this.projectsSelectionBeforeEnter()
      this.getReviewTemplates();
      if (step) step.next();
      this.request.DDTypeDisplayName = 'Analyst Evaluation Project';
    } else if (type === 'dd_pending') {
      this.request['duediligence_type'] = type;
      this.request.DDTypeDisplayName = 'Pending Requests';
      this.stepInstance.next();
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    } else {
      if (step) step.next();
      const dd_type_map = {
        dd_scheduled: 'Scheduled Requests',
        dd_new: 'Pre-investment',
        dd_ongoing: 'Ongoing Monitoring',
        dd_event_related: 'Adhoc / Event Related',
        dd_review: 'Review Diligence',
        dd_pending: 'Pending Requests',
      };
      this.request.DDTypeDisplayName = dd_type_map[type];
      this.selected_vehicles = JSON.parse(
        JSON.stringify(
          this.selected_vehicles.map((val) => ({ ...val, is_selected: false }))
        )
      );
      this.selected_funds = JSON.parse(
        JSON.stringify(
          this.selected_funds.map((val) => ({ ...val, is_selected: false }))
        )
      );
      this.request['duediligence_type'] = type;
    }
    this.defaultRequest();
    this.items.forEach((x) => x.hide());
  }

  setDDFor(entity: string) {
    if (entity !== this.dd_for) {
      this.dd_for = entity;
      this.resetFilterBasedSelectionAttributes();
    }
  }

  resetFilterBasedSelectionAttributes() {
    this.allFilterTemplateId = null;
    this.allSubFilterTemplateId = null;
    this.filterApplied = false;
    this.subFilterApplied = false;
    this.unfilteredSelectedEntities = null;
    this.unfilteredSelectedSubEntities = null;
    this.entitySearchMap = {};
    this.subEntitySearchMap = {};
    this.showMainFilterBasedSelection = false;
    this.showSubFilterBasedSelection = false;
    this.copyOfSelectedEntity = null;
    this.selected_funds = [];
    this.selected_vehicles = [];
    this.show_vehicles_selection_error = false;
    this.show_funds_selection_error = false;
    this.selectedSubFilters = [];
    this.showVehicles = false;
    this.showFunds = false;
    this.selected_entities = [];
    this.selectedFilters.length = 0;
    this.selectedSubFilters.length = 0;
    this.selectedGlobalTernaryOperator = FILTER_TERNARY_OPERATORS.AND;
    this.selectedSubGlobalTernaryOperator = FILTER_TERNARY_OPERATORS.AND;
    this.display_entity_selection_error = false;
    this.request.all_entity_flag = false;
    this.investor.resetEntitySelectorFilters(filterEnum.entitiesSelection);
    this.investor.resetEntitySelectorFilters(filterEnum.subEntitiesSection);
  }

  sendScheduledDDRequest() {
    if (!this.isAssignReviewerSelected()) return;

    this.templateSelectionForm
      .get('project_name')
      .markAsTouched({ onlySelf: true });
    if (this.templateSelectionForm.get('project_name').invalid) {
      return;
    }
    if (!this.accept_confidential_agreement) {
      this.SweetAlert.error({
        title: 'Confidentiality Agreement',
        text: 'Please agree with the binding conditions by clicking the checkbox before you can send this request',
      });
      return;
    }
    this.loading = true;

    const data: any = {
      email_text: this.email_text,
      name: this.templateSelectionForm.get('project_name').value,
    };

    data.entity_ids = this.final_schedule_diligences_list;

    if (
      this.totalSelectedRecords >
        this.firm_preferences.threshold_for_approval_flow &&
      this.firm_preferences.enable_approval_flow_information_request
    ) {
      data.approver_ids = this.assignedApprovers;
      data.is_approval_required = true;
    } else {
      data.approver_ids = [];
      data.is_approval_required = false;
    }

    this.DueDiligenceDataservice.bulkInvite(data).subscribe(
      () => {
        this.loading = false;
        this.toaster.success('New request has been successfully added', '', {
          timeOut: 3000,
        });
        if (data.is_approval_required) {
          this.init(true);
          this.stepInstance.reset();
          this.setDDType('dd_pending');
        } else {
          this.router.navigateWithParams('app.diligence.projects.activity', {
            type: 'sent',
          });
        }
      },
      (error: { status: any; config: { data: { email_text: any } } }) => {
        this.loading = false;
        const avoid_error_logging_statuses =
          this.BaseDataService.getAvoidErrorLoggingStatusList() || [];
        if (!Array.from(avoid_error_logging_statuses).includes(error.status)) {
          delete error.config?.data?.email_text;
          this.Utils.logError('Scheduled request (invite) failed', error);
        }
      }
    );
  }

  getAllProductEntities() {
    return this.http.get(`investments`, {
      params: {
        skip_pagination: true,
      },
    });
  }

  getAllFirmEntities() {
    return this.http.get('firms/monitor', {
      params: {
        include_contacts: true,
        pageNumber: 1,
        recordsPerPage: this.total_entity_records,
      },
    });
  }

  fetchAllEntities() {
    let entities;
    switch (this.dd_for) {
      case 'Product':
        entities = this.getAllProductEntities();
        break;
      case 'Firm':
        entities = this.getAllFirmEntities();
        break;
    }
    return entities;
  }

  formJSONForEntities(entities: any, entity_type: any) {
    entities = entities.filter(
      (entity: { notification_contacts: { length: any } }) =>
        entity.notification_contacts.length
    );

    const entities_temp = [];
    entities.forEach((entity) => {
      const entity_item = {
        id: entity.id,
        notification_contacts: [],
        entity_type,
      };
      entity.notification_contacts.forEach((contact: { id: any }) => {
        entity_item.notification_contacts.push(contact.id);
      });
      if (entity_item.notification_contacts.length) {
        entities_temp.push(entity_item);
      }
    });
    return entities_temp;
  }

  generatePageUrl() {
    let pageUrl = '';
    if (this.dd_for === 'Firm') {
      this.selected_entities.forEach((entity: { id: any }, index: number) => {
        pageUrl += `app/firms/${entity.id}/invite`;
        if (index !== this.selected_entities.length - 1) {
          pageUrl += ',';
        }
      });
    } else if (this.dd_for === 'Product') {
      //loop over each response and generate the url for each selected fund
      this.selected_entities.forEach(
        (entity: { firm_id: any; id: any }, index: number) => {
          pageUrl += `app/firms/${entity.firm_id}/funds/${entity.id}/invite`;
          if (index !== this.selected_entities.length - 1) {
            pageUrl += ',';
          }
        }
      );
      if (this.showVehicles) {
        this.selected_vehicles.forEach(
          (entity: { firm_id: any; fund_id: any; id: any }, index: any) => {
            return (pageUrl += `,app/firms/${entity.firm_id}/funds/${entity.fund_id}/vehicles/${entity.id}/invite`);
          }
        );
      }
      if (this.showFunds) {
        this.selected_funds.forEach(
          (entity: { firm_id: any; parent_id: any; id: any }, index: any) => {
            return (pageUrl += `,app/firms/${entity.firm_id}/strategies/${entity.parent_id}/funds/${entity.id}/invite`);
          }
        );
      }
    }
    return pageUrl;
  }

  generateVehicleRequest(vehicles: any, entity: any, templates: any) {
    const entity_item = {
      id: entity.id,
      notification_contacts: [],
      entity_type: 'Vehicle',
    };
    templates.forEach((template: { id: any }) => {
      const vehicleRequest = JSON.parse(JSON.stringify(entity_item));
      vehicleRequest.template_id = template.id;
      vehicles.push(vehicleRequest);
    });
  }

  formVehiclesArray() {
    const vehicles = [];
    if (this.showSubFilterBasedSelection) {
      let searchMap = [];
      if (
        this.selectedSubGlobalTernaryOperator === FILTER_TERNARY_OPERATORS.AND
      ) {
        const keys = Object.keys(this.subEntitySearchMap);
        searchMap = keys.length > 0 ? [this.subEntitySearchMap[keys[0]]] : [];
      } else {
        searchMap = Object.values(this.subEntitySearchMap || {});
      }
      searchMap.forEach(
        (filter: { hasDuplicate: any; template_id: any; data: any }) => {
          filter.data.forEach((entity) => {
            if (entity.selected && entity.templates) {
              let localTemplates = entity.templates?.map(
                (data) => this.templateMap[data]
              );
              this.generateVehicleRequest(vehicles, entity, localTemplates);
            }
          });
        }
      );

      if (
        this.unfilteredSelectedSubEntities &&
        this.unfilteredSelectedSubEntities?.data?.length > 0
      ) {
        this.unfilteredSelectedSubEntities.data.forEach((entity: any) => {
          if (entity.selected) {
            this.generateVehicleRequest(vehicles, entity, entity.templates);
          }
        });
      }
    } else {
      this.selected_vehicles.forEach((vehicle: any) => {
        return this.generateVehicleRequest(
          vehicles,
          vehicle,
          this.request.vehicleTemplate
        );
      });
    }
    return vehicles;
  }

  generateFundRequest(
    funds: { push?: any },
    entity: { id: any; notification_contacts: any },
    templates: any
  ) {
    const entity_item = {
      id: entity.id,
      notification_contacts: [],
      entity_type: 'fund',
    };
    entity?.notification_contacts.forEach((contact) => {
      entity_item.notification_contacts.push(contact.id);
    });
    templates.forEach((template: { id: any }) => {
      const fundRequest = JSON.parse(JSON.stringify(entity_item));
      fundRequest.template_id = template.id;
      funds.push(fundRequest);
    });
  }

  formFundsArray() {
    const funds = [];
    if (this.showSubFilterBasedSelection) {
      let searchMap = [];
      if (
        this.selectedSubGlobalTernaryOperator === FILTER_TERNARY_OPERATORS.AND
      ) {
        const keys = Object.keys(this.subEntitySearchMap);
        searchMap = keys.length > 0 ? [this.subEntitySearchMap[keys[0]]] : [];
      } else {
        searchMap = Object.values(this.subEntitySearchMap || {});
      }
      searchMap.forEach(
        (filter: { hasDuplicate: any; template_id: any; data: any }) => {
          filter.data.forEach((entity) => {
            if (entity.selected && entity.templates) {
              let localTemplates = entity.templates?.map(
                (data) => this.templateMap[data]
              );
              this.generateFundRequest(funds, entity, localTemplates);
            }
          });
        }
      );

      if (
        this.unfilteredSelectedSubEntities &&
        this.unfilteredSelectedSubEntities?.data?.length > 0
      ) {
        this.unfilteredSelectedSubEntities.data.forEach((entity: any) => {
          if (entity.selected)
            this.generateFundRequest(funds, entity, entity.templates);
        });
      }
    } else {
      this.selected_funds.forEach((fund: any) => {
        this.generateFundRequest(funds, fund, this.request.productsTemplate);
      });
    }

    return funds;
  }

  sendDueDiligenceRequest() {
    this.templateSelectionForm
      .get('project_name')
      .markAsTouched({ onlySelf: true });
    if (this.templateSelectionForm.get('project_name').invalid) {
      return;
    }
    if (!this.accept_confidential_agreement) {
      this.SweetAlert.error({
        title: 'Confidentiality Agreement',
        text: 'Please agree with the binding conditions by clicking the checkbox before you can send this request',
      });
      return;
    }

    const data: any = {
      diligence_reason: (this.request.event_trigger || {}).id,
      diligence_type: this.request.duediligence_type,
      as_of_date: this.datePipe.transform(
        this.request.as_of_date,
        'MM-dd-yyyy'
      ),
      due_at: this.request.due_at,
      email_text: this.email_text,
      is_internal: this.request.is_internal,
      touser_id: (this.request.fund || {}).userID,
      name: this.templateSelectionForm.value.project_name,
      from_email: !this.request.is_internal
        ? this.selected_sender_email
        : undefined,
      cc_emails: !this.request.is_internal
        ? this.selected_cc_email_list?.join(',') || ''
        : undefined,
      bcc_emails: !this.request.is_internal
        ? this.selected_bcc_email_list?.join(',') || ''
        : undefined,
      enable_presubmission_review: this.firm_preferences.enable_Review_Workflow,
      enable_postsubmission_review:
        this.firm_preferences.enable_Review_Workflow,
      internal_notification_contacts: [],
    };
    data.assign_owner_contacts = false;
    if (
      this.selected_entities_temp.length >
        this.firm_preferences.threshold_for_approval_flow &&
      this.firm_preferences.enable_approval_flow_information_request
    ) {
      data.approver_ids = this.assignedApprovers;
      data.is_approval_required = true;
    } else {
      data.approver_ids = [];
      data.is_approval_required = false;
    }
    if (this.saveAsDraft) {
      data.is_draft = true;
      this.saveAsDraft = false;
    } else {
      data.is_draft = false;
    }
    if (!this.request.is_internal) {
      data.internal_notification_contacts = this.internalSubscribers
        .filter((subscriber) => subscriber.type === 'user')
        .map((val) => val.id);
      data.function_ids = this.internalSubscribers
        .filter((subscriber) => subscriber.type === 'function')
        .map((val) => val.id);
      if (this.autoSubscribeOwners) {
        data.assign_owner_contacts = true;
      }
    }
    if (!this.request.all_entity_flag) {
      data.entities = this.selected_entities_temp;
      if (this.dd_for === 'Product' && this.showVehicles) {
        data.entities = data.entities.concat(this.formVehiclesArray());
      }
      if (this.dd_for === 'Strategy' && this.showFunds) {
        data.entities = data.entities.concat(this.formFundsArray());
      }
      this.postDueDiligenceRequest(data);
    } else if (this.request.all_entity_flag) {
      this.fetchAllEntities().subscribe((response: any) => {
        if (this.dd_for === 'Firm') {
          response = response.results;
        }
        let entity_type: string;
        if (this.dd_for === 'Product') {
          entity_type = 'Fund';
        } else if (this.dd_for === 'Strategy') {
          entity_type = 'Strategy';
        } else if (this.dd_for === 'Firm') {
          entity_type = 'Firm';
        } else {
          entity_type = 'Vehicle';
        }
        data.entities = this.formJSONForEntities(response, entity_type);
        if (this.dd_for === 'Product' && this.showVehicles) {
          data.entities = data.entities.concat(this.formVehiclesArray());
        }
        if (this.dd_for === 'Strategy' && this.showFunds) {
          data.entities = data.entities.concat(this.formFundsArray());
        }
        this.postDueDiligenceRequest(data);
      });
    }
  }

  approvePendingRequest() {
    if (!this.accept_confidential_agreement) {
      this.SweetAlert.error({
        title: 'Confidentiality Agreement',
        text: 'Please agree with the binding conditions by clicking the checkbox before you can send this request',
      });
      return;
    }
    this.customModalService.invoke('confirm-pending-request', {
      initialState: {
        success: (message: any) => {
          this.requestAuthorJsonData.draft_id = this.selectedRequestDraftId;
          this.requestAuthorJsonData.approver_notes = message;
          this.requestAuthorJsonData.draft_status = 'Approved';
          this.postDueDiligenceRequest(this.requestAuthorJsonData);
        },
      },
    });
  }

  rejectPendingRequest() {
    this.customModalService.invoke('reject-pending-request', {
      initialState: {
        success: (message: any) => {
          this.requestAuthorJsonData.draft_id = this.selectedRequestDraftId;
          this.requestAuthorJsonData.approver_notes = message;
          this.requestAuthorJsonData.draft_status = 'Rejected';
          this.postDueDiligenceRequest(this.requestAuthorJsonData);
        },
      },
    });
  }

  postDueDiligenceRequest(data) {
    let pageUrl: string = '';
    this.toastInstance = this.toaster.info(
      'Processing Request...',
      'Please wait while the request is being processed.',
      { timeOut: 1000 }
    );
    if (this.requestType === this.requestTypes.ScheduledRequest) {
      data.is_approval_required =
        data.entity_ids?.length >
          this.firm_preferences.threshold_for_approval_flow &&
        this.firm_preferences.enable_approval_flow_information_request;
    }

    this.loading = true;
    let dueDiligenceRequest =
      this.requestType === this.requestTypes.ScheduledRequest
        ? this.DueDiligenceDataservice.bulkInvite(data)
        : this.DueDiligenceDataservice.createNewDDV2(data, pageUrl);
    dueDiligenceRequest.subscribe(
      (response: { id: any }) => {
        this.loading = false;
        this.toaster.clear(this.toastInstance);

        if (
          this.request.is_internal &&
          !data.is_draft &&
          !data.is_approval_required &&
          data.draft_status !== 'Rejected'
        ) {
          this.toaster.success('New request has been successfully added', '', {
            timeOut: 3000,
          });
          this.router.navigateWithParams(
            'app.diligence.project.questionnaire',
            {
              diligenceId: response.id,
            }
          );
        } else if (
          data.is_internal &&
          data.is_approval_required &&
          data.draft_status !== 'Rejected' &&
          this.requestType
        ) {
          this.toaster.success('New request has been successfully added', '', {
            timeOut: 3000,
          });
          if (this.requestType === this.requestTypes.ScheduledRequest) {
            if (data.is_approval_required) {
              this.setDDType('dd_pending', this.stepInstance);
            } else {
              this.router.navigateWithParams(
                'app.diligence.projects.activity',
                {
                  type: 'sent',
                }
              );
            }
            this.init();
            this.requestType = '';
            return;
          }

          this.router.navigateWithParams(
            'app.diligence.project.questionnaire',
            {
              diligenceId: response.id,
            }
          );
        } else if (
          (data.is_draft || data.is_approval_required) &&
          data.draft_status !== 'Rejected'
        ) {
          this.toaster.success('New request has been successfully added', '', {
            timeOut: 3000,
          });
          if (this.request.DDTypeDisplayName == 'Pending Requests') {
            this.stepInstance.previous();
          } else {
            this.init(true);
            this.stepInstance.reset();
            this.setDDType('dd_pending', this.stepInstance);
          }
        } else if (data.draft_status === 'Rejected') {
          this.toaster.success(
            'New request has been successfully rejected',
            '',
            { timeOut: 3000 }
          );
          this.init(true);
          this.stepInstance.reset();
          this.setDDType('dd_pending', this.stepInstance);
        } else {
          this.toaster.success('New request has been successfully added', '', {
            timeOut: 3000,
          });
          this.router.navigateWithParams('app.diligence.projects.activity', {
            type: 'sent',
          });
        }
      },
      (error: { status: any; config: { data: { email_text: any } } }) => {
        this.toaster.clear(this.toastInstance);
        this.loading = false;
        const avoid_error_logging_statuses: any =
          this.BaseDataService.getAvoidErrorLoggingStatusList();
        if (!Array.from(avoid_error_logging_statuses).includes(error.status)) {
          delete error?.config?.data?.email_text;
          return this.Utils.logError(
            'Information request (invite) failed',
            error
          );
        }
      }
    );
  }

  onRowSelect(request_data, step) {
    this.accept_confidential_agreement = false;
    this.requestType = request_data.draft_type;
    this.goToRequestDetailPage(request_data.id, step);
  }

  goToRequestDetailPage(requestId: string, step = null) {
    this.isPendingOrDraftRequestSelected = true;
    this.is_pending_data_loaded = false;
    this.selectedRequestDraftId = requestId;
    this.http
      .get('duediligence_drafts/pending_requests/' + requestId)
      .subscribe((response: any) => {
        let key: string | number;
        this.requestDataById = response;
        if (
          this.requestDataById.approver_ids.indexOf(this.currentUserId) !== -1
        ) {
          this.currentUserIsApprover = true;
        } else {
          this.currentUserIsApprover = false;
        }
        for (
          let eIndex = 0;
          eIndex < this.requestDataById.entities.length;
          eIndex++
        ) {
          var index: number;
          this.requestDataById.entities[eIndex]['templates_list'] = [];
          this.requestDataById.entities[eIndex]['contacts_list'] = [];
          for (
            index = 0;
            index < this.requestDataById.entities[eIndex].templates.length;
            index++
          ) {
            const template =
              this.requestDataById.entities[eIndex].templates[index];
            this.requestDataById.entities[eIndex].templates_list.push(
              template.name
            );
          }
          for (
            index = 0;
            index < this.requestDataById.entities[eIndex].contacts.length;
            index++
          ) {
            const contact =
              this.requestDataById.entities[eIndex].contacts[index];
            this.requestDataById.entities[eIndex].contacts_list.push(
              contact.fullName
            );
          }
        }
        this.is_pending_data_loaded = true;
        const { author_json } = response;
        this.requestAuthorJsonData = JSON.parse(author_json);
        for (key in this.requestAuthorJsonData) {
          if (key.toLowerCase() !== key) {
            this.requestAuthorJsonData[key.toLowerCase()] =
              this.requestAuthorJsonData[key];
            delete this.requestAuthorJsonData[key];
          }
        }
        if (response.approver_json) {
          const { approver_json } = response;
          this.requestApproverJsonData = JSON.parse(approver_json);
          for (key in this.requestApproverJsonData) {
            if (key.toLowerCase() !== key) {
              this.requestApproverJsonData[key.toLowerCase()] =
                this.requestApproverJsonData[key];
              delete this.requestApproverJsonData[key];
            }
          }
        }
        let entities = JSON.stringify(response.entities);
        entities = entities.replace(
          /\"contacts\":/g,
          '"notification_contacts":'
        );
        this.selected_entities = JSON.parse(entities);
        // Added common template from the author json data
        this.requestAuthorJsonData.entities.forEach((entity, i) => {
          if (!this.selected_entities[i]?.templates) {
            const template = this.selected_entities.find((selectedEntity) =>
              selectedEntity.templates.find(
                (template: any) => template.id == entity.Template_id
              )
            );
            this.selected_entities.push(template);
          }
        });
        this.stepInstance.next();
        this.setEntities();
      });
  }

  getFormattedDate(date: any) {
    return new Date(date);
  }

  getRequestStatus(status: string) {
    if (this.currentUserIsApprover && status === 'InProgress') {
      return 'Pending approval';
    } else if (!this.currentUserIsApprover && status === 'InProgress') {
      return 'Waiting for approval';
    } else if (status === 'Rejected') {
      return 'Rejected';
    }
    return '';
  }

  viewDisclaimer() {
    this.customModalService.invoke('view-approver-notes', {
      initialState: {
        approver_notes: this.requestApproverJsonData.approver_notes,
      },
      class: 'modal-lg',
    });
  }

  handleSelectedEntities({ list, search, ternaryOperator }) {
    this.selectedFilters = search;
    this.selectedGlobalTernaryOperator = ternaryOperator;
    if (this.selectedFilters.length > 0) this.filterApplied = true;
    else this.filterApplied = false;
    this.selected_entities = list;
    this.investor.disableNextButton(!this.selected_entities?.length);
    if (this.selected_entities.length > 0) {
      this.display_entity_selection_error = false;
    }
  }

  handleUpdateSelectedData(
    { type, data, allFilter, isUnfiltered },
    entityType
  ) {
    let selected_entities = {};
    if (type === 'filtered') {
      this.entitySearchMap = data;
      this.allFilterTemplateId = allFilter;
      Object.keys(data).forEach((entityKey) => {
        data[entityKey].data.forEach((entity) => {
          if (entity.selected) selected_entities[entity.id] = entity;
        });
      });
      this.isUnfiltered = isUnfiltered;
    } else if (type === 'un-filter') {
      this.unfilteredSelectedEntities = data;
      this.allFilterTemplateId = allFilter;
      data.data.forEach((entity) => {
        selected_entities[entity.id] = entity;
      });
    }
    selected_entities = Object.values(selected_entities).map(
      (val: any) => val.id
    );
    this.disableNextbutton();
  }

  handleNextClick(step) {
    if (this.showFunds || this.showVehicles) {
      step.next();
    } else {
      step.next();
      this.disableNextbutton();
      this.beforeLoadingQuestionnaireSelect();
    }
  }

  handleSelectedFunds({
    list,
    search,
    ternaryOperator,
    entities,
    loadingEntities,
  }) {
    this.isProductVehicleLoaded = loadingEntities;
    this.hideQuestionnaireIfEntitiesEmpty = entities.length === 0;
    this.selectedSubFilters = search;
    this.selectedSubGlobalTernaryOperator = ternaryOperator;
    if (this.selectedSubFilters.length > 0) this.subFilterApplied = true;
    else this.subFilterApplied = false;
    this.selected_funds = JSON.parse(JSON.stringify(list));
    if (this.selected_funds.length > 0) {
      this.show_funds_selection_error = false;
      this.show_vehicles_selection_error = false;
    }
  }

  handleUpdateSubSelectedData({ type, data, allFilter, isUnfiltered }) {
    let selected_entities = {};
    if (type === 'filtered') {
      this.subEntitySearchMap = data;
      this.allSubFilterTemplateId = allFilter;
      Object.keys(data).forEach((entityKey) => {
        data[entityKey].data.forEach((entity) => {
          if (entity.selected) selected_entities[entity.id] = entity;
        });
      });
      this.isSubUnfiltered = isUnfiltered;
    } else if (type === 'un-filter') {
      this.unfilteredSelectedSubEntities = data;
      this.allSubFilterTemplateId = allFilter;
      data.data.forEach((entity) => {
        selected_entities[entity.id] = entity;
      });
    }
    selected_entities = Object.values(selected_entities).map(
      (val: any) => val.id
    );
  }

  handleSelectedVehicle({
    list,
    search,
    ternaryOperator,
    entities,
    loadingEntities,
  }) {
    this.isProductVehicleLoaded = loadingEntities;
    this.hideQuestionnaireIfEntitiesEmpty = entities.length === 0;
    this.selectedSubFilters = search;
    this.selectedSubGlobalTernaryOperator = ternaryOperator;
    if (this.selectedSubFilters.length > 0) this.subFilterApplied = true;
    else this.subFilterApplied = false;
    this.selected_vehicles = JSON.parse(JSON.stringify(list));
    if (this.selected_vehicles.length > 0) {
      this.show_vehicles_selection_error = false;
    }
  }

  handleOnChangeTemplate(data, type) {
    data = data.length === 0 ? null : data;
    switch (type) {
      case 'template':
        this.request.template = data;
        break;

      case 'vehicle':
        this.request.vehicleTemplate = data;
        this.selectedSubEntities.forEach((entity) => {
          entity.templates = this.request.vehicleTemplate;
        });
        break;

      case 'product':
        this.request.productsTemplate = data;
        this.selectedSubEntities.forEach((entity) => {
          entity.templates = this.request.productsTemplate;
        });
        break;
      case 'assignedApprovers':
        this.assignedApprovers = data || [];
        break;
      case 'email':
        this.selected_sender_email = data;
        break;
      case 'ccemail':
        this.selected_cc_email_list = data || [];
        break;
      case 'bccemail':
        this.selected_bcc_email_list = data || [];
        break;
    }
    const validTypes = ['template', 'vehicle', 'product'];
    if (validTypes.includes(type)) {
      this.disableNextbutton();
    }
  }

  handleEventTriggerOnChange(data) {
    this.request.event_trigger = data;
    this.eventTriggerName = this.events.find((val) => val.id == data);
    this.disableNextbutton();
  }

  handleSelectionChanged(data) {
    this.internalSubscribers = data;
  }

  handleEmailRouter() {
    return this.router.href(`app.firm.settings.preferences`, {
      '#': 'OutboundEmailSettings',
    });
  }

  routeToEmailTemp() {
    this.router.navigate('app.firm.settings.email_templates');
  }

  handleNextReviewDili(step, index) {
    step.next();
    this.activeReviewTemplate = index;
  }
  handlePreviousReviewDili(step, index) {
    step.previous();
    if (index < 0) {
      index = 0;
    }
    this.activeReviewTemplate = index;
    this.accept_confidential_agreement = false;
    this.templateSelectionForm.get('project_name').markAsUntouched();
  }

  handleEvalPrevious(step) {
    step.previous();
    this.reviewTemplateSelectionForm.patchValue({
      review_template: null,
    });
    this.reviewTemplateSelectionForm.markAsUntouched();
    this.reviewTemplateSelectionForm.updateValueAndValidity();
    this.request.due_at = null;
    this.evaluationTemplate = false;
  }

  trackById(index: number, val: any): number {
    return val.id;
  }

  trackByVal(index: number, val: any): number {
    return val.value;
  }

  trackByName(index: number, val: any): number {
    return val.name;
  }

  handleAsOfDateChange(date) {
    this.request.as_of_date = date;
    this.isValidDueDate(false);
    this.disableNextbutton();
  }

  handleDueDateChange(date) {
    this.request.due_at = date;
    this.isValidDueDate(false);
    this.disableNextbutton();
  }

  disableNextbutton() {
    this.canExitQuestionnaireStep();
    this.investor.disableNextButton(!this.canExitQuestionnaire);
  }

  isValidDueDate(showToaster = true) {
    let isValid = true;
    if (
      this.request.as_of_date &&
      this.request.due_at &&
      !moment(this.request.due_at).isSameOrAfter(
        this.request.as_of_date,
        'day'
      ) &&
      showToaster
    ) {
      this.toaster.error(
        'Due date should be greater than or equal to as of date'
      );
      isValid = false;
      this.isDueDateGreaterThenAsOfDate = true;
      return isValid;
    }
    this.isDueDateGreaterThenAsOfDate = false;
    return isValid;
  }

  handleToggleFilter() {
    this.showMainFilterBasedSelection = !this.showMainFilterBasedSelection;
    if (this.showMainFilterBasedSelection) this.request.template = null;
    this.disableNextbutton();
  }

  handleToggleSubFilter() {
    this.showSubFilterBasedSelection = !this.showSubFilterBasedSelection;
    if (this.showSubFilterBasedSelection) {
      this.request.vehicleTemplate = null;
      this.request.productsTemplate = null;
    }
  }

  handleBackEvent(dvStepper) {
    this.accept_confidential_agreement = false;
    this.questionPageTouched = false;
    this.templateSelectionForm.markAsUntouched();
    dvStepper.previous();
  }

  handleBackToPendingRequest() {
    this.stepInstance.previous();
    this.accept_confidential_agreement = false;
  }

  pendingApprovalBack(dvStepper) {
    this.requestType = '';
    dvStepper.previous();
  }

  /**
   * @returns boolean - return boolean checks if assign reviewer selected or not
   */
  isAssignReviewerSelected(): boolean {
    let assignReviewerSelected = true;
    if (
      this.selected_entities_temp.length >
        this.firm_preferences.threshold_for_approval_flow &&
      this.firm_preferences.enable_approval_flow_information_request &&
      !this.assignedApprovers?.length
    ) {
      assignReviewerSelected = false;
    }

    return assignReviewerSelected;
  }

  handleEntitySearchmapChange(entitySearchmap) {
    this.entitySearchMap = entitySearchmap;
    Object.keys(this.entitySearchMap).forEach((key) => {
      if (!this.entitySearchMap[key].data.length) {
        if (this.allFilterTemplateId) this.allFilterTemplateId[key] = {};
      }
    });
  }
  handleSubEntitySearchmapChange(subEntitySearchMap) {
    this.subEntitySearchMap = subEntitySearchMap;
    Object.keys(this.subEntitySearchMap).forEach((key) => {
      if (!this.subEntitySearchMap[key].data.length) {
        if (this.allSubFilterTemplateId) this.allSubFilterTemplateId[key] = {};
      }
    });
  }
}
