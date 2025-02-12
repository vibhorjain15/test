import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { RouterService } from 'src/app2/services/router.service';
import { DropDownType } from 'src/app2/shared/components/dv-dropdown/dv-dropdown.component';
import {
  allFiltersMap,
  defaultFilters,
  diligenceStatusConstant,
  filterForRole,
} from '../../constants/quick-view-headers.constant';
import {
  ClearCategory,
  FilterReload,
  GetDiligenceSectionData,
  UpdateActivePanelId,
  UpdateDraftData,
  UpdateFilterMap,
} from '../../store/questionnaire.action';
import { QuestionState } from '../../store/questionnaire.state';
import {
  DiligenceTypeEnum,
  DiligenceTypeFilters,
} from '../../types/diligence-enum.type';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { DvDraftService } from '../../service/draft.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { UserState } from 'src/app2/store/user/user.state';
import { UtilsService } from 'src/app2/services/utils.service';
import { QuestionnaireStatusService } from '../../service/status.service';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { RatingSchemeMappingType } from '../../types/rating-scheme-mapping.type';
@Component({
  selector: 'quick-view-header',
  templateUrl: './quick-view-header.component.html',
  styleUrls: ['./quick-view-header.component.css'],
})
export class QuickViewHeaderComponent implements OnInit, OnChanges, OnDestroy {
  quickViewlist = [];
  dropDownList = [];
  counts = [];
  @Input() usertype = 'investor';
  @Input() diligence = null;
  @Input() isSidePanel = false;
  @Select(QuestionState.getQuestionnaireCountOnly) questions;
  @Select(QuestionState.getFilterReload) filterState;

  filter = 'default';
  countSub;
  paramStatus;
  newFilterList = [];
  currentUser: CurrentUserModel;
  ngUnsubscribe = new Subject();
  excludedPercentage: number;
  excludedPercentageThreshold: number = 20;
  ratingLevel: string;
  constructor(
    private readonly store: Store,
    private router: RouterService,
    private draftService: DvDraftService,
    private panel: SidePanelService,
    private readonly utils: UtilsService,
    private readonly status: QuestionnaireStatusService,
    private readonly questionnaire: QuestionnaireService
  ) {}

  ngOnInit(): void {
    this.questions.pipe(takeUntil(this.ngUnsubscribe)).subscribe((val) => {
      if (val) {
        this.counts = val;
        this.updateFilterList();
        this.isSidePanel && this.updateDropdown();
      }
    });

    this.filterState.pipe(takeUntil(this.ngUnsubscribe)).subscribe((filter) => {
      if (filter) {
        this.paramStatus = this.router.getState().params?.status;
        this.filter = this.paramStatus ? this.paramStatus : 'default';
        this.updateNewList();
      }
    });

    if (this.diligence) {
      this.questionnaire
        .getTemplateRatingSchemeMapping(
          this.diligence.template_id,
          this.diligence.template_version
        )
        .subscribe((res: RatingSchemeMappingType[]) => {
          if (res.length) {
            this.ratingLevel = res[0].rating_level;
          }
        });
    }
  }

