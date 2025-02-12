import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { VehicleDataService } from 'src/app2/services/vehicle-data.service';
import {
  keywordConstants,
  statusLabel,
} from 'src/app2/shared/constants/constant';
import { forkJoin } from 'rxjs';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { ToastrService } from 'ngx-toastr';
import { MentionsFactoryService } from 'src/app2/services/mentions-factory.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';

@Component({
  selector: 'vehicles-monitor',
  templateUrl: './vehicles-monitor.component.html',
  styleUrls: ['./vehicles-monitor.component.css'],
})
export class VehiclesMonitorComponent implements OnInit {
  vehicle;
  tags = [];
  statusLabel = statusLabel;
  is_manager;
  customDateFilter;
  entity_type;
  document_count;
  is_investor;
  vehicleId;
  customFields;
  diligences = [];
  loading_history;
  displaySidebarPanel;
  sidebarTitle;
  sidebarContent;
  stateParams: any;
  is_admin: any;
  VehicleIdType: number;
  firmId: any;
  fundId: any;
  current_user: any;
  is_freeSubscription: boolean;
  investment;
  tag_list;
  maxDate: Date;
  due_date: Date;
  notesOptions;
  is_data_loaded: boolean;
  dateRangeForDirectives;
  loading_prefs: boolean;
  teamMembers = [];
  action_types: any;
  selected_action_type: any;
  tagsAvailable: boolean;
  saving_activity: boolean;
  tag_investment_form: any;
  saving_tags: boolean;
  sidebarTemplate: string;
  filteredTeamMembers: any[];
  assignedFunctions = [];
  removed_tags = {};
  totalRecommendationCount?: number = null;
  recommendationTrackerName?: string = null;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getTeamMembersData) teamMembers$;

  dropdownItems: any = [
    { key: 'tasks', leftIcon: 'tasks', label: 'Add task' },
    {
      key: 'bg-check',
      leftIcon: 'bg-check',
      label: 'Request background check',
    },
    { key: 'pencil', leftIcon: 'pencil', label: 'Edit vehicle' },
  ];
  dropdownToggle = false;

  constructor(
    private readonly routerService: RouterService,
    private readonly Utils: UtilsService,
    private readonly VehicleDataService: VehicleDataService,
    private readonly http: HttpClient,
    private readonly DocumentDataservice: DocumentDataService,
    private readonly BaseDataService: BaseDataService,
    private readonly toaster: ToastrService,
    private readonly MentionsFactory: MentionsFactoryService,
    private readonly SweetAlert: SweetAlertService,
    private readonly customModalService: CustomModalService,
    private readonly recommendationTrackerService: RecommendationTrackerService
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.vehicleId = +this.stateParams.vehicleId;
    this.firmId = +this.stateParams.firmId;
    this.fundId = +this.stateParams.fundId;
    //Safety check added for getting proper integer entity id
    if (!Number.isInteger(this.vehicleId)) {
      this.routerService.navigate('app.home');
      this.toaster.warning('The resource you are looking for cannot be found');
      return;
    }
    this.entity_type = this.Utils.getDisplayEntityType(
      keywordConstants.Vehicle
    );
    this.VehicleIdType = 1217;
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
          this.is_investor = data.isInvestor;
          this.is_admin = data.isAdmin;
          this.is_freeSubscription = data.isFreeSubscription;
          this.VehicleDataService.getVehicle(
            this.firmId,
            this.fundId,
            this.vehicleId
          ).subscribe(
            (vehicle: any) => {
              this.vehicle = vehicle;
              if (this.vehicle?.is_active) {
                this.dropdownItems.push({
                  leftIcon: null,
                  key: 'divider',
                  label: '',
                });
                this.dropdownItems.push({
                  leftIcon: 'ban',
                  key: 'ban',
                  label: 'Mark as inactive',
                  class: 'text-danger',
                });
              }
              this.init();
            },
            (e) => {
              this.routerService.navigate('app.home');
            }
          );
        }
      });
    this.recommendationTrackerService
      .getIssueCounts({
        entity_type: keywordConstants.Vehicle,
        entity_id: this.vehicleId,
      })
      .subscribe((data: { total_count: number; completed_count: number }) => {
        this.totalRecommendationCount = data?.total_count;
      });
  }

  init() {
    this.getFirmPref();
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
        params: { entity_type: this.entity_type, entity_id: this.vehicleId },
      })
      .subscribe((response: any) => {
        this.tags = response;
        this.sortTags();
      });
    this.DocumentDataservice.getAttachmentAssignmentCount(
      this.entity_type,
      this.vehicleId
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
        entity_id: this.vehicleId,
        entity_type: this.VehicleIdType,
        schema_type: 'vehicle',
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
      if (response.default_daterange_months) {
        this.getDiligenceHistory(
          this.Utils.formatDatetime(this.customDateFilter.startDate),
          this.Utils.formatDatetime(this.customDateFilter.endDate)
        );
        this.dateRangeForDirectives = {
          startDate: this.Utils.formatDatetime(this.customDateFilter.startDate),
          endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
          range: response?.default_daterange_months ?? 'null',
        };
      } else {
        this.getDiligenceHistory(null, null);
        this.dateRangeForDirectives = null;
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
          entity_id: this.vehicleId,
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
          entity_id: this.vehicleId,
        },
      },
    });
  }

  editVehicle() {
    this.customModalService.invoke('manage-vehicle', {
      initialState: {
        vehicle: this.vehicle,
        response: (response) => {
          this.vehicle = response;
          this.getAssignedFunctions();
        },
      },
      class: 'gray modal-lg',
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
    this.tagsAvailable ||= !!response.length;
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

  activityAdditionSuccessful(message) {
    this.saving_activity = false;
    this.toaster.success('', message);
    // TODO: Method not available
    // this.initAddActivityForm();
  }

  getMatcher(collection) {
    return function ($query) {
      if (!$query) {
        return collection;
      }
      const regex = new RegExp($query, 'i');
      return collection.filter((item) => regex.test(item.name));
    };
  }

  onTagRemoved(event) {
    this.removed_tags[event.value.id] = true;
  }
  displayTagRemovalConfirmation(tag, index) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to remove "${tag.name}"?`,
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
          entity_id: this.vehicleId,
          tag_id: tag.id,
        },
      })
      .subscribe(
        () => {
          this.toaster.success('Tag removed successfully!');
          this.tags.splice(index, 1);
        },
        () => {
          this.toaster.error('Something went wrong!');
        }
      );
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
        entity_id: this.vehicleId,
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
            .filter((tag1) => !!this.tags.find((tag2) => tag1.id === tag2.id))
            .map((tag) => tag.id)
        : [];
    });
    this.sidebarTemplate = 'funds/profile/monitor/tag/template.html';
    this.sidebarTitle = 'Set Tags';
    this.sidebarContent = 'tag';
    this.displaySidebarPanel = true;
  }

  filterTeamMembers(term) {
    this.filteredTeamMembers = this.MentionsFactory.getFilteredMembers(term);
  }

  redirectToFirmSettings() {
    this.routerService.navigate('app.firm.settings.all_tags');
  }

  getDisplayName(user) {
    // TODO: tinymceEditor
    // this.tinymceEditor.insertContent('');
    this.MentionsFactory.getDisplayName(user, true);
  }

  deactivateVehicle() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to inactivate this vehicle?',
      confirmButtonText: 'Yes, inactivate!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.VehicleDataService.deactivateVehicle(
          this.vehicle.firm_id,
          this.vehicle.fund_id,
          this.vehicle.id
        ).subscribe(() => {
          this.vehicle.is_active = false;
          this.toaster.success('', 'Vehicle marked inactive');
          this.updateMoreActions();
        });
      },
    });
  }

  updateMoreActions() {
    const inActiveOptionIndex = this.dropdownItems.findIndex(
      (x) => x.key == 'ban'
    );
    if (this.vehicle?.is_active && inActiveOptionIndex === -1) {
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
    } else if (!this.vehicle?.is_active && inActiveOptionIndex !== -1) {
      this.dropdownItems.splice(inActiveOptionIndex - 1); // divider and mark as inactive option
    }
  }

  manageCustomfield() {
    this.customModalService.invoke('manage-custom-fields', {
      initialState: {
        entityTypeId: this.VehicleIdType,
        entityType: this.entity_type,
        entityId: +this.vehicleId,
        customFields: JSON.parse(JSON.stringify(this.customFields)),
        customUrl: 'vehicle_tags',
        response: (response) => {
          this.customFields = response.data;
        },
      },
      class: 'gray modal-lg',
    });
  }

  navigateToProfileMonitor() {
    this.routerService.navigateWithParams(`app.firms.funds.profile.monitor`, {
      firmId: this.vehicle.firm_id,
      fundId: this.vehicle.fund_id,
    });
  }

  navigateToProfileAumTr() {
    this.routerService.navigateWithParams(`app.firms.funds.profile.aum_tr`, {
      firmId: this.vehicle.firm_id,
      fundId: this.vehicle.fund_id,
    });
  }

  navigateToMonitorVehicles() {
    this.routerService.navigate(`app.monitor.vehicles`);
  }

  navigateToDiligenceInvite() {
    this.routerService.navigateWithParams(`app.diligence.invite`, {
      vehicleId: this.vehicleId,
    });
  }

  navigateToProjectQuestionnaire(diligenceId) {
    this.routerService.navigateWithParams(
      `app.diligence.project.questionnaire`,
      { diligenceId }
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
        params: { entity_id: this.vehicleId, entity_type: 'Vehicle' },
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
      entity_id: this.vehicleId,
      entity_type: 'Vehicle',
      entity_name: this.vehicle.name,
    });
  }

  onDropdownClick(dvDropdownEvent: any) {
    switch (dvDropdownEvent.key) {
      case 'tasks':
        this.addTask();
        break;
      case 'bg-check':
        this.backgroundCheck();
        break;
      case 'pencil':
        this.editVehicle();
        break;
      case 'ban':
        this.deactivateVehicle();
        break;
      default:
        break;
    }
  }
}
