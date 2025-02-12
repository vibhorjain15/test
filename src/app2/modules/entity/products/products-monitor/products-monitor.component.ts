import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { MentionsFactoryService } from 'src/app2/services/mentions-factory.service';
import {
  keywordConstants,
  statusLabel,
} from 'src/app2/shared/constants/constant';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';
@Component({
  selector: 'products-monitor',
  templateUrl: './products-monitor.component.html',
  styleUrls: ['./products-monitor.component.css'],
})
export class ProductsMonitorComponent implements OnInit {
  fund;
  tags = [];
  is_investor;
  is_freeSubscription;
  profiles = [];
  customDateFilter;
  contact_count;
  document_count;
  fundId;
  customFields;
  dateRangeForDirectives;
  diligences = [];
  loading_history;
  displaySidebarPanel;
  sidebarContent;
  stateParams: any;
  entity_type: string;
  is_admin: any;
  FundIdType: number;
  current_user: any;
  previousState: any;
  investment;
  tag_list;
  maxDate: Date;
  due_date: Date;
  notesOptions: { fullscreen: boolean; undoRedo: boolean; height: number };
  is_data_loaded: boolean;
  loading_prefs: boolean;
  teamMembers: any;
  action_types: any;
  selected_action_type: any;
  tagsAvailable: boolean;
  saving_activity: boolean;
  schedule_diligence_form: any;
  saving_schedule: boolean;
  params;
  template_id: any;
  tag_investment_form: any;
  saving_tags: boolean;
  sidebarTemplate: string;
  sidebarTitle: string;
  templates: any;
  frequencies: any;
  filteredTeamMembers: any[];
  tinymceEditor: any;
  statusLabel = statusLabel;
  assignedFunctions = [];
  removed_tags = {};
  totalRecommendationCount?: number = null;
  recommendationTrackerName?: string = null;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getTeamMembersData) teamMembers$;
  is_manager: boolean = false;

  dropdownItems: any = [
    { key: 'tasks', leftIcon: 'tasks', label: 'Add task' },
    {
      key: 'bg-check',
      leftIcon: 'bg-check',
      label: 'Request background check',
    },
    { key: 'pencil', leftIcon: 'pencil', label: 'Edit product' },
    { key: 'cogs', leftIcon: 'cogs', label: 'Start workflow process' },
  ];
  toggleDropdown = false;

  dropdownItemsProfiles = [
    { key: 'add-new-profile', label: 'Add New Profile', disabled: false },
  ];
  toggleProfileDropdown = false;

  constructor(
    private readonly routerService: RouterService,
    private readonly FundDataservice: FundDataService,
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly DocumentDataservice: DocumentDataService,
    private readonly BaseDataService: BaseDataService,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly MentionsFactory: MentionsFactoryService,
    private readonly customModalService: CustomModalService,
    private readonly recommendationTrackerService: RecommendationTrackerService
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.fundId = +this.stateParams.fundId;
    //Safety check added for getting proper integer entity id
    if (!Number.isInteger(this.fundId)) {
      this.routerService.navigate('app.home');
      this.toaster.warning('The resource you are looking for cannot be found');
      return;
    }
    this.entity_type = 'fund';
    this.FundIdType = 1219;
    this.investment = {};
    this.tag_list = {};
    this.maxDate = new Date();
    this.due_date = new Date();
    this.notesOptions = {
      fullscreen: true,
      undoRedo: true,
      height: 180,
    };
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_admin = data.isAdmin;
          this.is_investor = data.isInvestor;
          this.is_manager = data.isManager;
          this.is_freeSubscription = data.isFreeSubscription;
          this.FundDataservice.getFund(this.fundId).subscribe((fund: any) => {
            this.fund = fund;
            this.init();

            if (!this.is_freeSubscription && fund?.active) {
              this.dropdownItems.unshift({
                key: 'divider',
                leftIconClass: 'divider js-delete-button',
              });

              this.dropdownItems.unshift({
                label: 'Add internal DDQ',
                key: 'add-internal-ddq',
                leftIcon: 'internal-ddq',
              });
            }

            if (fund.active) {
              this.dropdownItems.push({
                key: 'divider',
              });
              this.dropdownItems.push({
                label: 'Mark as inactive',
                key: 'ban',
                leftIcon: 'ban',
              });
            }
            if (fund?.website) {
              this.dropdownItems.unshift({
                label: 'Open website',
                key: 'home',
                leftIcon: 'home',
              });
            }
            if (this.is_freeSubscription || !fund?.active) {
              this.dropdownItemsProfiles[0].disabled = true;
            }
          });
        }
      });
    this.recommendationTrackerService
      .getIssueCounts({
        entity_type: keywordConstants.Product,
        entity_id: this.fundId,
      })
      .subscribe((data: { total_count: number; completed_count: number }) => {
        this.totalRecommendationCount = data?.total_count;
      });
  }

  init() {
    this.getFirmPref();
    this.getProfile(this.fundId);
    this.getTeamMembers();
    this.getCustomFields();
    this.getAssignedFunctions();
    const api_callback_map = {
      conviction: 'filterConvictionLevels',
      assettype: 'filterAssets',
      thesis: 'filterTheses',
      geography: 'filterGeographies',
      watchlist: 'filterWatchLists',
    };
    const promises = Object.entries(api_callback_map).map(([key, value]) => {
      return this.http.get(key).pipe(
        tap((response: any) => {
          this.tag_list[key] = response;
          this[value] = this.getMatcher(response);
          this.setTagsAvailability(response);
        })
      );
    });
    forkJoin(promises).subscribe(() => {
      this.is_data_loaded = true;
    });
    this.http
      .get('tag_assignments', {
        params: { entity_type: this.entity_type, entity_id: this.fundId },
      })
      .subscribe((response: any) => {
        this.tags = response;
        this.sortTags();
      });
    this.FundDataservice.getRelatedContactCount(this.fundId).subscribe(
      (response: any) => {
        this.contact_count = response;
      }
    );
    this.DocumentDataservice.getAttachmentAssignmentCount(
      this.entity_type,
      this.fundId
    ).subscribe((response: any) => {
      this.document_count = response.count;
    });
  }

  applyMethod(startDate, endDate, range) {
    this.getDiligenceHistory(startDate, endDate);
    this.dateRangeForDirectives = {
      startDate,
      endDate,
      range,
    };
  }

  getCustomFields() {
    this.http
      .post('service/dvapi_service/get_custom_fields_data', {
        entity_id: this.fundId,
        entity_type: this.FundIdType,
        schema_type: 'fund',
        sub_entity_id: 0,
      })
      .subscribe((response: any) => {
        this.customFields = response.data;
      });
  }

  getFirmPref() {
    this.loading_prefs = true;
    this.firmPref.pipe(take(1)).subscribe((response) => {
      this.customDateFilter = this.Utils.getPredefinedDateRanges(
        response.default_daterange_months
      );
      if (!response.default_daterange_months) {
        this.getDiligenceHistory(null, null);
        this.dateRangeForDirectives = null;
      } else {
        this.getDiligenceHistory(
          this.Utils.formatDatetime(this.customDateFilter.startDate),
          this.Utils.formatDatetime(this.customDateFilter.endDate)
        );
        this.dateRangeForDirectives = {
          startDate: this.Utils.formatDatetime(this.customDateFilter.startDate),
          endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
          range: response?.default_daterange_months ?? 'null',
        };
      }
      this.recommendationTrackerName = response.issue_tracker_default_name;
      this.loading_prefs = false;
    });
  }

  getDiligenceHistory(startDate, endDate) {
    this.loading_history = true;
    this.http
      .get('diligences/history', {
        params: {
          entity_id: this.fundId,
          entity_type: this.entity_type,
          start_date: startDate,
          end_date: endDate,
        },
      })
      .subscribe((response: any) => {
        this.diligences = response;
        this.loading_history = false;
      });
  }

  sortTags() {
    // TODO: Replace sortBy
    /* return (this.tags = _(this.tags).sortBy(
      (tag: { name: { toLowerCase: () => any } }) => {
        return tag.name.toLowerCase();
      }
    )); */
  }

  addTask() {
    this.customModalService.invoke('manage-task', {
      initialState: {
        task: {
          entity_type: this.entity_type,
          entity_id: this.fundId,
          parent_entity: { entity_id: this.fundId, entity_type: 'Fund' },
        },
      },
    });
  }

  findName(id) {
    const member = this.teamMembers.find((member) => member.id === id);
    return member.fullname;
  }

  setActionType(index) {
    this.selected_action_type = this.action_types[index];
    // TODO: Method not available
    // this.initAddActivityForm();
  }

  setTagsAvailability(response) {
    this.tagsAvailable = this.tagsAvailable || !!response.length;
  }

  getProfile(fundId) {
    this.FundDataservice.getProfileQuestionnaires(fundId).subscribe(
      (response: any) => {
        this.profiles = response;
        if (this.profiles.length) {
          this.dropdownItemsProfiles.push({
            key: 'divider',
            label: '',
            disabled: false,
          });
          this.profiles.map((profile, index) => {
            this.dropdownItemsProfiles.push({
              key: profile.id,
              label: `${index + 1}. ${profile.name}`,
              disabled: false,
            });
          });
        }
      }
    );
  }

  getTeamMembers() {
    this.teamMembers$.pipe(take(2)).subscribe((teamMembers) => {
      if (teamMembers)
        this.teamMembers = teamMembers.map((teamMember) => ({
          ...teamMember,
          fullname: `${teamMember.firstName} ${teamMember.lastName}`,
        }));
    });
  }

  addProfile() {
    if (
      !this.is_freeSubscription &&
      this.fund?.platform_active &&
      this.fund.active
    ) {
      this.customModalService.invoke('add-ddq', {
        initialState: {
          entity_id: this.fund.id,
          entity_type: this.entity_type,
          entity_name: this.fund.name,
          type: 'dd_profile',
        },
        class: 'gray modal-lg',
      });
    }
  }

  addInternalDDQ() {
    this.customModalService.invoke('add-ddq', {
      initialState: {
        entity_id: this.fund.id,
        entity_type: this.entity_type,
        entity_name: this.fund.name,
        type: 'dd_new',
        //investorRequest: true,
      },
      class: 'gray modal-lg',
    });
  }

  activityAdditionSuccessful(message) {
    this.saving_activity = false;
    this.toaster.success('', message);
    // TODO: Method not available
    // this.initAddActivityForm();
  }

  scheduleDiligence() {
    // TODO: Form Handling
    if (this.schedule_diligence_form.$valid) {
      this.saving_schedule = true;
      this.params = {
        entities: [{ id: this.fundId, entity_type: this.entity_type }],
        is_internal: false,
        investor_ids: [],
        diligence_type: 'dd_ongoing',
        status: 'Scheduled',
        template_id: this.template_id,
        // TODO: this.frequency not available
        // scheduled_for: this.getScheduledDate(this.frequency),
      };
      this.http
        .post('v2/diligences', this.params)
        .subscribe((response: any) => {
          const message = 'Monitoring schedule has been set!';
          this.saving_schedule = false;
          this.toaster.success('', message, { timeOut: 5000 });
          this.displaySidebarPanel = false;
          this.diligences.unshift(response);
        });
    }
  }

  getMatcher(collection) {
    return function ($query: any) {
      if (!$query) {
        return collection;
      }
      const regex = new RegExp($query, 'i');
      return collection.filter((item) => regex.test(item.name));
    };
  }

  getScheduledDate(frequency) {
    if (frequency === 'Monthly') {
      // TODO
      // return new Date() + 30;
    } else if (frequency === 'Quarterly') {
      // TODO
      // return new Date() + 90;
    }
  }

  onTagRemoved(event) {
    this.removed_tags[event.value.id] = true;
  }

  saveTags() {
    const categories = [
      'conviction_levels',
      'assets',
      'theses',
      'geographies',
      'watchlists',
    ];
    let tags = [];
    for (const key in this.investment) {
      if (this.investment[key].length > 0) {
        this.investment[key].forEach((value) => {
          tags.push({
            tag_id: value,
            is_active: true,
          });
          this.removed_tags[value] = false;
        });
      }
    }
    for (const tagid in this.removed_tags) {
      if (
        this.removed_tags[tagid] &&
        this.tags.find((tag) => tag.id == tagid)
      ) {
        tags.push({
          tag_id: tagid,
          is_active: false,
        });
      }
    }
    if (tags.length || this.tags.length) {
      this.saving_tags = true;
      const params = {
        entity_id: this.fundId,
        entity_type: this.entity_type,
        tags,
      };
      this.http.post('tag_assignments', params).subscribe(
        (response: any) => {
          const message = 'Tags have been assigned!';
          this.toaster.success('', message, { timeOut: 5000 });
          this.saving_tags = false;
          this.displaySidebarPanel = false;
          this.tags = response;
          this.sortTags();
          this.investment = {};
        },
        (error: any) => {
          this.saving_tags = false;
          const avoid_error_logging_statuses =
            this.BaseDataService.getAvoidErrorLoggingStatusList();
          if (!avoid_error_logging_statuses.includes(error.status)) {
            delete error.config.data.email_text;
            this.Utils.logError('Tags assignment failed for funds', error);
          }
        }
      );
    }
  }

  displayTagsController() {
    this.removed_tags = {};
    const value_map = {
      AssetAllocation: 'assettype',
      Conviction: 'conviction',
      InvestmentThesis: 'thesis',
      Geography: 'geography',
      WatchList: 'watchlist',
    };
    const selection_map = {
      AssetAllocation: 'assets',
      InvestmentThesis: 'theses',
      Conviction: 'conviction_levels',
      Geography: 'geographies',
      WatchList: 'watchlists',
    };
    [
      'AssetAllocation',
      'InvestmentThesis',
      'Geography',
      'Conviction',
      'WatchList',
    ].forEach((type) => {
      this.investment[selection_map[type]] = this.tag_list[value_map[type]]
        ? this.tag_list[value_map[type]]
            .filter((tag) => !!this.tags.find((newTag) => newTag.id === tag.id))
            .map((tag) => tag.id)
        : [];
    });
    this.sidebarTemplate = 'funds/profile/monitor/tag/template.html';
    this.sidebarTitle = 'Set Tags';
    this.sidebarContent = 'tag';
    this.displaySidebarPanel = true;
  }

  removeSchedule(diligence) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to remove this schedule?',
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.http.delete('v2/Diligences/' + diligence.id).subscribe(() => {
          const message = 'Due Diligence was unscheduled successfully';
          this.diligences.splice(this.diligences.indexOf(diligence.id), 1);
          this.toaster.success('', message, { timeOut: 5000 });
        });
      }, //until this is resolved https://github.com/oitozero/ng@SweetAlert/commit/863ac0af581b0f7b551b9ecf0cece96d2b077eb4
    });
  }

  displayScheduleController() {
    this.http.get('templates').subscribe((response: any) => {
      this.templates = response;
    });
    this.http.get('frequency').subscribe((response: any) => {
      this.frequencies = response;
    });
    this.sidebarTemplate = 'funds/profile/monitor/schedule/template.html';
    this.sidebarTitle = 'Schedule Diligence';
    this.sidebarContent = 'schedule';
    this.displaySidebarPanel = true;
  }

  redirectToFirmSettings() {
    this.routerService.navigate('app.firm.settings.all_tags');
  }

  filterTeamMembers(term) {
    this.filteredTeamMembers = this.MentionsFactory.getFilteredMembers(term);
  }

  getDisplayName(user) {
    this.tinymceEditor.insertContent('');
    this.MentionsFactory.getDisplayName(user, true);
  }

  editFund() {
    this.customModalService.invoke('manage-fund', {
      initialState: {
        fund: this.fund,
        source: 'monitor',
        response: (fund: any) => {
          this.fund = fund;
          this.getAssignedFunctions();
        },
      },
      class: 'gray modal-lg',
    });
  }

  deactivateFund() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to inactivate this product?',
      confirmButtonText: 'Yes, inactivate!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        let promise;
        if (this.is_investor) {
          const params = {
            entity_id: this.fundId,
            entity_type: 'fund',
          };
          promise = this.http.delete('firm_relationships', { params });
        } else {
          promise = this.http.delete(`funds/${this.fundId}`);
        }
        promise.subscribe(() => {
          this.fund.active = false;
          this.toaster.success('', 'Product marked inactive');
          this.updateMoreActions();
        });
      },
    });
  }

  updateMoreActions() {
    const inActiveOptionIndex = this.dropdownItems.findIndex(
      (x) => x.key == 'ban'
    );
    if (this.fund?.active && inActiveOptionIndex === -1) {
      // if product is active and mark as inactive not present
      this.dropdownItems.push({
        label: '',
        key: 'divider',
        leftIcon: null,
      });
      this.dropdownItems.push({
        key: 'ban',
        label: 'Mark as inactive',
        leftIcon: 'ban',
      });
    } else if (!this.fund?.active && inActiveOptionIndex !== -1) {
      this.dropdownItems.splice(inActiveOptionIndex - 1); // divider and mark as inactive option
    }
  }

  triggerWorkflow() {
    this.customModalService.invoke('trigger-workflow', {
      initialState: {
        entity_type: this.entity_type,
        entity_id: this.fundId,
        name: this.fund.name,
      },
    });
  }

  displayTagRemovalConfirmation(tag, index) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to remove \"${tag.name}\"?`,
      confirmButtonText: 'Yes',
      focusCancel: true,
    }).then((isConfirm) => {
      if (isConfirm.value && isConfirm.value === true) {
        this.removeTag(tag, index);
      }
    });
  }

  removeTag(tag, index) {
    this.http
      .delete('tag_assignments', {
        params: {
          entity_type: this.entity_type,
          entity_id: this.fundId,
          tag_id: tag.id,
        },
      })
      .subscribe(() => {
        this.toaster.success('', 'Tag removed successfully!');
        this.tags.splice(index, 1);
      });
  }

  manageCustomfield() {
    this.customModalService.invoke('manage-custom-fields', {
      initialState: {
        entityTypeId: this.FundIdType,
        entityType: this.entity_type,
        entityId: this.fundId,
        customFields: JSON.parse(JSON.stringify(this.customFields)),
        customUrl: 'product_tags',
        response: (response) => {
          this.customFields = response.data;
        },
      },
      class: 'gray modal-lg',
    });
  }

  navigateToMonitor() {
    this.routerService.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.fund.parentFirm.id,
    });
  }

  navigateToFirmQuestionnaire(profile) {
    this.routerService.navigateWithParams(
      `app.diligence.firms.funds.project.questionnaire`,
      {
        fromfirmId: profile.fromfirm_id,
        tofirmId: profile.tofirm_id,
        fundId: profile.entity_id,
        diligenceId: profile.id,
      }
    );
  }

  navigateToInvestments() {
    this.routerService.navigate(`app.monitor.investments`);
  }

  navigateToContacts() {
    this.routerService.navigateWithParams(`app.firms.funds.profile.contacts`, {
      firmId: this.fund.parentFirm.id,
      fundId: this.fundId,
    });
  }

  navigateToDocumentsList() {
    this.routerService.navigateWithParams(
      `app.firms.funds.profile.documents.list`,
      {
        firmId: this.fund.parentFirm.id,
        fundId: this.fundId,
      }
    );
  }

  navigateToInvite() {
    this.routerService.navigateWithParams(`app.diligence.invite`, {
      fundId: this.fundId,
    });
  }

  navigateToProjectQuestionnaire(diligenceId) {
    this.routerService.navigateWithParams(
      `app.diligence.project.questionnaire`,
      { diligenceId }
    );
  }

  navigateToRecommendationTracker() {
    this.routerService.navigateWithParams(
      `app.firms.funds.profile.recommendations`,
      {
        firmId: this.fund.parentFirm.id,
        fundId: this.fundId,
      }
    );
  }

  getStatusClass(status) {
    let type;
    switch (status) {
      case 'Completed':
      case 'Approved':
      case 'APPROVED':
      case 'Unanswered':
      case 'ExtensionApproved':
      case 'Registered':
        type = 'success';
        break;
      case 'NotApproved':
      case 'Deleted':
      case 'Answered':
      case 'Withdrawn':
      case 'ExtensionDeclined':
      case 'Retired':
        type = 'danger';
        break;
      case 'Started':
      case 'Following':
      case 'Scheduled':
      case 'ACTIVE':
        type = 'default';
        break;
      case 'Followup':
      case 'Invested':
      case 'Invited':
      case 'PendingRestart':
      case 'APPROVED-120':
      case 'WIP':
      case 'Extension Requested':
      case 'ExtensionRequested':
      case 'ERA':
        type = 'warning';
        break;
      case 'Reminded':
      case 'Restarted':
      case 'RestartApproved':
      case 'InReview':
      case 'Evaluation':
        type = 'info';
        break;
      case 'Sent':
        type = 'orange';
        break;
    }
    return `label-${type}`;
  }

  getAssignedFunctions() {
    this.http
      .get('function_assignments', {
        params: { entity_id: this.fundId, entity_type: 'Fund' },
      })
      .subscribe((response: any) => {
        this.assignedFunctions = response;
      });
  }

  onChange(event) {
    if (event && event.startDate && event.endDate) {
      this.applyMethod(
        this.Utils.formatDatetime(event.startDate),
        this.Utils.formatDatetime(event.endDate),
        event.range
      );
    }
  }

  onClearDateFilter() {
    setTimeout(() => {
      this.dateRangeForDirectives = null;
      this.getDiligenceHistory(null, null);
    });
  }

  backgroundCheck() {
    this.routerService.navigateWithParams('app.partnership', {
      entity_id: this.fund.id,
      entity_type: 'fund',
      entity_name: this.fund.name,
    });
  }

  onDropdownClick(dvDropdownEvent: { key: string }) {
    if (dvDropdownEvent.key !== 'add-new-profile')
      this.toggleProfileDropdown = false;
    if (+dvDropdownEvent.key) {
      const profile = this.profiles.find((x) => x.id === dvDropdownEvent.key);
      this.navigateToFirmQuestionnaire(profile);
      return;
    }
    switch (dvDropdownEvent.key) {
      case 'home':
        window.open(this.fund?.website, '_blank');
        break;
      case 'search':
        window.open(this.fund?.search_web_url, '_blank');
        break;
      case 'add-internal-ddq':
        this.addInternalDDQ();
        break;
      case 'tasks':
        this.addTask();
        break;
      case 'bg-check':
        this.backgroundCheck();
        break;
      case 'pencil':
        this.editFund();
        break;
      case 'cogs':
        this.triggerWorkflow();
        break;
      case 'ban':
        this.deactivateFund();
        break;
      case 'add-new-profile':
        this.addProfile();
        break;
      default:
        break;
    }
  }
}