  updateParams() {
    this.paramStatus = this.router.getState().params?.status;
    if (this.paramStatus) {
      this.filter = this.paramStatus;
      for (let index = 0; index < this.dropDownList.length; index++) {
        this.dropDownList[index].color =
          this.filter !== 'default' &&
          this.dropDownList[index].param == this.paramStatus
            ? 'primary'
            : 'default';
      }
    }
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.diligence &&
      changes.diligence.currentValue !== changes.diligence.previousValue
    ) {
      this.updateFilterList();
      this.updateParams();
    }
    if (
      changes?.isSidePanel &&
      changes.isSidePanel.currentValue !== changes.isSidePanel.previousValue
    ) {
      this.isSidePanel = changes.isSidePanel.currentValue;
      this.updateDropdown();
      this.updateParams();
    }
  }

  updateFilterList() {
    const userFilters = JSON.parse(
      JSON.stringify(filterForRole(this.diligence)[this.usertype])
    );
    const { diligence_type, status, is_internal } = this.diligence;
    let filters = defaultFilters;
    if (status == diligenceStatusConstant.InReview) {
      if (diligence_type == DiligenceTypeEnum.dd_review)
        filters = userFilters[DiligenceTypeFilters.rating_project];
      else filters = userFilters[DiligenceTypeFilters.review_project_pre];
    } else if (status == diligenceStatusConstant.Evaluation)
      filters = userFilters[DiligenceTypeFilters.review_project_post];
    else if (diligence_type == DiligenceTypeEnum.dd_review)
      filters = userFilters[DiligenceTypeFilters.analyst_evaluation];
    else if (is_internal && diligence_type != DiligenceTypeEnum.dd_profile)
      filters = userFilters[DiligenceTypeFilters.dd_internal];
    else filters = userFilters[diligence_type];
    let currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );

    if (
      !this.diligence.is_internal &&
      (status == diligenceStatusConstant.InReview ||
        status == diligenceStatusConstant.Evaluation)
    ) {
      if (filters.main.findIndex((val) => val == 'OpenFollowupTotal') === -1) {
        filters.main.push('OpenFollowupTotal');
      }
      if (
        filters.main.findIndex((val) => val == 'ResolvedFollowupTotal') === -1
      ) {
        filters.main.push('ResolvedFollowupTotal');
      }
    }

    //Block for hiding autofill dropdown if its investor or the user is old autofill modal
    if (
      currentUser.isInvestor ||
      !this.utils.getFirmPreferences().enable_es_autofill ||
      this.utils.isFreeSubscription()
    ) {
      allFiltersMap['AutoFilledResponses'].param = 'ExactMatchAutofill';
      allFiltersMap['AutoFilledResponses'].isDropdown = false;
      allFiltersMap['AutoFilledResponses'].dropdownList = null;
    }

    if (!this.diligence.is_internal && this.diligence.completed_at) {
      if (currentUser.isInvestor) {
        if (
          filters.main.findIndex(
            (val) => val == 'ResponsesWithRevisionsCount'
          ) === -1
        ) {
          filters.main.push('ResponsesWithRevisionsCount');
        }
      } else {
        if (
          filters?.main?.findIndex(
            (val) => val == 'SubmittedRevisionsCount'
          ) === -1
        ) {
          filters.main.push('SubmittedRevisionsCount');
        }
      }
    }
    if (
      currentUser.isInvestor &&
      (status == diligenceStatusConstant.Approved ||
        status == diligenceStatusConstant.NotApproved ||
        status == diligenceStatusConstant.Followup)
    ) {
      if (filters.optional.findIndex((val) => val == 'FlaggedTotal') == -1)
        filters.optional.push('FlaggedTotal');
    }

    let autoFillIndex = filters.main.findIndex(
      (val) => val === 'AutoFilledResponses'
    );

    if (currentUser.isInvestor && !is_internal) {
      filters.main.splice(autoFillIndex, 1);
    }

    if (
      currentUser.isInvestor &&
      (status == diligenceStatusConstant.Completed ||
        status == diligenceStatusConstant.Followup)
    ) {
      if (filters.optional.findIndex((val) => val == 'FlaggedTotal') == -1)
        filters.optional.push('FlaggedTotal');
      if (filters.optional.findIndex((val) => val == 'ScoredTotal') == -1)
        filters.optional.push('ScoredTotal');
      if (
        filters.optional.findIndex(
          (val) => val == 'ExcludedFromRatingsCount'
        ) == -1
      )
        filters.optional.push('ExcludedFromRatingsCount');
    }
    if (status == diligenceStatusConstant.Started) {
      if (filters.main.findIndex((val) => val == 'WithTrackChangesCount') == -1)
        filters.main.push('WithTrackChangesCount');
    }

    let mainList = [];
    let optionalList: DropDownType[] = [];
    filters?.main.forEach((filter) => {
      let index = this.counts.findIndex((item) => item.id == filter);
      if (index > -1) {
        let filterObj = allFiltersMap[filter];

        // If the main filter consists child filters then populate count for them as well
        if (filterObj.isDropdown) {
          filterObj.dropdownList.forEach((filter) => {
            let requiredCount = this.counts.find(
              (item) => item.id == filter.countParam
            )?.value;

            filter.disabled = !requiredCount;
            filter.count = requiredCount;
          });
        }

        filterObj.count =
          this.diligence.allowOnlyFollowups &&
          !['OpenFollowupTotal', 'ResolvedFollowupTotal'].includes(
            filterObj.countParam
          )
            ? 0
            : this.counts[index].value;
        filterObj.key = filterObj.countParam;
        filterObj.label = `${filterObj.name} (${filterObj.count})`;
        (filterObj.disabled =
          filterObj.count == 0 ||
          (this.diligence.allowOnlyFollowups &&
            !['OpenFollowupTotal', 'ResolvedFollowupTotal'].includes(
              filterObj.countParam
            ))),
          mainList.push(filterObj);
      }
    });
    filters?.optional.forEach((filter) => {
      let index = this.counts.findIndex((item) => item.id == filter);
      if (index > -1) {
        let filterObj = allFiltersMap[filter];
        filterObj.count =
          this.diligence.allowOnlyFollowups &&
          !['OpenFollowupTotal', 'ResolvedFollowupTotal'].includes(
            filterObj.countParam
          )
            ? 0
            : this.counts[index].value;
        optionalList.push({
          label: `${filterObj.name} (${filterObj.count})`,
          key: filterObj.countParam,
          param: filterObj.param,
          disabled:
            filterObj.count == 0 ||
            (this.diligence.allowOnlyFollowups &&
              !['OpenFollowupTotal', 'ResolvedFollowupTotal'].includes(
                filterObj.countParam
              )),
          color: filterObj.color,
        });
      }
    });
    if (this.diligence.allowOnlyFollowups && this.filter == 'default') {
      // keep the default selected filter as open followup where only followup can be added (investor pre-completion)
      this.filter = 'OpenFollowup';
    }

    // calculate the excluded rating percentage to show in the warning
    const excludedRatingsCount = this.counts.find(
      (item) => item.id == 'ExcludedFromRatingsCount'
    )?.value;
    const totalCount = this.counts.find(
      (item) => item.id == 'TotalRatingLevelEntityCount'
    )?.value;
    if (currentUser.isInvestor && excludedRatingsCount > 0 && totalCount > 0) {
      this.excludedPercentage = Math.round(
        (excludedRatingsCount / totalCount) * 100
      );
    }

    this.quickViewlist = mainList;
    this.dropDownList = optionalList;
    this.updateNewList();
    this.updateParams();
  }

  updateDropdown() {
    if (this.isSidePanel) {
      let localList = [];
      localList.push(this.quickViewlist.pop());
      localList.push(this.quickViewlist.pop());
      localList.forEach((val) => {
        val.key = val.count;
        val.disabled = val.count == 0;
        val.label = `${val.name} (${val.count})`;
        val.param = val.params;
        val.color = val.color;
      });
      this.dropDownList = [...localList, ...this.dropDownList];
    } else {
      let localList = [];
      localList.push(this.dropDownList.shift());
      localList.push(this.dropDownList.shift());
      this.quickViewlist = [...this.quickViewlist, ...localList];
    }
  }

  handleDropDownClick(icon: DropDownType | any, type: 'quick') {
    if (icon.disabled) return;
    if (this.filter === allFiltersMap[icon.key].param) this.filter = 'default';
    else this.filter = allFiltersMap[icon.key].param;
    for (let index = 0; index < this.dropDownList.length; index++) {
      this.dropDownList[index].color =
        this.filter !== 'default' && this.dropDownList[index].key == icon.key
          ? 'primary'
          : 'default';
    }
    this.store.dispatch(new UpdateFilterMap(this.filter));
    this.quickViewlist = JSON.parse(JSON.stringify(this.quickViewlist));
    this.dropDownList = JSON.parse(JSON.stringify(this.dropDownList));
    this.updateNewList();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  updateNewList() {
    this.newFilterList = [
      {
        key: 'default',
        label: 'All',
        isActive: this.filter == 'default',
        isDisabled: false,
      },
    ];
    this.quickViewlist.forEach((filter) => {
      // Mark the dropdown element as also active if any
      if (filter.isDropdown) {
        filter.dropdownList.forEach((dropdown) => {
          dropdown.isActive = this.filter === dropdown.param;
        });
      }
      this.newFilterList.push({
        key: filter.key,
        label: filter.label,
        isDropdown: filter.isDropdown,
        dropdownList: filter.dropdownList,
        isActive:
          this.filter == filter?.param ||
          (filter.isDropdown && filter?.param.includes(this.filter)),
        isDisabled: filter.disabled,
      });
    });
    this.dropDownList.forEach((filter) => {
      // Mark the dropdown element as also active if any
      if (filter.isDropdown) {
        filter.dropdownList.forEach((dropdown) => {
          dropdown.isActive = this.filter === dropdown.param;
        });
      }
      this.newFilterList.push({
        key: filter.key,
        label: filter.label,
        isDropdown: filter.isDropdown,
        dropdownList: filter.dropdownList,
        isActive:
          this.filter == filter?.param ||
          (filter.isDropdown && filter?.param.includes(this.filter)),
        isDisabled: filter.disabled,
      });
    });
    this.newFilterList.forEach((filter) => {
      if (filter?.isActive) {
        let index = this.counts.findIndex((item) => item.id == filter.key);
        if (index >= 0 && this.counts[index]?.value == 0) {
          this.store.dispatch(new ClearCategory());
        }
      }
    });
  }

  // Incase the filter is in dropdown, pass the parent filter as well
  async filterRouter(icon, parentFilter?) {
    if (icon.key == 'default' && icon.isActive) return;
    if (icon.key == 'default') {
      this.filter = 'default';
    } else if (this.filter === allFiltersMap[icon.key].param)
      this.filter = 'default';
    else this.filter = allFiltersMap[icon.key].param;
    if (
      this.filter === allFiltersMap.MyRatingReviewpendingCount.param ||
      this.filter === allFiltersMap.RatingReviewpendingCount.param
    ) {
      const currRoute = this.router.getState()._routerState.url;
      this.router.navigate(
        currRoute.split('questionnaire')[0] + '/investment_ratings'
      );
    } else {
      if (parentFilter) parentFilter.isLoading = true;
      icon.isLoading = true;
      this.status.destroyActiveEditorInstace();
      await this.store.dispatch(new UpdateFilterMap(this.filter)).toPromise();
      await this.store.dispatch(new GetDiligenceSectionData()).toPromise();
      this.store.dispatch(new FilterReload(`${Math.random()}`)).toPromise();
      this.panel.close();
      this.store.dispatch(new UpdateActivePanelId(''));
      icon.isLoading = false;
      if (parentFilter) parentFilter.isLoading = false;
      this.updateNewList();
    }
  }
  handleFilterClick({ icon, parentFilter }) {
    this.draftService.showCountAlert(
      () => {
        this.filterRouter(icon, parentFilter);
      },
      () => {
        this.store.dispatch(new UpdateDraftData(null));
        this.filterRouter(icon, parentFilter);
      }
    );
  }
}
