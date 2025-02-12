import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { ToastrService } from 'ngx-toastr';
import { MentionsFactoryService } from 'src/app2/services/mentions-factory.service';
import { RouterService } from 'src/app2/services/router.service';
import { StrategyDataService } from 'src/app2/services/strategy-data.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';

import {
  keywordConstants,
  statusLabel,
} from 'src/app2/shared/constants/constant';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';
@Component({
  selector: 'strategies-monitor',
  templateUrl: './strategies-monitor.component.html',
  styleUrls: ['./strategies-monitor.component.css'],
})
export class StrategiesMonitorComponent implements OnInit {
  strategy;
  tags = [];
  contact_count;
  document_count;
  is_investor;
  diligences = [];
  loading_history;
  displaySidebarPanel;
  sidebarTitle;
  sidebarContent;
  stateParams: any;
  strategyId: any;
  entity_type: string;
  is_admin: any;
  StrategyIdType: number;
  current_user: any;
  is_freeSubscription: boolean;
  previousState: any;
  investment: {};
  tag_list: {};
  maxDate: Date;
  due_date: Date;
  notesOptions: { fullscreen: boolean; undoRedo: boolean; height: number };
  is_data_loaded: boolean;
  dateRangeForDirectives;
  customFields: any;
  loading_prefs: boolean;
  customDateFilter: any;
  teamMembers: any;
  action_types: any;
  selected_action_type: any;
  tagsAvailable: boolean;
  profiles: any;
  saving_activity: boolean;
  schedule_diligence_form: any;
  saving_schedule: boolean;
  params: any;
  template_id: any;
  tag_investment_form: any;
  saving_tags: boolean;
  sidebarTemplate: string;
  templates: any;
  frequencies: any;
  filteredTeamMembers: any;
  assignedFunctions = [];
  removed_tags = {};
  is_manager = false;
  totalRecommendationCount?: number = null;
  recommendationTrackerName?: string = null;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getTeamMembersData) teamMembers$;
  statusLabel = statusLabel;

  dropdownItems: any = [
    { key: 'tasks', leftIcon: 'tasks', label: 'Add task' },
    {
      key: 'bg-check',
      leftIcon: 'bg-check',
      label: 'Request background check',
    },
    { key: 'pencil', leftIcon: 'pencil', label: 'Edit Strategy' },
    { key: 'cogs', leftIcon: 'cogs', label: 'Start workflow process' },
  ];
  dropdownToggle = false;

  dropdownItemsProfiles = [
    { key: 'add-new-profile', label: 'Add New Profile', disabled: false },
  ];
  toggleProfileDropdown = false;

  constructor(
    private readonly routerService: RouterService,
    private readonly StrategyDataservice: StrategyDataService,
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly BaseDataService: BaseDataService,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly DocumentDataservice: DocumentDataService,
    private readonly MentionsFactory: MentionsFactoryService,
    private readonly customModalService: CustomModalService,
    private readonly recommendationTrackerService: RecommendationTrackerService
  ) {}

  ngOnInit(): void {
    this.stateParams = this.routerService.getState().params;
    this.strategyId = +this.stateParams.strategyId;
    //Safety check added for getting proper integer entity id
    if (!Number.isInteger(this.strategyId)) {
      this.routerService.navigate('app.home');
      this.toaster.warning('The resource you are looking for cannot be found');
      return;
    }
    this.entity_type = 'Strategy';
    this.StrategyIdType = 5004;
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
          this.is_manager = data.isManager;
          this.is_admin = data.isAdmin;
          this.is_investor = data.isInvestor;
          this.is_freeSubscription = data.isFreeSubscription;
          this.StrategyDataservice.getStrategy(this.strategyId).subscribe(
            (strategy) => {
              this.strategy = strategy;
              if (this.strategy.active) {
                this.dropdownItems.push({
                  key: 'divider',
                });
                this.dropdownItems.push({
                  key: 'ban',
                  leftIcon: 'ban',
                  label: 'Mark as inactive',
                });
              }
              if (
                !this.is_freeSubscription &&
                this.strategy?.platform_active &&
                this.strategy?.active
              ) {
                this.dropdownItems.unshift({
                  key: 'divider',
                });
                this.dropdownItems.unshift({
                  key: 'search',
                  leftIcon: 'internal-ddq',
                  label: 'Add internal DDQ',
                });
              }

              if (
                this.is_freeSubscription ||
                !this.strategy?.platform_active ||
                !this.strategy?.active
              ) {
                this.dropdownItemsProfiles[0].disabled = true;
              }
              this.init();
            }
          );
        }
      });
    this.recommendationTrackerService
      .getIssueCounts({
        entity_type: keywordConstants.Strategy,
        entity_id: this.strategyId,
      })
      .subscribe((data: { total_count: number; completed_count: number }) => {
        this.totalRecommendationCount = data?.total_count;
      });
  }

  init() {
    this.getFirmPref();
    this.getProfile(this.strategyId);
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
    /* const promises = _(api_callback_map).each((value: string | number, key: string | number) => {
      return this.Restangular.all(key).getList().then((response: any) => {
        this.tag_list[key] = response;
        this[value] = this.getMatcher(response);
        return this.setTagsAvailability(response);
      }).$promise;
    }); */
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
        params: { entity_type: this.entity_type, entity_id: this.strategyId },
      })
      .subscribe((response: any) => {
        this.tags = response;
        this.sortTags();
      });
    this.StrategyDataservice.getRelatedContactCount(this.strategyId).subscribe(
      (response: any) => {
        this.contact_count = response;
      }
    );
    this.DocumentDataservice.getAttachmentAssignmentCount(
      this.entity_type,
      this.strategyId
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
        entity_id: this.strategyId,
        entity_type: this.StrategyIdType,
        schema_type: 'strategy',
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
          entity_id: this.strategyId,
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
    /* this.tags = _(this.tags).sortBy(
      (tag: { name: { toLowerCase: () => any } }) => {
        return tag.name.toLowerCase();
      }
    ); */
  }

  addTask() {
    this.customModalService.invoke('manage-task', {
      initialState: {
        task: {
          entity_type: this.entity_type,
          entity_id: this.strategyId,
          parent_entity: {
            entity_id: this.strategyId,
            entity_type: 'Strategy',
          },
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
    this.tagsAvailable = !!response.length;
  }

  getProfile(strategyId) {
    this.StrategyDataservice.getProfileQuestionnaires(strategyId).subscribe(
      (response: any) => {
        this.profiles = response;
        if (this.profiles.length) {
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
      this.strategy?.platform_active &&
      this.strategy.active
    ) {
      this.customModalService.invoke('add-ddq', {
        initialState: {
          entity_id: this.strategy.id,
          entity_type: this.entity_type,
          entity_name: this.strategy.name,
          type: 'dd_profile',
        },
        class: 'gray modal-lg',
      });
    }
  }

  addInternalDDQ() {
    this.customModalService.invoke('add-ddq', {
      initialState: {
        entity_id: this.strategy.id,
        entity_type: this.entity_type,
        entity_name: this.strategy.name,
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
    if (this.schedule_diligence_form.$valid) {
      this.saving_schedule = true;
      this.params = {
        entities: [{ id: this.strategyId, entity_type: this.entity_type }],
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
    // TODO: Replace $query
    /* if (!$query) {
      return collection;
    }
    const regex = new RegExp($query, 'i');
    return _(collection).filter((item: { name: any }) => regex.test(item.name)); */
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
        entity_id: this.strategyId,
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
            this.Utils.logError('Tags assignment failed for strategies', error);
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
            .filter((tag1) => !!this.tags.find((tag2) => tag1.id === tag2.id))
            .map((tag) => tag.id)
        : [];
    });
    this.sidebarTemplate = 'strategies/profile/monitor/tag/template.html';
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
        this.http.delete('v2/Diligences' + diligence.id).subscribe(() => {
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
    this.sidebarTemplate = 'strategies/profile/monitor/schedule/template.html';
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
    // TODO: tinymceEditor
    // this.tinymceEditor.insertContent('');
    this.MentionsFactory.getDisplayName(user, true);
  }

  editStrategy() {
    this.customModalService.invoke('manage-fund', {
      initialState: {
        fund: this.strategy,
        source: 'monitor',
        fund_type: 'strategy',
        response: (strategy) => {
          this.strategy = strategy;
          this.getAssignedFunctions();
        },
      },
      class: 'gray modal-lg',
    });
  }

  deactivateStrategy() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to inactivate this strategy?',
      confirmButtonText: 'Yes, inactivate!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        let promise;
        if (this.is_investor) {
          const params = {
            entity_id: this.strategyId,
            entity_type: 'strategy',
          };
          promise = this.http.delete('firm_relationships', { params });
        } else {
          promise = this.http.delete(`funds/${this.strategyId}`);
        }
        promise.subscribe(() => {
          this.strategy.active = false;
          this.toaster.success('', 'Strategy marked inactive');
          this.updateMoreActions();
        });
      },
    });
  }

  updateMoreActions() {
    const inActiveOptionIndex = this.dropdownItems.findIndex(
      (x) => x.key == 'ban'
    );
    if (this.strategy?.active && inActiveOptionIndex === -1) {
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
    } else if (!this.strategy?.active && inActiveOptionIndex !== -1) {
      this.dropdownItems.splice(inActiveOptionIndex - 1); // divider and mark as inactive option
    }
  }

  triggerWorkflow() {
    this.customModalService.invoke('trigger-workflow', {
      initialState: {
        entity_type: this.entity_type,
        entity_id: this.strategyId,
        name: this.strategy.name,
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
          entity_id: this.strategyId,
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
        entityTypeId: this.StrategyIdType,
        entityType: this.entity_type,
        entityId: +this.strategyId,
        customFields: JSON.parse(JSON.stringify(this.customFields)),
        customUrl: 'strategy_tags',
        response: (response) => {
          this.customFields = response.data;
        },
      },
      class: 'gray modal-lg',
    });
  }

  navigateToProfileMonitor() {
    this.routerService.navigateWithParams(`app.firms.profile.monitor`, {
      firmId: this.strategy.parentFirm.id,
    });
  }

  navigateToStrategiesProjectQuestionnaire(profile) {
    this.routerService.navigateWithParams(
      `app.diligence.firms.strategies.project.questionnaire`,
      {
        fromfirmId: profile.fromfirm_id,
        tofirmId: profile.tofirm_id,
        strategyId: profile.entity_id,
        diligenceId: profile.id,
      }
    );
  }

  navigateToMonitorStrategies() {
    this.routerService.navigate(`app.monitor.strategies`);
  }

  navigateToDiligenceInvite() {
    this.routerService.navigateWithParams(`app.diligence.invite`, {
      strategyId: this.strategyId,
    });
  }

  navigateToProjectQuestionnaire(diligence) {
    this.routerService.navigateWithParams(
      `app.diligence.project.questionnaire`,
      { diligenceId: diligence.id }
    );
  }

  navigateToContacts() {
    this.routerService.navigateWithParams(
      `app.firms.strategies.profile.contacts`,
      {
        firmId: this.strategy.parentFirm.id,
        strategyId: this.strategyId,
      }
    );
  }

  navigateToDocumentsList() {
    this.routerService.navigateWithParams(
      `app.firms.strategies.profile.documents.list`,
      {
        firmId: this.strategy.parentFirm.id,
        strategyId: this.strategyId,
      }
    );
  }

  navigateToRecommendationTracker() {
    this.routerService.navigateWithParams(
      `app.firms.strategies.profile.recommendations`,
      {
        firmId: this.strategy.parentFirm.id,
        strategyId: this.strategyId,
      }
    );
  }

  getAssignedFunctions() {
    this.http
      .get('function_assignments', {
        params: { entity_id: this.strategyId, entity_type: this.entity_type },
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
      entity_id: this.strategyId,
      entity_type: this.entity_type,
      entity_name: this.strategy.name,
    });
  }

  onDropdownClick(dvDropdownEvent: any) {
    if (+dvDropdownEvent.key) {
      const profile = this.profiles.find((x) => x.id === dvDropdownEvent.key);
      this.navigateToStrategiesProjectQuestionnaire(profile);
      return;
    }

    switch (dvDropdownEvent.key) {
      case 'tasks':
        this.addTask();
        break;
      case 'bg-check':
        this.backgroundCheck();
        break;
      case 'pencil':
        this.editStrategy();
        break;
      case 'ban':
        this.deactivateStrategy();
        break;
      case 'cogs':
        this.triggerWorkflow();
        break;
      case 'search':
        this.addInternalDDQ();
        break;
      case 'add-new-profile':
        this.addProfile();
        break;
      default:
        break;
    }
  }
}
