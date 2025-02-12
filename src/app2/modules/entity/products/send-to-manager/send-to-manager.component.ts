import {
  Component,
  OnInit,
  QueryList,
  ViewChildren,
  ViewChild,
  NgZone,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterService } from 'src/app2/services/router.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DvStepperComponent } from 'src/app2/shared/components/dv-stepper/dv-stepper.component';
import { TooltipDirective } from 'ngx-bootstrap/tooltip';
//import { DatePickerComponent } from 'ngx-bootstrap/datepicker/bs-datepicker.component';
import * as moment from 'moment';
import { UtilsService } from 'src/app2/services/utils.service';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import {
  DvValidators,
  noHtmlValidator,
} from 'src/app2/shared/validators/no-white-space.validator';
import { SendToManagerService } from '../../../../services/projects/send-to-manager.service';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import {
  keywordConstants,
  ErrorStatusCode,
} from 'src/app2/shared/constants/constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
@Component({
  selector: 'app-send-to-manager',
  templateUrl: './send-to-manager.component.html',
  styleUrls: ['./send-to-manager.component.css'],
})
export class SendToManagerComponent implements OnInit {
  @ViewChildren(TooltipDirective) items: QueryList<TooltipDirective>;
  //@ViewChildren(DatePickerComponent) calendars: QueryList<DatePickerComponent>;
  assignedApprovers: any;
  email_templates: any;
  review_diligence_templates: any;
  selected_entities: any = [];
  combinedDiligences: any;
  sender_emails: any;
  cc_emails: any;
  bcc_emails: any;
  use_email_templates: boolean;
  disallow_custom_edits: boolean;
  email_text: string = '';
  due_date_map: any;
  request: any;
  is_data_loaded: boolean;
  entity_type: any;
  selected_sender_email: string;
  selected_cc_email_list: any;
  selected_bcc_email_list: any;
  show_bulk_edit_actions: boolean;
  loading: boolean;
  events: any;
  firm_preferences: any;
  default_email_template_message_id: any;
  templates: any;
  diligencesCopy: any;
  display_wizard_footer: boolean;
  show_dilignece_zero_text: boolean;
  show_bulk_actions: boolean;
  review_templates: any = [];
  diligences = [];
  stateParams;
  templateSelectionForm: FormGroup;
  sendToManagerForm: FormGroup;
  tinyMceInit;
  reviewTemplateSelectionForm;
  accept_confidential_agreement: any;
  templateMap = {};
  @ViewChild('dvStepper') stepInstance: DvStepperComponent; // ref of common grid component to call the deSelect method
  contact: any;
  suggested_due_date_diff = 45;
  @Select(UserState.getCurrentUserData) user$;
  @Select(UserState.getSubscriptionLimitsData) subList;
  @Select(UserState.getFirmPreferenceData) firmPref;
  teamMembers: any;
  current_user: any;
  diligenceId: any;
  diligence: any;
  settings: any;
  issubmitContactForm: boolean;
  maxAsOfDate;
  constructor(
    private readonly http: HttpClient,
    private readonly Utils: UtilsService,
    private readonly router: RouterService,
    private readonly toaster: ToastrService,
    private readonly BaseDataService: BaseDataService,
    private readonly sentByMangerService: SendToManagerService,
    private readonly projectSummaryService: ProjectSummaryService,
    private readonly SweetAlert: SweetAlertService,
    private readonly customModalService: CustomModalService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.createForm();
    this.maxAsOfDate = this.Utils.getMaxAsOfDate();
    this.diligenceId = parseInt(this.router.getState().params.diligenceId);
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.current_user = user;
          this.getCurrentDiligence();
          this.subList.pipe(take(2)).subscribe((sub) => {
            if (sub) this.entity_type = this.Utils.getEntityType(sub[0]);
          });
        }
      });
  }

  createForm() {
    this.sendToManagerForm = new FormGroup({
      contactsControl: new FormControl(null, [Validators.required]),
      asOfDateControl: new FormControl(new Date(), [Validators.required]),
      dueDateControl: new FormControl(null, [Validators.required]),
    });
  }

  getCurrentDiligence() {
    this.projectSummaryService
      .getCurrentDiligence(this.diligenceId, this.current_user)
      .subscribe((diligence: any) => {
        this.diligence = diligence;
        this.getContact();
      });
  }

  getContact() {
    this.sentByMangerService
      .getContact(this.diligence)
      .subscribe((contact: any) => {
        this.is_data_loaded = true;
        let contacts = contact.map((val) => ({
          display: val.fullName,
          value: val.id,
        }));
        this.teamMembers = contacts;
        this.sendToManagerForm.controls['contactsControl'].setValue(
          this.teamMembers.map((x: any) => x.value)
        );
      });
  }

  openQuestionnaireUploadModal(editor) {
    this.ngZone.run(() => {
      this.customModalService.invoke('questionnaire-upload-image', {
        initialState: {
          editor: editor,
        },
        class: 'modal-xl',
      });
    });
  }

  init(isLoaded = false) {
    this.templateSelectionForm = new FormGroup({
      project_name: new FormControl(this.diligence.name, [
        DvValidators.required,
        noHtmlValidator,
      ]),
      use_email_templates: new FormControl(null),
      default_email_template_message_id: new FormControl(null),
      share_documents: new FormControl(false),
    });

    this.tinyMceInit = {
      statusbar: false,
      placeholder: '',
      render: (editor) => {
        this.openQuestionnaireUploadModal(editor);
      },
    };
    this.assignedApprovers = [];
    this.email_templates = [];
    this.review_diligence_templates = [];
    this.selected_entities = [];
    this.combinedDiligences = [];
    this.sender_emails = [];
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
      due_at: this.getSuggestedDueDate(),
      template_id: [],
      entity_id: null,
      review_template: [],
      vehicleTemplate: null,
      productsTemplate: null,
      template: null,
      event_trigger: null,
      DDTypeDisplayName: null,
    };
    this.is_data_loaded = isLoaded;
    this.selected_sender_email = '';
    this.selected_cc_email_list = [];
    this.selected_bcc_email_list = [];
    this.show_bulk_edit_actions = false;
    this.loading = false;
    this.stateParams = this.router.getState().params;
    this.firmPref.pipe(take(1)).subscribe((response) => {
      this.firm_preferences = response;
    });
    forkJoin([
      this.http.get('events'),
      this.http.get('EmailTemplateMessages'),
      this.http.get('templates', {
        params: { detail: false, is_new_information_request: true },
      }),
    ]).subscribe((res: any) => {
      this.is_data_loaded = true;
      if (this.default_email_template_message_id && this.use_email_templates) {
        this.renderEmailTemplate(this.default_email_template_message_id);
      }

      const [events, emailTemplates, templates] = res;
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
      this.assignedApprovers =
        this.firm_preferences.approver_list_for_information_request;
      this.templateSelectionForm
        .get('default_email_template_message_id')
        .setValue(this.firm_preferences.default_email_template_message_id);
      this.default_email_template_message_id =
        this.firm_preferences.default_email_template_message_id;
      if (this.firm_preferences.disallow_custom_email_template_edit) {
        this.disallow_custom_edits = true;
        this.templateSelectionForm.get('use_email_templates').setValue(true);
      }

      if (this.firm_preferences.customize_intro) {
        this.templateSelectionForm.get('use_email_templates').setValue(true);
      }

      if (this.firm_preferences.sender_email) {
        const sender_emails = this.firm_preferences.sender_email
          .replace(/\s/g, '')
          .split(',');
        (sender_emails as Array<string>).forEach((email) => {
          this.sender_emails.push({
            id: email,
            name: email,
          });
        });

        if (
          this.sender_emails.length > 0 &&
          this.firm_preferences.add_sender_email
        ) {
          this.selected_sender_email = this.sender_emails[0].name;
        }
      }

      if (this.firm_preferences.cc_email) {
        const cc_emails =
          this.firm_preferences.cc_email.replace(/\s/g, '').split(',') || [];
        cc_emails.forEach((ccEmail) => {
          this.cc_emails.push({
            id: ccEmail,
            name: ccEmail,
          });
        });
        if (this.cc_emails.length > 0 && this.firm_preferences.add_cc_email) {
          this.selected_cc_email_list.push(this.cc_emails[0].name);
        }
      }

      if (this.firm_preferences.bcc_email) {
        const bcc_emails = this.firm_preferences.bcc_email
          .replace(/\s/g, '')
          .split(',');
        bcc_emails.forEach((bccEmail) => {
          this.bcc_emails.push({
            id: bccEmail,
            name: bccEmail,
          });
        });
        if (this.bcc_emails.length > 0 && this.firm_preferences.add_cc_email) {
          this.selected_bcc_email_list.push(this.bcc_emails[0].name);
        }
      }
    });
  }

  canProceedToTemplateStep(step) {
    this.issubmitContactForm = true;
    if (this.sendToManagerForm.invalid) {
      return;
    }
    this.handleNextClick(step);
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

  getDefaultEmailTemplate(use_email_template: any) {
    if (use_email_template) {
      this.renderEmailTemplate(this.default_email_template_message_id);
    } else {
      this.email_text = '';
    }
  }

  getSuggestedDueDate() {
    return moment().add(this.suggested_due_date_diff, 'days').toDate();
  }

  generatePageUrl() {
    var pageUrl = 'app/diligence/';
    if (
      this.diligence.entity_type.toLowerCase() ==
        keywordConstants.Product.toLowerCase() &&
      !this.diligence.linked_duediligence_id
    ) {
      pageUrl +=
        this.diligence.fromfirm_id +
        '/firms/' +
        this.diligence.tofirm_id +
        '/funds/' +
        this.diligence.entity_id;
    }
    if (
      this.diligence.entity_type.toLowerCase() ==
      keywordConstants.Strategy.toLowerCase()
    ) {
      pageUrl +=
        this.diligence.fromfirm_id +
        '/firms/' +
        this.diligence.tofirm_id +
        '/strategies/' +
        this.diligence.entity_id;
    } else if (
      this.diligence.entity_type.toLowerCase() ==
      keywordConstants.Firm.toLowerCase()
    ) {
      pageUrl +=
        this.diligence.fromfirm_id + '/firms/' + this.diligence.tofirm_id;
    } else if (
      this.diligence.entity_type.toLowerCase() ==
      keywordConstants.Vehicle.toLowerCase()
    ) {
      pageUrl +=
        this.diligence.fromfirm_id +
        '/firms/' +
        this.diligence.tofirm_id +
        '/funds/' +
        this.diligence.parent_entity_id +
        '/vehicles/' +
        this.diligence.entity_id;
    } else if (
      this.diligence.entity_type.toLowerCase() ==
        keywordConstants.Product.toLowerCase() &&
      this.diligence.linked_duediligence_id
    ) {
      pageUrl +=
        this.diligence.fromfirm_id +
        '/firms/' +
        this.diligence.tofirm_id +
        '/strategies/' +
        this.diligence.parent_entity_id +
        '/funds/' +
        this.diligence.entity_id;
    }
    return pageUrl;
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
      id: String(this.diligenceId),
      as_of_date: moment(this.sendToManagerForm.value.asOfDateControl).format(
        'MM-DD-YYYY'
      ),
      due_at: moment(this.sendToManagerForm.value.dueDateControl).format(
        'MM-DD-YYYY'
      ),
      email_text: this.email_text,
      name: this.templateSelectionForm.value.project_name,
      share_project_level_attachments:
        this.templateSelectionForm.value.share_documents,
      from_email: !this.request.is_internal
        ? this.selected_sender_email
        : undefined,
      cc_emails: !this.request.is_internal
        ? this.selected_cc_email_list.join(',')
        : undefined,
      bcc_emails: !this.request.is_internal
        ? this.selected_bcc_email_list.join(',')
        : undefined,
      notification_contacts: this.sendToManagerForm.value.contactsControl,
    };
    this.postDueDiligenceRequest(data);
  }

  postDueDiligenceRequest(data) {
    var pageUrl = this.generatePageUrl();
    this.loading = true;
    this.sentByMangerService.SendRequestContact(data, pageUrl).subscribe(
      (response: any) => {
        this.loading = false;
        this.toaster.success('New request has been successfully added', '', {
          timeOut: 3000,
        });
        this.router.navigateWithParams('app.diligence.projects.activity', {
          type: 'sent',
        });
      },
      (error: { status: any }) => {
        this.loading = false;
        const avoid_error_logging_statuses =
          this.BaseDataService.getAvoidErrorLoggingStatusList();
        if (
          !(
            error &&
            error.status &&
            Object.values(ErrorStatusCode).includes(error.status)
          )
        ) {
          this.toaster.error('Something went wrong. Please try again.');
        }
        if (!avoid_error_logging_statuses.includes(error.status)) {
          this.Utils.logError('Removing Product Association failed', error);
        }
      }
    );
  }

  filterbyStandardTemplate(templates: any) {
    return templates.filter(
      (template: { type: string }) => template.type !== 'dd_profile'
    );
  }

  setSuggestedDueDate() {
    this.sendToManagerForm
      .get('dueDateControl')
      .setValue(new Date(this.getSuggestedDueDate()));
  }

  setDateValue(date, type) {
    this.sendToManagerForm?.get(type).setValue(date);
    this.isValidDueDate();
  }

  isValidDueDate() {
    let isInvalid = false;
    if (
      this.sendToManagerForm.get('asOfDateControl').value &&
      this.sendToManagerForm.get('dueDateControl').value &&
      !moment(this.sendToManagerForm.get('dueDateControl').value).isSameOrAfter(
        this.sendToManagerForm.get('asOfDateControl').value,
        'day'
      )
    ) {
      isInvalid = true;
    }
    this.sendToManagerForm.get('dueDateControl').setErrors({
      inValidDueDate: isInvalid,
    });
    this.sendToManagerForm.get('dueDateControl').updateValueAndValidity();
  }

  backbutton() {
    window.history.back();
  }

  renderEmailTemplate(id: any) {
    const template = this.email_templates.find((val) => val.id === id);
    if (template) {
      this.email_text = template.content;
    } else {
      this.email_text = '';
    }
  }

  handleEditorTextChange(data) {
    this.email_text = data;
  }

  handleScheduleRequestPrevious(step) {
    step.previous();
    this.show_bulk_edit_actions = false;
    this.show_bulk_actions = false;
  }

  handleNextClick(step) {
    step.next();
    this.init();
  }
  handleEmailRouter() {
    this.router.navigateWithParams('app.firm.settings.preferences', {
      '#': 'OutboundEmailSettings',
    });
  }

  routeToEmailTemp() {
    this.router.navigate('app.firm.settings.email_templates');
  }
}
