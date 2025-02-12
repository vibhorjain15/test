import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import {
  DownloadMedium,
  EveryonePermissionTypeId,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { RouterService } from 'src/app2/services/router.service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { catchError, take } from 'rxjs/operators';
import {
  GetDocumentTags,
  UpdateFirmPreference,
} from 'src/app2/store/user/user.action';

import {
  FormArray,
  FormControl,
  FormGroup,
  NgModel,
  Validators,
} from '@angular/forms';
import { updateIssuePriorities } from '../../recommendation/store/recommendation.action';
import { ViewportScroller } from '@angular/common';
import { Router } from '@angular/router';
import { HighestRoleObj } from 'src/app2/services/permission/permission.type';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { AI_Policy_Condensed_Agreement } from 'src/app2/shared/constants/policy.constants';
@Component({
  selector: 'app-firm-preferences',
  templateUrl: './firm-preferences.component.html',
  styleUrls: ['./firm-preferences.component.css'],
})
export class FirmPreferencesComponent implements OnInit, OnDestroy {
  @ViewChild('issue_tracker_default_name') issueTrackerDefaultName: NgModel;
  default_preference_firm: boolean;
  is_investor: boolean;
  dateRanges;
  firm_preferences;
  firm_preferences_copy;
  stateParams: any;
  frequencies;
  email_templates;
  email_text;
  saving_preferences: boolean;
  currentUser;
  teamMembers: any[];
  default_response_word_limit_error: string;
  password_expiration_frequency_error: string;
  password_reuse_limit_error: string;
  threshold_for_approval_flow_error: string;
  generic_email_error: string = null;
  firmPrefSub;
  assignDefaultRole: boolean = false;
  default_daterange_months;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  roles: any[];
  loadingFirmPreference = true;
  selectedColors: any = [];
  logoLink = null;
  defaultPrimaryColor: string;
  color: string;
  firmPreferences: any;
  designPreferenceForm: FormGroup;
  savingFirmPreferences: boolean;
  colors: FormArray;
  current_user: any;
  pattern = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/;
  colorMap = new Map();
  imageSub;
  stateParamsPara;
  statuses: any = [];
  priorities: any = [];
  NewColors: any = [];
  priorityColors: FormArray;
  priorityNames: FormArray;
  statusColors: FormArray;
  statusNames: FormArray;
  headingList: Array<dvTabsList> = [];
  activeMenu = '';

  @ViewChildren('tab', { read: ElementRef }) settings: QueryList<ElementRef>;
  issue_tracker_default_name_error: string;
  customizeMatchSettings: boolean;
  permissionTypes: any[];
  permissionTypeHelpText: string;
  permissionRoles: any[];
  EveryonePermissionTypeId = EveryonePermissionTypeId;
  documentTabs = [
    {
      id: 1,
      value: 'Uploads',
    },
    {
      id: 2,
      value: 'Received',
    },
    {
      id: 3,
      value: 'All',
    },
  ];
  documentViews = [
    {
      id: 1,
      value: 'File',
    },
    {
      id: 2,
      value: 'Folder',
    },
  ];

  tabsMap = {
    PlatformDefaults: 'PlatformDefaults',
    PermissionDefaults: 'PermissionDefaults',
    ControlWorkflowDefaults: 'ControlWorkflowDefaults',
    OutboundEmailSettings: 'OutboundEmailSettings',
    HeatmapDisplay: 'HeatmapDisplay',
    QandAContentDefaults: 'QandAContentDefaults',
    QuestionnaireDefaults: 'QuestionnaireDefaults',
    RecommendationsTracker: 'RecommendationsTracker',
    RegulatoryFilings: 'RegulatoryFilings',
    AutofillDefaults: 'AutofillDefaults',
  };
  constructor(
    private readonly Utils: UtilsService,
    private readonly store: Store,
    private readonly http: HttpClient,
    private readonly toastr: ToastrService,
    private readonly BaseDataService: BaseDataService,
    private readonly routerService: RouterService,
    private readonly toaster: ToastrService,
    private readonly scroller: ViewportScroller,
    private readonly modalService: CustomModalService
  ) {}

  handleRoute(link: any, i) {
    this.headingList.map((h) => (h.active = false));
    this.headingList[i].active = true;
    let newArr = [];
    this.settings.forEach((element) => newArr.push(element));

    newArr.forEach((e) => {
      if (e.nativeElement.attributes.getNamedItem(link)) {
        const headerOffset = 45;
        const elementPosition = e.nativeElement.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.firmPrefSub) this.firmPrefSub.unsubscribe();
  }

  handleTabChange(i, removeFragment?: boolean) {
    this.headingList.map((value: any, index: any) => {
      if (index == i) {
        value.active = true;
      } else {
        value.active = false;
      }
    });
    if (removeFragment) {
      this.routerService.navigateWithParams('app.firm.settings.preferences', {
        '#': this.headingList[i].link,
      });
    }
    setTimeout(() => {
      this.scroller.scrollToAnchor(this.headingList[i].link);
    }, 100);
    this.activeMenu = this.headingList[i].link;
  }
  ngOnInit(): void {
    this.stateParamsPara = this.routerService.getState().params;
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.is_investor = data.isInvestor;
        this.currentUser = data;
        this.initialize();
        // this.setSettingSection();
        this.loadingFirmPreference = false;
        this.colorMap = new Map();
      }
    });
    this.headingList = [
      {
        name: 'Platform Defaults',
        link: this.tabsMap['PlatformDefaults'],
        active: true,
        condition: true,
      },
      {
        name: 'Permission Defaults',
        link: this.tabsMap['PermissionDefaults'],
        active: false,
        condition: true,
      },
      {
        name: 'Control Workflow',
        link: this.tabsMap['ControlWorkflowDefaults'],
        active: false,
        condition: true,
      },
      {
        name: 'Email Defaults',
        link: this.tabsMap['OutboundEmailSettings'],
        active: false,
        condition: true,
      },
      {
        name: 'Heatmap',
        link: this.tabsMap['HeatmapDisplay'],
        active: false,
        condition: this.is_investor,
      },
      {
        name: 'Q/A Content',
        link: this.tabsMap['QandAContentDefaults'],
        active: false,
        condition: !this.is_investor,
      },
      {
        name: 'Questionnaire',
        link: this.tabsMap['QuestionnaireDefaults'],
        active: false,
        condition: true,
      },
      {
        name: 'Recommendations',
        link: this.tabsMap['RecommendationsTracker'],
        active: false,
        condition: true,
      },
      {
        name: 'Regulatory Filings',
        link: this.tabsMap['RegulatoryFilings'],
        active: false,
        condition: true,
      },
      {
        name: 'Auto-fill Defaults',
        link: this.tabsMap['AutofillDefaults'],
        active: false,
        condition: true,
      },
      {
        name: 'Document Defaults',
        link: 'DocumentDefaults',
        active: false,
        condition: true,
      },
    ];
    if (this.stateParamsPara['#']) {
      const i = this.headingList.findIndex(
        (a) => a.link == this.stateParamsPara['#']
      );

      this.headingList.forEach((value: any, index: any) => {
        if (index == i) {
          value.active = true;
        } else {
          value.active = false;
        }
      });
    }
  }

  initialize() {
    this.default_preference_firm = false;
    this.email_templates = [];
    this.teamMembers = [];
    this.dateRanges = [
      { label: 'Last 1 month', value: 1 },
      { label: 'Last 3 months', value: 3 },
      { label: 'Last 6 months', value: 6 },
      { label: 'Last 1 year', value: 12 },
      { label: 'No Filter', value: 'null' },
    ];
    forkJoin([
      this.http.get(`EmailTemplateMessages`),
      this.http.get(`alert_frequencies`),
      this.BaseDataService.getRoles(this.currentUser.firmInfo.id, {
        include_admins: true,
      }),
      this.http.get(`issue_priorities`),
      this.BaseDataService.getPermissionTypes(true),
      this.BaseDataService.getRoles(this.currentUser.firmInfo.id, {
        include_admins: false,
      }),
    ]).subscribe((response: any[]) => {
      this.priorities = response[3];
      this.permissionTypes = response[4];
      this.permissionRoles = response[5];
      this.permissionRoles.unshift(HighestRoleObj);
      this.initiateStatusAndPriorities();
      this.firmPrefSub = this.firmPref.pipe(take(1)).subscribe((pref) => {
        this.firm_preferences = JSON.parse(JSON.stringify(pref));
        this.firm_preferences_copy = {
          ...this.firm_preferences,
          default_document_tab: this.getDefaultDocumentTabInt(
            this.firm_preferences?.default_document_tab
          ),
          default_document_view: this.getDefaultDocumentViewInt(
            this.firm_preferences?.default_document_view
          ),
        };
        this.headingList.find(
          (x) => x.link == this.tabsMap.RecommendationsTracker
        ).name = this.firm_preferences_copy.issue_tracker_default_name;
        if (this.firm_preferences.default_user_access_role) {
          this.assignDefaultRole = true;
        }
        this.getAllTeamMembers();
        this.default_daterange_months = !this.firm_preferences_copy
          .default_daterange_months
          ? 'null'
          : this.firm_preferences_copy.default_daterange_months;
        this.email_templates = response[0];
        this.frequencies = response[1];
        this.roles = response[2];
        this.setDefaultPreferenceFirm();
        if (this.firm_preferences_copy.default_email_template_message_id) {
          this.renderEmailTemplate(
            this.firm_preferences_copy.default_email_template_message_id
          );
        }
        this.customizeMatchSettings =
          !!this.firm_preferences_copy.autofill_match_settings_percentage;
        this.onPermissionTypeChange(
          this.firm_preferences_copy.default_permission_type
        );
      });
      if (this.stateParamsPara['#']) {
        const i = this.headingList.findIndex(
          (a) => a.link == this.stateParamsPara['#']
        );

        this.headingList.forEach((value: any, index: any) => {
          if (index == i) {
            value.active = true;
          } else {
            value.active = false;
          }
        });
        setTimeout(() => {
          this.scroller.scrollToAnchor(this.stateParamsPara['#']);
        }, 100);
      } else {
        this.headingList.forEach((value: any, index: any) => {
          if (index == 0) {
            value.active = true;
          } else {
            value.active = false;
          }
        });
      }
    });
  }

  getDefaultDocumentTabInt(defaultDocumentTab) {
    if (!defaultDocumentTab) {
      return 1;
    }

    switch (defaultDocumentTab.toLowerCase()) {
      case 'myattachments':
        return 1;
      case 'received':
        return 2;
      case 'all':
        return 3;
    }
  }

  getDefaultDocumentViewInt(defaultDocumentView) {
    if (!defaultDocumentView) {
      return 1;
    }

    switch (defaultDocumentView.toLowerCase()) {
      case 'file':
        return 1;
      case 'folder':
        return 2;
    }
  }

  onPermissionTypeChange(value) {
    this.firm_preferences_copy.default_permission_type = value;
    this.permissionTypeHelpText = this.permissionTypes.find(
      (x) => x.id === value
    ).description;
  }

  initiateStatusAndPriorities() {
    this.designPreferenceForm = new FormGroup({
      priority: new FormGroup({
        priorityColors: new FormArray([]),
        priorityNames: new FormArray([]),
      }),
    });
    this.priorityColors = this.designPreferenceForm.get(
      'priority.priorityColors'
    ) as FormArray;
    this.priorityNames = this.designPreferenceForm.get(
      'priority.priorityNames'
    ) as FormArray;

    this.priorities.forEach((priority) => {
      this.priorityColors.push(
        new FormControl(priority.color_code, [
          Validators.required,
          Validators.pattern(this.pattern),
        ])
      );
      this.priorityNames.push(
        new FormControl(priority.name, [Validators.required])
      );
    });
  }

  trackByIndex(index: number, element): number {
    return index;
  }

  onPriorityColorPickerChange(color, index) {
    this.priorityColors.controls[index].setValue(color);
    this.colorMap = new Map();
    this.priorityColors.controls.forEach((control, i) => {
      this.updateColor(control.value.toUpperCase());
    });
  }

  getColor(color, index) {
    return this.Utils.isColorLightOrDarkModified(color);
  }

  updateColor(color) {
    color = color.toUpperCase();
    if (this.colorMap.has(color)) {
      const count = this.colorMap.get(color);
      this.colorMap.set(color, count + 1);
    } else {
      this.colorMap.set(color, 1);
    }
  }
  handlePriorityColorChange(data, index) {
    this.colorMap = new Map();
    this.priorityColors.controls.forEach((control, i) => {
      this.updateColor(control.value.toUpperCase());
    });
  }

  resetColors() {
    this.initiateStatusAndPriorities();
    this.colorMap = new Map();
  }

  setDefaultPreferenceFirm() {
    this.default_preference_firm =
      this.firm_preferences.set_firm_entity_default &&
      this.firm_preferences.set_firm_entity_default.toLowerCase() ===
        keywordConstants.Firm.toLowerCase()
        ? true
        : false;
  }

  renderEmailTemplate(id) {
    const template = this.email_templates.find(
      (template) => template.id === id
    );
    if (template) {
      this.email_text = template.content;
    } else {
      this.email_text = null;
    }
  }

  setFirmEntityDefault() {
    if (this.default_preference_firm) {
      this.firm_preferences_copy.set_firm_entity_default =
        keywordConstants.Firm;
    } else {
      this.firm_preferences_copy.set_firm_entity_default =
        keywordConstants.Product;
    }
  }

  validCCEmails() {
    if (
      this.firm_preferences_copy.cc_email &&
      this.firm_preferences_copy.add_cc_email
    ) {
      const emailList = this.firm_preferences_copy.cc_email
        .replace(/\s/g, '')
        .split(',');
      if (this.validateEmailList(emailList)) {
        if (!this.uniqueEmails(emailList)) {
          this.toastr.error(`CC emails not unique`);
          return false;
        } else {
          return true;
        }
      } else {
        this.toastr.error('CC emails not valid');
        return false;
      }
    } else {
      return true;
    }
  }

  validateEmailList(emailList) {
    let valid = true;
    emailList.forEach((email) => {
      if (email.length === 0 || !this.Utils.validateEmail(email)) {
        valid = false;
      }
    });
    return valid;
  }

  uniqueEmails(emails) {
    let unique = true;
    const uniqueList = [...new Set(emails)];
    if (uniqueList.length !== emails.length) {
      unique = false;
    }
    return unique;
  }

  validSenderEmails() {
    if (
      this.firm_preferences_copy.sender_email &&
      this.firm_preferences_copy.add_sender_email
    ) {
      const emailList = this.firm_preferences_copy.sender_email
        .replace(/\s/g, '')
        .split(',');
      if (this.validateEmailList(emailList)) {
        if (!this.uniqueEmails(emailList)) {
          this.toastr.error('Sender emails not unique');
          return false;
        } else {
          return true;
        }
      } else {
        this.toastr.error('Sender emails not valid');
        return false;
      }
    } else {
      return true;
    }
  }

  validBCCEmails() {
    if (
      this.firm_preferences_copy.bcc_email &&
      this.firm_preferences_copy.add_cc_email
    ) {
      const emailList = this.firm_preferences_copy.bcc_email
        .replace(/\s/g, '')
        .split(',');
      if (this.validateEmailList(emailList)) {
        if (!this.uniqueEmails(emailList)) {
          this.toastr.error('BCC emails not unique');
          return false;
        } else {
          return true;
        }
      } else {
        this.toastr.error('BCC emails not valid');
        return false;
      }
    } else {
      return true;
    }
  }

  /**
   * @returns boolean checks cc and bcc emails are unique or not
   */
  validateUniqueEmails(): boolean {
    let bccEmailList: Array<string> = this.firm_preferences_copy.bcc_email
      .replace(/\s/g, '')
      .split(',');
    let ccEmailList: Array<string> = this.firm_preferences_copy.cc_email
      .replace(/\s/g, '')
      .split(',');

    // filtering the empty values if user enter only comma
    ccEmailList = ccEmailList.filter((x) => x);
    bccEmailList = bccEmailList.filter((x) => x);

    let isValidEmails = ccEmailList.some((i: string) =>
      bccEmailList.includes(i)
    );
    return isValidEmails;
  }

  validatePriorities() {
    let error = '';
    this.designPreferenceForm
      .get('priority.priorityColors')
      ['controls'].map((color) => {
        if (color instanceof FormControl) {
          color.markAsTouched({ onlySelf: true });
        }
        if (this.colorMap.get(color.value.toUpperCase()) > 1) {
          error = "You can't have duplicate colors in the list.";
          color.setErrors({
            duplicateColor: true,
          });
        }
        if (this.colorMap.get(color.value.toUpperCase()) == 1) {
          if (color.hasError('duplicateColor')) {
            delete color.errors['firstError'];
            color.updateValueAndValidity();
          }
        }
        if (color.hasError('required')) {
          error = 'Color scales are required';
        }
      });
    this.designPreferenceForm
      .get('priority.priorityNames')
      ['controls'].map((name) => {
        if (name.hasError('required')) {
          error = 'Priority names are required';
        }
      });

    if (error) {
      this.toastr.error('Recommendations error: ' + error);
      return false;
    } else {
      return true;
    }
  }

  submit() {
    if (
      this.firm_preferences_copy.add_cc_email &&
      this.firm_preferences_copy.cc_email?.length &&
      this.firm_preferences_copy.bcc_email?.length &&
      this.validateUniqueEmails()
    )
      return this.toaster.error(`CC email & BCC email can't be same.`);
    if (!this.customizeMatchSettings) {
      this.firm_preferences_copy.autofill_match_settings_percentage = null;
    } else if (
      this.customizeMatchSettings &&
      (!this.firm_preferences_copy.autofill_match_settings_percentage ||
        this.firm_preferences_copy.autofill_match_settings_percentage < 0 ||
        this.firm_preferences_copy.autofill_match_settings_percentage > 100 ||
        !Number.isInteger(
          this.firm_preferences_copy.autofill_match_settings_percentage
        ))
    ) {
      this.toaster.error(
        'Please enter the match settings percentage as an integer between 0 and 100.'
      );
      return;
    }
    if (
      this.firm_preferences_copy.default_permission_type ===
        EveryonePermissionTypeId &&
      !this.firm_preferences_copy.default_permission_role
    ) {
      this.toaster.error(
        'Please select the default role for the Everyone permission mode.'
      );
      return;
    }
    if (!this.firm_preferences_copy.add_generic_email) {
      this.generic_email_error = null;
      this.firm_preferences_copy.generic_email = null;
    }
    if (
      this.validCCEmails() &&
      this.validSenderEmails() &&
      this.validBCCEmails() &&
      this.validatePriorities() &&
      !this.default_response_word_limit_error &&
      !this.password_expiration_frequency_error &&
      !this.password_reuse_limit_error &&
      !this.threshold_for_approval_flow_error &&
      !this.generic_email_error &&
      !this.issue_tracker_default_name_error &&
      !this.designPreferenceForm.invalid &&
      !this.issueTrackerDefaultName?.errors?.containsHtml
    ) {
      this.saving_preferences = true;
      this.setFirmEntityDefault();
      this.firm_preferences_copy.default_daterange_months =
        this.default_daterange_months === 'null'
          ? null
          : this.default_daterange_months;
      if (!this.firm_preferences_copy.enable_Review_Workflow) {
        this.firm_preferences_copy.review_workflow_mandatory_for_internal_diligence =
          false;
        this.firm_preferences_copy.review_workflow_mandatory_for_external_diligence =
          false;
      }
      if (!this.assignDefaultRole) {
        this.firm_preferences_copy.default_user_access_role = null;
      }
      let priorityPayload = [];
      this.priorities.forEach((s: any, index) => {
        let payload = {
          id: s.id,
          name: this.designPreferenceForm.get('priority.priorityNames')[
            'controls'
          ][index].value,
          color_code: this.designPreferenceForm.get('priority.priorityColors')[
            'controls'
          ][index].value,
        };
        priorityPayload.push(payload);
      });
      this.store.dispatch(new updateIssuePriorities(priorityPayload));
      this.store
        .dispatch(new UpdateFirmPreference(this.firm_preferences_copy))
        .pipe(
          catchError((error) => {
            this.saving_preferences = false;
            const avoid_error_logging_statuses =
              this.BaseDataService.getAvoidErrorLoggingStatusList();
            if (!avoid_error_logging_statuses.includes(error.status)) {
              delete error.config?.data.introduction;
              delete error.config?.data.generic_email;
              delete error.config?.data.sender_email;
              delete error.config?.data.cc_email;
              delete error.config?.data.bcc_email;
              this.Utils.logError('Updating Firm Preferences failed', error);
            }
            return of(null);
          })
        )
        .subscribe((value) => {
          if (value) {
            this.toastr.success('Firm preferences saved successfully', '', {
              timeOut: 5000,
            });
            if (
              this.firm_preferences.enable_system_document_tags !==
              this.firm_preferences_copy.enable_system_document_tags
            ) {
              // user changed the preference so update the store
              this.store.dispatch(new GetDocumentTags());
            }
            this.firm_preferences = { ...this.firm_preferences_copy };
            this.handleQuestionLimit(
              this.firm_preferences_copy.default_response_word_limit
            );
            this.saving_preferences = false;
            this.setDefaultPreferenceFirm();
          }
        });
    }
  }

  getAllTeamMembers() {
    this.BaseDataService.getTeamMembers().subscribe((teamMembers: any) => {
      this.teamMembers = teamMembers.map((teamMember) => ({
        ...teamMember,
        fullName: `${teamMember.firstName} ${teamMember.lastName}`,
      }));
      this.firm_preferences_copy.approver_list_for_information_request =
        this.firm_preferences_copy.approver_list_for_information_request.filter(
          (id) => this.teamMembers.some((member) => member.id === id)
        );
    });
  }

  navigateToEmailTemplates() {
    this.routerService.navigate(`app.firm.settings.email_templates`);
  }

  handleQuestionLimit(data) {
    if (data && Number(data) === 0) {
      this.default_response_word_limit_error =
        'Please select a value that is not less than 1';
      return;
    }
    let val = this.numberValidation(data);
    if (val === 0) {
      this.firm_preferences_copy.default_response_word_limit = null;
      this.default_response_word_limit_error = null;
    } else {
      this.default_response_word_limit_error = val as string;
    }
  }

  handleIssueTrackerName(data) {
    this.issue_tracker_default_name_error = !data
      ? 'Please provide a default name for tracker'
      : this.issueTrackerDefaultName?.errors?.containsHtml
      ? 'Default name for tracker is not valid'
      : '';
  }

  handlePasswordLimit(data) {
    let val = this.numberValidation(data);
    if (val === 0) {
      this.firm_preferences_copy.password_expiration_frequency = 0;
      this.password_expiration_frequency_error = null;
    } else {
      this.password_expiration_frequency_error = val as string;
    }
  }

  handleReuseLimit(data) {
    let val = this.numberValidation(data);
    if (val === 0) {
      this.firm_preferences_copy.password_reuse_limit = 0;
      this.password_reuse_limit_error = null;
    } else {
      this.password_reuse_limit_error = val as string;
    }
  }

  handleThresholdLimit(data) {
    let val = this.numberValidation(data);
    if (val === 0) {
      this.firm_preferences_copy.threshold_for_approval_flow = 0;
      this.threshold_for_approval_flow_error = null;
    } else {
      this.threshold_for_approval_flow_error = val as string;
    }
  }

  handleGenricEmailAddress(data) {
    if (!this.Utils.validateEmail(data)) {
      this.generic_email_error = 'Please enter a valid email address';
    } else {
      this.generic_email_error = null;
    }
  }

  numberValidation(data) {
    if (data && !data.toString().match(/^[+]?\d{0,89}$/)) {
      return 'please enter a valid number';
    }
    if (!data) {
      return 0;
    } else if (data !== 0 && !`${data}`.match(/^[+]?\d{0,6}$/)) {
      return 'please enter a valid value less than 1,000,000.';
    } else {
      return null;
    }
  }

  handleShowAIpolicy(value) {
    if (value) {
      this.firm_preferences_copy.enable_gen_ai = false;
      this.modalService.invoke('policy-changes', {
        initialState: {
          title: 'DiligenceVault AI Terms of Use Policy',
          policyDoc: AI_Policy_Condensed_Agreement,
          handleAccept: () => {
            this.firm_preferences_copy.enable_gen_ai = true;
          },
        },
      });
    }
  }
}
