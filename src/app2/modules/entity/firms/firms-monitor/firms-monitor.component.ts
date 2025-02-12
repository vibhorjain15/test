import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FirmDataService } from 'src/app2/services/firm-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { forkJoin } from 'rxjs';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { MentionsFactoryService } from 'src/app2/services/mentions-factory.service';
import * as angular from 'angular';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import { DvMeetingsComponent } from 'src/app2/shared/common/dv-meetings/dv-meetings.component';
@Component({
  selector: 'firms-monitor',
  templateUrl: './firms-monitor.component.html',
  styleUrls: ['./firms-monitor.component.css'],
})
export class FirmsMonitorComponent implements OnInit {
  firm;
  is_investor;
  is_freeSubscription;
  profiles;
  customDateFilter;
  contact_count;
  product_count;
  document_count;
  tags = [];
  firmId;
  customFields = {};
  dateRangeForDirectives;
  entity_type;
  address;
  diligences;
  fundId;
  loading_history;
  displaySidebarPanel;
  sidebarTitle;
  sidebarContent;
  stateParams: any;
  note_id: any;
  FirmIdType: number;
  is_admin: any;
  current_user: any;
  investment;
  tag_list;
  notesOptions;
  maxDate: Date;
  due_date: Date;
  is_data_loaded: boolean;
  loading_prefs: boolean;
  countries: any;
  teamMembers;
  tagsAvailable: boolean;
  filteredTeamMembers: any[];
  sidebarTemplate: string;
  saving_tags: boolean;
  assignedFunctions = [];
  is_manager: boolean;
  removed_tags = {};
  totalRecommendationCount?: number = null;
  recommendationTrackerName?: string = null;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getTeamMembersData) teamMembers$;
  @ViewChild('dvMeetings') DvMeetings:DvMeetingsComponent;

  dropdownItems: any = [
    { key: 'tasks', leftIcon: 'tasks', label: 'Add task' },
    {
      key: 'bg-check',
      leftIcon: 'bg-check',
      label: 'Request background check',
    },
    { key: 'calendar', leftIcon: 'calendar', label: 'Add meeting' },
    { key: 'pencil', leftIcon: 'pencil', label: 'Edit firm' },
    { key: 'cogs', leftIcon: 'cogs', label: 'Start workflow process' },
  ];
  toggleDropdown = false;

  dropdownItemsProfiles = [
    { key: 'add-new-profile', label: 'Add New Profile', disabled: false },
  ];
  toggleProfileDropdown = false;

  constructor(
    private readonly routerService: RouterService,
    private readonly firmDataService: FirmDataService,
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly documentDataService: DocumentDataService,
    private readonly BaseDataService: BaseDataService,
    private readonly customModalFactory: CustomModalService,
    private readonly MentionsFactory: MentionsFactoryService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly recommendationTrackerService: RecommendationTrackerService
  ) {}

  ngOnInit() {
    this.stateParams = this.routerService.getState().params;
    this.firmId = +this.stateParams.firmId;
    //Safety check added for getting proper integer entity id
    if (!Number.isInteger(this.firmId)) {
      this.routerService.navigate('app.home');
      this.toaster.warning('The resource you are looking for cannot be found');
      return;
    }
    this.entity_type = 'Firm';
    this.note_id = null;
    this.FirmIdType = 1220;
    this.investment = {};
    this.tag_list = {};
    this.notesOptions = {
      fullscreen: true,
      undoRedo: true,
      height: 180,
    };
    this.maxDate = new Date();
    this.due_date = new Date();
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_admin = data.isAdmin;
          this.is_freeSubscription = data.isFreeSubscription;
          this.is_investor = data.isInvestor;
          this.is_manager = data.isManager;
          this.firmDataService.getFirm(this.firmId).subscribe((firm: any) => {
            this.firm = firm;
            this.init();
            const domain = this.firm.website;
            this.firm.search_web_url = domain
              ? 'http://google.com/search?q=' + this.firm.name + '+' + domain
              : 'http://google.com/search?q=' + this.firm.name;

            if (!this.is_freeSubscription && firm?.active) {
              this.dropdownItems.unshift({
                label: 'Add internal DDQ',
                key: 'add-internal-ddq',
                leftIcon: 'internal-ddq',
              });
            }
            this.dropdownItems.unshift({
              key: 'divider',
              leftIconClass: 'divider js-delete-button',
            });

            if (firm.active) {
              this.dropdownItems.push({
                key: 'divider',
              });
              this.dropdownItems.push({
                label: 'Mark as inactive',
                key: 'ban',
                leftIcon: 'ban',
              });
            }
            this.dropdownItems.unshift({
              label: 'Search firm on web',
              key: 'search',
              leftIcon: 'search-on-web',
            });
            if (firm?.website) {
              this.dropdownItems.unshift({
                label: 'Open website',
                key: 'home',
                leftIcon: 'home',
              });
            }
            if (this.is_freeSubscription || !this.firm?.active) {
              this.dropdownItemsProfiles[0].disabled = true;
            }
          });
          this.recommendationTrackerService
            .getIssueCounts({
              entity_type: keywordConstants.Firm,
              entity_id: this.firmId,
            })
            .subscribe(
              (data: { total_count: number; completed_count: number }) => {
                this.totalRecommendationCount = data?.total_count;
              }
            );
        }
      });

    this.recommendationTrackerService
      .getIssueCounts({
        entity_type: keywordConstants.Firm,
        entity_id: this.firmId,
      })
      .subscribe((data: { total_count: number; completed_count: number }) => {
        this.totalRecommendationCount = data?.total_count;
      });
  }

  init() {
    this.getFirmPref();
    this.getProfile(this.firmId);
    this.getTeamMembers();
    this.getHeadquarter(this.firmId);
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
        params: { entity_type: this.entity_type, entity_id: this.firmId },
      })
      .subscribe((response: any) => {
        this.tags = response;
        this.sortTags();
      });
    this.firmDataService
      .getRelatedContactCount(this.firmId)
      .subscribe((response: any) => {
        this.contact_count = response;
      });
    this.documentDataService
      .getAttachmentAssignmentCount(this.entity_type, this.firmId)
      .subscribe((response: any) => {
        this.document_count = response.count;
      });
    this.firmDataService
      .getRelatedEntities(this.firmId)
      .subscribe((response: any) => {
        this.product_count = response.length;
      });
  }

  navigateToStrategiesProjectQuestionnaire(profile) {
    // todo: target blank
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

  sortTags() {
    this.tags.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
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
          range: response.default_daterange_months,
        };
      }
      this.recommendationTrackerName = response.issue_tracker_default_name;
      this.loading_prefs = false;
    });
  }

  getCustomFields() {
    this.http
      .post('service/dvapi_service/get_custom_fields_data', {
        entity_id: this.firmId,
        entity_type: this.FirmIdType,
        schema_type: 'firm',
        sub_entity_id: 0,
      })
      .subscribe((response: any) => {
        this.customFields = null;
        this.customFields = angular.copy(response.data);
      });
  }

  getDiligenceHistory(startDate, endDate) {
    this.loading_history = true;
    this.http
      .get('diligences/history', {
        params: {
          entity_id: this.firmId,
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

  getHeadquarter(id) {
    this.BaseDataService.getAddresses({
      entity_id: id,
      entity_type: this.entity_type,
      is_headquarter: true,
    }).subscribe((response: any) => {
      this.address = response[0];
      if (this.address) {
        this.getCountries();
      }
    });
  }

  getCountries() {
    this.http.get('country').subscribe((response: any) => {
      this.countries = response;
      this.address.country_name = this.getCountryNameFromId(
        this.address.country
      );
    });
  }

  getCountryNameFromId(id) {
    const country = this.countries.find((country) => country.id === id);
    return country ? country.value : '';
  }

  findName(id) {
    const member = this.teamMembers.find((member) => member.id === id);
    return member.fullname;
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

  addTask() {
    this.customModalFactory.invoke('manage-task', {
      initialState: {
        task: {
          entity_type: this.entity_type,
          entity_id: this.firmId,
          parent_entity: { entity_id: this.firmId, entity_type: 'Firm' },
        },
      },
    });
  }

  triggerWorkflow() {
    this.customModalFactory.invoke('trigger-workflow', {
      initialState: {
        entity_type: this.entity_type,
        entity_id: this.firmId,
        name: this.firm.name,
      },
    });
  }

  getProfile(firmId) {
    this.firmDataService
      .getProfileQuestionnaires(firmId)
      .subscribe((response: any) => {
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
      });
  }

  addProfile() {
    if (!this.is_freeSubscription && this.firm.active) {
      this.customModalFactory.invoke('add-ddq', {
        initialState: {
          entity_id: this.firm.id,
          entity_type: this.entity_type,
          entity_name: this.firm.name,
          type: 'dd_profile',
        },
        class: 'gray modal-lg',
      });
    }
  }

  addInternalDDQ() {
    this.customModalFactory.invoke('add-ddq', {
      initialState: {
        entity_id: this.firm.id,
        entity_type: this.entity_type,
        entity_name: this.firm.name,
        type: 'dd_new',
      },
      class: 'gray modal-lg',
    });
  }

  filterTeamMembers(term) {
    this.filteredTeamMembers = this.MentionsFactory.getFilteredMembers(term);
  }

  getDisplayName(user) {
    // return this.tinymceEditor.insertContent('');
    return this.MentionsFactory.getDisplayName(user, true);
  }

  onTagRemoved(event) {
    this.removed_tags[event.value.id] = true;
  }

  saveTags() {
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
        entity_id: this.firmId,
        entity_type: this.entity_type,
        tags,
      };
      this.http.post('tag_assignments', params).subscribe(
        (response: any) => {
          const message = 'Tags have been assigned!';
          this.toaster.success(message, '', { timeOut: 5000 });
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
            this.Utils.logError('Tags assignment failed for firm', error);
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
            .filter((tag) => !!this.tags.find((t) => t.id === tag.id))
            .map((tag) => tag.id)
        : [];
    });
    this.sidebarTemplate = 'firms/profile/monitor/tag/template.html';
    this.sidebarTitle = 'Set Tags';
    this.sidebarContent = 'tag';
    this.displaySidebarPanel = true;
  }

  redirectToFirmSettings() {
    this.routerService.navigate('app.firm.settings.all_tags');
  }

  getMatcher(collection: any) {
    // TODO
    /* return function($query: any) {
      if (!$query) { return collection; }
      const regex = new RegExp($query, 'i');
      return _(collection).filter((item: { name: any; }) => regex.test(item.name));
    }; */
  }

  editFirm() {
    this.customModalFactory.invoke('manage-firm', {
      initialState: {
        firm: this.firm,
        response: (firm) => {
          this.firm = firm;
          const domain = this.firm.website;
          this.firm.search_web_url = domain
            ? 'http://google.com/search?q=' + this.firm.name + '+' + domain
            : 'http://google.com/search?q=' + this.firm.name;
          this.getAssignedFunctions();
        },
      },
      class: 'gray modal-lg',
    });
  }

  deactivateFirm() {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to inactivate this firm?',
      confirmButtonText: 'Yes, inactivate!',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        const params = {
          entity_id: this.firmId,
          entity_type: this.entity_type,
        };
        this.http.delete('firm_relationships', { params }).subscribe(() => {
          this.firm.active = false;
          this.toaster.success('Firm marked inactive');
          this.updateMoreActions();
        });
      },
    });
  }

  updateMoreActions() {
    const inActiveOptionIndex = this.dropdownItems.findIndex(
      (x) => x.key == 'ban'
    );
    if (this.firm?.active && inActiveOptionIndex === -1) {
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
    } else if (!this.firm?.active && inActiveOptionIndex !== -1) {
      this.dropdownItems.splice(inActiveOptionIndex - 1); // divider and mark as inactive option
    }
  }

  addMeeting() {
    this.customModalFactory.invoke('manage-event', {
      initialState: {
        entity_type: this.entity_type,
        entity_id: this.firmId,
        onSuccess: () => {
          if(this.DvMeetings){
            this.DvMeetings.getMeetings();
          }
        },
      },
      class: 'gray modal-lg',
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
          entity_id: this.firmId,
          tag_id: tag.id,
        },
      })
      .subscribe(() => {
        this.toaster.success('Tag removed successfully!');
        this.tags.splice(index, 1);
      });
  }

  manageCustomfield() {
    this.customModalFactory.invoke('manage-custom-fields', {
      initialState: {
        entityTypeId: this.FirmIdType,
        entityType: this.entity_type,
        entityId: this.firmId,
        customFields: JSON.parse(JSON.stringify(this.customFields)),
        customUrl: 'firm_tags',
        response: (response) => {
          this.customFields = response.data;
        },
      },
      class: 'gray modal-lg',
    });
  }

  navigateToDiligenceInvite() {
    this.routerService.navigateWithParams(`app.diligence.invite`, {
      fundId: this.fundId,
    });
  }

  navigateToProjectQuestionnaire(diligence) {
    this.routerService.navigateWithParams(
      `app.diligence.project.questionnaire`,
      { diligenceId: diligence.id }
    );
  }

  navigateToMonitorFirms() {
    this.routerService.navigate(`app.monitor.firms`);
  }

  navigateToAssociatedContacts() {
    this.routerService.navigateWithParams(
      `app.firms.profile.associated_contacts`,
      { firmId: this.firm.id }
    );
  }

  navigateToRelatedEntities() {
    this.routerService.navigateWithParams(
      `app.firms.profile.related_entities`,
      { firmId: this.firm.id }
    );
  }

  navigateToDocumentsList() {
    this.routerService.navigateWithParams(`app.firms.profile.documents.list`, {
      firmId: this.firm.id,
    });
  }

  navigateToRecommendationTracker() {
    this.routerService.navigateWithParams(`app.firms.profile.recommendations`, {
      firmId: this.firm.id,
    });
  }

  getAssignedFunctions() {
    return this.http
      .get('function_assignments', {
        params: { entity_id: this.firmId, entity_type: 'Firm' },
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
    this.dateRangeForDirectives = null;
    this.getDiligenceHistory(null, null);
  }

  getLabelClass(status) {
    let type = '';
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

  backgroundCheck() {
    this.routerService.navigateWithParams('app.partnership', {
      entity_id: this.firm.id,
      entity_type: this.entity_type,
      entity_name: this.firm.name,
    });
  }

  onDropdownClick(dvDropdownEvent: { key: any }) {
    if (dvDropdownEvent.key !== 'add-new-profile')
      this.toggleProfileDropdown = false;
    if (+dvDropdownEvent.key) {
      const profile = this.profiles.find((x) => x.id === dvDropdownEvent.key);
      this.navigateToStrategiesProjectQuestionnaire(profile);
      return;
    }
    switch (dvDropdownEvent.key) {
      case 'home':
        window.open(this.firm?.website, '_blank');
        break;
      case 'search':
        window.open(this.firm?.search_web_url, '_blank');
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
      case 'calendar':
        this.addMeeting();
        break;
      case 'pencil':
        this.editFirm();
        break;
      case 'cogs':
        this.triggerWorkflow();
        break;
      case 'ban':
        this.deactivateFirm();
        break;
      case 'add-new-profile':
        this.addProfile();
        break;
      default:
        break;
    }
  }
}
