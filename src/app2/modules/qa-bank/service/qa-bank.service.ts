import { Injectable } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subject, BehaviorSubject } from 'rxjs';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { FILTER_TERNARY_OPERATORS } from 'src/app2/shared/constants/constant';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import {
  GetAllQA,
  GetQaBankFilters,
  UpdateActivePanelId,
  UpdateSelectedQuestions,
} from '../store/qa.actions';
import { take, takeUntil, tap, finalize } from 'rxjs/operators';
import { debouncer } from '../../../utils/debouce.util';
import { QaTabType } from '../constants/qa-bank.constants';
import {
  ArchiveFilter,
  DuplicateFilter,
  QuestionFilter,
  ResponseFilter,
  showInvestorRequest,
  showStandardDDQ,
} from '../constants/qa-bank-filters.constants';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ToastrService } from 'ngx-toastr';
import { Questions } from '../types/qa-bank.model';
import { QAState } from '../store/qa.state';
import { RouterService } from 'src/app2/services/router.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { UtilsService } from 'src/app2/services/utils.service';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';
import { QaBankApiService } from 'src/app2/apis/qa-bank/qa-bank.service';
import { copyHtml } from '../../questionnaire/util/copy-html.util';
import { ClipBoardService } from 'src/app2/services/clipboard.service';

@Injectable({
  providedIn: 'root',
})
export class QaBankService {
  global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
  dateFilterApplied;
  search_criterias = [];
  filterApplied;
  expiryFilterExist;
  datesFilterSelectedDates = { startDate: null, endDate: null };
  enableGetDataFromServerForQA;
  questionInitialCount;
  cancelRequests$ = new Subject<void>();
  searchFiltersFromApi;
  viewSimilarQuestionsVisible = false;
  similarQuestionFilterValue;
  selectedQAfilter = { name: null, type: 'Question' };
  curr_user: CurrentUserModel;
  questionsTotalCount;
  expiryDateFilterValue = 'not-selected';
  respnseDateFilterValue;
  questionsCurrentCount;
  questionsOffset;
  debouceInst;
  sortFilterOptins;
  questions = new BehaviorSubject<any>(null);
  questions$ = this.questions.asObservable();
  filters_data_loaded;
  currentSortFilterSelected = 'response_date_sort_desc';
  start_point = 0;
  end_point;
  activeView: QaTabType.Archives | QaTabType.Library | QaTabType.ProjectHistory;
  allQuestionList = new Array(10000); //Static memory allocation of 10,000 (Limit of ES) questions. To help in dynamic p
  lastRefreshedAt;
  archiveQuickFilter = 'all';
  projectHistoryQuickFilter = 'all';
  selectedFrequency: 'all-selected' | 'few-selected' | 'none-selected' =
    'none-selected';
  selectedCount = 0;
  expiryQuickSortFilter = 'none';
  pageSize: number = 10; // Determines how many questions should be loaded at once
  selectedDateRange;
  query_result_size = 100; // Hard coded value ( in future if the servers are upgraded we can increase the value)
  @Select(QAState.getFilters) getFilers$;
  constructor(
    private readonly store: Store,
    private readonly NewModalFactory: CustomModalService,
    private readonly qaBankApiService: QaBankApiService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly router: RouterService,
    private readonly sidePanel: SidePanelService,
    private readonly Utils: UtilsService,
    private readonly datePipe: DatePipe,
    private readonly clipboardService: ClipBoardService
  ) {
    this.searchByFilters = this.searchByFilters.bind(this);
  }

  init(
    user: CurrentUserModel,
    activeType:
      | QaTabType.Archives
      | QaTabType.Library
      | QaTabType.ProjectHistory
  ) {
    this.curr_user = user;
    this.questions.next(null);
    this.debouceInst = debouncer(this.searchByFilters, 500);

    this.allQuestionList = new Array(10000);

    this.activeView = activeType;

    this.start_point = 0;
    this.end_point = this.pageSize;

    this.questionsTotalCount = 0;
    this.questionsCurrentCount = 0;
    this.questionsOffset = 0;
    this.enableGetDataFromServerForQA = false;

    this.questionInitialCount = 1;

    this.searchFiltersFromApi = {
      default_filters: [],
      custom_filter: [],
    };

    this.selectedFrequency = 'none-selected';

    this.removeDatesFilter(false);
    this.selectedCount = 0;
    this.filters_data_loaded = false;

    this.getFiltersModalData();
  }

  //Function to get the default and all other filters from BE
  getFiltersModalData() {
    this.sortFilterOptins = [];
    this.getFilers$
      .pipe(
        take(2),
        tap((filters) => {
          if (!filters) this.store.dispatch(new GetQaBankFilters());
        })
      )
      .subscribe((filter) => {
        if (filter) {
          this.updateFilters(JSON.parse(JSON.stringify(filter)));
          this.setActiveView(); // Initializes the data according to the tab
          this.searchByFilters();
        }
      });
  }

  updateFilters(filters) {
    filters.custom_filter.map((customFilter) => {
      if (customFilter.filter_function === 'sort') {
        this.sortFilterOptins.push(customFilter);
      } else {
        this.searchFiltersFromApi.custom_filter.push(customFilter);
      }
    });
    this.searchFiltersFromApi.default_filters = filters.default_filters;
    this.filters_data_loaded = true;

    this.searchFiltersFromApi.default_filters.map((filter, index) => {
      if (filter.hasOwnProperty('endpoint')) {
        this.getDynamicDefaultFilterOptions(filter, index);
      }
    });

    this.searchFiltersFromApi.custom_filter.map((filter, index) => {
      if (filter.hasOwnProperty('endpoint')) {
        this.getDynamicCustomFilterOptions(filter, index);
      }
    });
  }

  setActiveView() {
    if (this.activeView === QaTabType.Library) {
      this.searchFiltersFromApi.custom_filter =
        this.searchFiltersFromApi.custom_filter.filter(
          (filter) => filter.filter_name !== 'archived_date'
        );
    }
    if (this.activeView === QaTabType.ProjectHistory) {
      this.searchFiltersFromApi.custom_filter =
        this.searchFiltersFromApi.custom_filter.filter(
          (filter) => filter.filter_name !== 'archived_date'
        );
    }

    if (this.activeView === QaTabType.Archives) {
      this.removeDatesFilter(false);
    }
  }

  openFiltersModal() {
    this.NewModalFactory.invoke('manage-question-custom-search', {
      initialState: {
        customFiltersData: {
          global_ternary_operator: this.global_ternary_operator,
          search_filters_response: this.searchFiltersFromApi,
          search_criterias: this.search_criterias,
          active_view: this.activeView,
        },
        success: (response: {
          search_criterias: any;
          global_ternary_operator: any;
          searchByFiltersParams: any;
        }) => {
          this.search_criterias = response.search_criterias;
          this.global_ternary_operator = response.global_ternary_operator;
          if (Object.keys(response.searchByFiltersParams).length > 0) {
            if (this.search_criterias.length) this.filterApplied = true;
            else this.filterApplied = false;
            let selectedParams = response.searchByFiltersParams.filters[
              this.global_ternary_operator
            ].map((data) => data.filter_name);
            this.dateFilterApplied = false;
            if (selectedParams.indexOf('expiry_date') > -1) {
              this.expiryFilterExist = true;
              this.datesFilterSelectedDates = {
                startDate: null,
                endDate: null,
              };
            }
            if (this.datesFilterSelectedDates.startDate) {
              response.searchByFiltersParams.filters[
                this.global_ternary_operator
              ].push(this.datesFilterSelectedDates.startDate);
              this.dateFilterApplied = true;
            }
            if (this.datesFilterSelectedDates.endDate) {
              response.searchByFiltersParams.filters[
                this.global_ternary_operator
              ].push(this.datesFilterSelectedDates.endDate);
              this.dateFilterApplied = true;
            }

            // Find the category name filter(if present) and convert the value from stringfied array into normal one to send to BE
            let categoryFilterObj = response.searchByFiltersParams.filters[
              this.global_ternary_operator
            ].filter(
              (criteria) => criteria.filter_name === 'parent_section_id'
            );

            if (categoryFilterObj.length)
              categoryFilterObj.forEach((filter) => {
                filter.filter_value = JSON.parse(filter.filter_value);
              });
            this.applyFiltersSearch(response.searchByFiltersParams);
          } else {
            this.resetFiltersData();
          }
        },
      },
      class: 'modal-xl',
    });
  }

  // ---- function related to update button ----//

  getLastRefreshedData() {
    return this.qaBankApiService
      .getFirmLastUpdatedAt({ filters: {} })
      .subscribe((response: { status: number; data: any }) => {
        if (response.status === 502 || !response.data) {
          this.lastRefreshedAt = null;
        } else {
          this.lastRefreshedAt = this.Utils.getLocalDateTime(response.data);
        }
      });
  }

  checkIfQADataUpdated(showToaster = true) {
    this.questions.next(null);
    return this.qaBankApiService.updateQaServer({ filters: {} }).pipe(
      tap((response: any) => {
        if (response.data) {
          if (showToaster) {
            this.toaster.success('', 'Update Successful');
          }
          this.searchByFilters();
        } else {
          if (showToaster) {
            this.toaster.error('', 'Update Failed');
          }
        }
      })
    );
  }

  // ---- function related to update button ends----//

  // When user search questions text or answer text
  onInputChange(filters) {
    this.debouceInst();
    this.selectedQAfilter = filters;
  }

  // Function used to apply all the existing filters and add new if any fetching questions.
  searchByFilters(offset = null) {
    if (this.questions.getValue()?.questions) this.questions.next(null);

    let filter;

    const searchByFiltersData = [];
    this.dateFilterApplied = false;
    for (let index = 0; index < this.search_criterias.length; index++) {
      filter = this.search_criterias[index];
      if (filter) {
        if (
          filter.hasOwnProperty('condition') &&
          filter.hasOwnProperty('advance_filter_value') &&
          filter.condition !== null &&
          filter.advance_filter_value !== null &&
          filter.advance_filter_value !== '' &&
          filter.advance_filter_value !== undefined
        ) {
          let filterCopy = JSON.parse(JSON.stringify(filter));
          if (filterCopy.criteria_obj.filter_name === 'parent_section_id')
            filterCopy.advance_filter_value = JSON.parse(
              filter.advance_filter_value
            );
          searchByFiltersData.push(filterCopy);
        }
      }
    }
    if (searchByFiltersData.length === 0) {
      this.filterApplied = false;
    }
    const params: any = { filters: {} };
    params.filters[this.global_ternary_operator] = [];
    this.expiryFilterExist = false;
    for (filter of Array.from(searchByFiltersData)) {
      if (filter.criteria_obj.filter_name == 'expiry_date')
        this.expiryFilterExist = true;
      const filter_params = {
        filter_label: filter.criteria_obj.filter_label,
        filter_name: filter.criteria_obj.filter_name,
        filter_type: filter.criteria_obj.filter_type,
        search_type: filter.condition,
        filter_value: filter.advance_filter_value,
      };
      params.filters[this.global_ternary_operator].push(filter_params);
    }

    params.offset = offset;
    if (this.datesFilterSelectedDates.startDate) {
      params.filters[this.global_ternary_operator].push(
        this.datesFilterSelectedDates.startDate
      );
      this.dateFilterApplied = true;
    }
    if (this.datesFilterSelectedDates.endDate) {
      params.filters[this.global_ternary_operator].push(
        this.datesFilterSelectedDates.endDate
      );
      this.dateFilterApplied = true;
    }
    this.questionInitialCount = 1;
    this.applyFiltersSearch(params);
  }

  // This function applies all the default filter based on the current active view (Library, Archive, Project responses ) and also deals with some non filter modal filters.
  async applyFiltersSearch(filter_params: {
    [x: string]: number;
    filters: any;
  }) {
    this.clickedUnSelectAllQuestions(); // For clearing all the selected questions (if any)
    this.cancelRequests$.next(); // For terminating any previous ongoing qa_search api requests
    if (!filter_params.offset) {
      this.start_point = 0;
      this.end_point = this.pageSize;
      this.questionsTotalCount = 0;
      this.allQuestionList = new Array(10000);
    }

    this.sidePanel.close();
    this.store.dispatch(new UpdateActivePanelId(null));
    if (this.questions.getValue()?.questions) this.questions.next(null);
    let nameFilterParams: {
      filter_label?: string;
      filter_name: string;
      filter_type: string;
      search_type: string;
      filter_value: any;
    };

    // if the question/answer search filter is applied
    if (this.selectedQAfilter.name) {
      let qaFilter;
      if (!filter_params.filters[this.global_ternary_operator]) {
        filter_params.filters[this.global_ternary_operator] = [];
      }
      if (this.selectedQAfilter.type === 'Question') {
        qaFilter = QuestionFilter;
        qaFilter.filter_value = this.selectedQAfilter.name;
        filter_params.filters[this.global_ternary_operator].push(qaFilter);
      } else if (this.selectedQAfilter.type === 'Answer') {
        qaFilter = ResponseFilter;
        qaFilter.filter_value = this.selectedQAfilter.name;
        filter_params.filters[this.global_ternary_operator].push(qaFilter);
      } else if (this.selectedQAfilter.type === 'Both') {
        let qaResFilter = ResponseFilter;
        qaResFilter.filter_value = this.selectedQAfilter.name;
        let qaQuesFilter = QuestionFilter;
        qaQuesFilter.filter_value = this.selectedQAfilter.name;
        if (!filter_params.filters['or']) {
          filter_params.filters['or'] = [];
        }
        filter_params.filters['or'].push(...[qaResFilter, qaQuesFilter]);
      }
    }

    // if the response date filter is applied
    // To handle sorting by response/expiry dates for asc-> true and desc-> false
    if (this.currentSortFilterSelected) {
      const name = this.currentSortFilterSelected
        .split('_')
        .slice(0, 3)
        .join('_');
      const type = this.currentSortFilterSelected.split('_')[3] === 'asc';
      nameFilterParams = {
        filter_name: name,
        filter_type: 'bool',
        search_type: 'exact',
        filter_value: type,
      };
      if (!filter_params.filters[FILTER_TERNARY_OPERATORS.AND]) {
        filter_params.filters[FILTER_TERNARY_OPERATORS.AND] = [];
      }
      filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(
        nameFilterParams
      );
    }

    this.addViewDefaultFilters(filter_params);
    //when similar question check is enabled
    if (this.viewSimilarQuestionsVisible) {
      const viewSimilarFilterParams = {
        filter_label: 'question id',
        filter_name: 'question_id',
        filter_type: 'id',
        search_type: 'exact',
        filter_value: this.similarQuestionFilterValue.question_id,
      };
      if (!filter_params.filters[FILTER_TERNARY_OPERATORS.AND]) {
        filter_params.filters[FILTER_TERNARY_OPERATORS.AND] = [];
      }
      filter_params.filters[this.global_ternary_operator].push(
        viewSimilarFilterParams
      );
      const qaFilter = QuestionFilter;
      qaFilter.filter_value = this.similarQuestionFilterValue.question_text;

      if (!filter_params.filters[this.global_ternary_operator]) {
        filter_params.filters[this.global_ternary_operator] = [];
      }
      filter_params.filters[this.global_ternary_operator].push(qaFilter);
      filter_params['similar_qna'] = 1;
    }
    let tempActiveVIew = this.activeView;

    filter_params.query_result_size = this.query_result_size;

    await this.store
      .dispatch(new GetAllQA({ filter_params }))
      .pipe(take(1), takeUntil(this.cancelRequests$))
      .subscribe((val) => {
        if (tempActiveVIew === this.activeView) {
          let { qaOrder, QAFilterCount, QACount, QAOffset } = JSON.parse(
            JSON.stringify(val.qa)
          );

          let returnedList = JSON.parse(JSON.stringify(qaOrder));
          returnedList.forEach((data, index) => {
            // We add data from the offset that we send to BE or if offset is null we start adding it from start point
            if (filter_params.offset)
              this.allQuestionList[filter_params.offset + index] = data;
            else this.allQuestionList[this.start_point + index] = data;
          });

          this.questions.next({
            questions: this.allQuestionList
              .slice(this.start_point, this.end_point)
              .filter((data) => data),

            activeView: tempActiveVIew,
          });
          this.questionsTotalCount = QAFilterCount;
          this.questionsCurrentCount = QACount;
          this.questionsOffset = QAOffset;
        }
      });
  }

  resetFiltersData(hardReset = false) {
    if (hardReset) {
      this.viewSimilarQuestionsVisible = false;
      this.similarQuestionFilterValue = null;
    }

    this.removeDatesFilter(false);

    this.global_ternary_operator = FILTER_TERNARY_OPERATORS.AND;
    this.search_criterias = [];
    this.filterApplied = false;

    this.selectedQAfilter.type = 'Question';
    this.selectedQAfilter.name = '';
    this.dateFilterApplied = false;
    this.searchByFilters();
  }

  getDynamicDefaultFilterOptions(
    filter: { endpoint: any },
    index: string | number
  ) {
    return this.qaBankApiService
      .getCustomFilter(filter.endpoint)
      .subscribe((response: { data: any }) => {
        this.searchFiltersFromApi.default_filters[index].options =
          response.data;

        this.searchFiltersFromApi.default_filters[index].options.map(
          (option: any) =>
            this.renameUsenameToValue(
              option,
              this.searchFiltersFromApi.default_filters[index].display_attribute
            )
        );
      });
  }

  // This function decides which default filter to add based on active view to show appropriate questions/answers
  addViewDefaultFilters(filter_params: { [x: string]: number; filters: any }) {
    if (!filter_params.filters[this.global_ternary_operator]) {
      filter_params.filters[this.global_ternary_operator] = [];
    }
    if (!filter_params.filters[FILTER_TERNARY_OPERATORS.AND])
      filter_params.filters[FILTER_TERNARY_OPERATORS.AND] = [];

    if (this.activeView === QaTabType.ProjectHistory) {
      let everyQuestionExceptPreApproved = {
        filter_name: 'diligence_type',
        filter_type: 'dropdown',
        search_type: 'exact',
        filter_value: [1243, 1242, 1241, 2, 0, 3], // This filter is for showing every questions from every diligence type except from pre-approved
      };
      const archiveFilter = ArchiveFilter; // Archive filter false
      filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(
        everyQuestionExceptPreApproved
      );

      filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(archiveFilter);

      if (this.projectHistoryQuickFilter === 'Standard DDQs')
        filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(
          showStandardDDQ
        );
      else if (this.projectHistoryQuickFilter === 'Investor Requests')
        filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(
          showInvestorRequest
        );
    }

    if (this.activeView === QaTabType.Library) {
      let onlyPreApprovedQuestion = {
        filter_name: 'diligence_type',
        filter_type: 'dropdown',
        search_type: 'exact',
        filter_value: [-1], // This filter is for showing only pre-approved project
      };

      const archiveFilter = ArchiveFilter;
      filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(
        onlyPreApprovedQuestion
      );

      filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(archiveFilter);
    }

    if (this.activeView === QaTabType.Archives) {
      const archiveFilter = { ...ArchiveFilter, filter_value: true };
      const duplicateFilter = { ...DuplicateFilter, filter_value: true };

      filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(archiveFilter); // will fetch all the archives ( deactivated and duplicates)

      if (this.archiveQuickFilter === 'duplicates') {
        filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(
          duplicateFilter
        );
      } else if (this.archiveQuickFilter === 'archived') {
        duplicateFilter.filter_value = false;
        filter_params.filters[FILTER_TERNARY_OPERATORS.AND].push(
          duplicateFilter
        );
      }
    }
  }

  getDynamicCustomFilterOptions(
    filter: { endpoint: any },
    index: string | number
  ) {
    return this.qaBankApiService
      .getCustomFilter(filter.endpoint)
      .subscribe((response: { data: any }) => {
        this.searchFiltersFromApi.custom_filter[index].options = response.data;

        this.searchFiltersFromApi.custom_filter[index].options.map(
          (option: any) =>
            this.renameUsenameToValue(
              option,
              this.searchFiltersFromApi.custom_filter[index].display_attribute
            )
        );
      });
  }

  renameUsenameToValue(obj: { [x: string]: any }, key: string | number) {
    obj['value'] = obj[key];
    return delete obj[key];
  }

  // clearing the question data
  clearAllQAdata() {
    this.questions.next(null);
  }

  // -- bulk selection handling code starts --- //
  handleSelection() {
    this.checkIfAllSelected();
  }

  checkIfAllSelected() {
    const validQuestionsList = this.questions.getValue().questions;
    let count = 0;
    this.questions.getValue()?.questions.map((question) => {
      if (question.isSelected) {
        count = count + 1;
      }
    });

    this.selectedCount = count;

    if (count === validQuestionsList.length && validQuestionsList.length > 0) {
      this.selectedFrequency = 'all-selected';
    } else if (count > 0 && validQuestionsList.length > 0) {
      this.selectedFrequency = 'few-selected';
    } else {
      this.selectedFrequency = 'none-selected';
    }
  }

  getSelectedQuestionsCount() {
    let count = 0;
    this.questions.getValue()?.questions.map((question) => {
      if (question.isSelected) {
        count = count + 1;
      }
    });
    this.selectedCount = count;
  }

  clickedSelectAllQuestions() {
    let count = 0;
    this.questions.getValue()?.questions.forEach((question) => {
      question.isSelected = true;
      count++;
    });
    this.selectedCount = count;
    this.selectedFrequency = 'all-selected';
  }

  clickedUnSelectAllQuestions() {
    this.questions.getValue()?.questions.forEach((question) => {
      question.isSelected = false;
    });
    this.selectedCount = 0;
    this.selectedFrequency = 'none-selected';
  }

  // -- bulk selection handling code ends --- //

  // ------ Quick Filters --------- //

  handleArchiveQuickFilter(filter) {
    this.archiveQuickFilter = filter;
    this.searchByFilters();
  }

  handleProjectQuickFilter(value) {
    this.projectHistoryQuickFilter = value;

    this.searchByFilters();
  }

  filterByExpiryDate(type) {
    let searchByFiltersData = [];
    this.datesFilterSelectedDates = { startDate: null, endDate: null };
    let todayDate = this.datePipe.transform(moment().format(), 'MM-dd-yyyy');
    let endDate;
    if (type == 'five') {
      endDate = moment().add(5, 'days').format();
      this.selectedDateRange = 'Expiring in 5 Days';
    } else if (type == 'ten') {
      endDate = moment().add(10, 'days').format();
      this.selectedDateRange = 'Expiring in 10 Days';
    } else if (type == 'thirty') {
      endDate = moment().add(30, 'days').format();
      this.selectedDateRange = 'Expiring in 30 Days';
    } else if (type == 'all') {
      endDate = moment().subtract(1, 'days').format();
      this.selectedDateRange = 'All Expired';
    }
    if (endDate) {
      endDate = this.datePipe.transform(endDate, 'MM-dd-yyyy');
    }
    this.search_criterias.forEach((filter, index) => {
      if (filter) {
        if (
          filter.hasOwnProperty('condition') &&
          filter.hasOwnProperty('advance_filter_value') &&
          filter.condition != null &&
          filter.advance_filter_value != null &&
          filter.advance_filter_value != '' &&
          filter.advance_filter_value != undefined
        )
          searchByFiltersData.push(filter);
      }
    });
    const params: any = { filters: {} };
    params.filters[FILTER_TERNARY_OPERATORS.AND] = [];
    if (!params.filters[this.global_ternary_operator])
      params.filters[this.global_ternary_operator] = [];
    if (type == 'clear') this.dateFilterApplied = false;
    else {
      this.dateFilterApplied = true;
      if (type != 'all') {
        let startDateObj = {
          filter_label: 'Expiry date',
          filter_name: 'expiry_date',
          filter_type: 'datetime',
          filter_value: todayDate,
          search_type: 'gte',
        };
        params.filters[FILTER_TERNARY_OPERATORS.AND].push(startDateObj);
        this.datesFilterSelectedDates.startDate = startDateObj;
      }
      let endDateObj = {
        filter_label: 'Expiry date',
        filter_name: 'expiry_date',
        filter_type: 'datetime',
        filter_value: endDate,
        search_type: 'lte',
      };
      params.filters[FILTER_TERNARY_OPERATORS.AND].push(endDateObj);
      this.datesFilterSelectedDates.endDate = endDateObj;
    }
    let filterParams;
    for (let filter of searchByFiltersData) {
      if (filter.criteria_obj.filter_name != 'expiry_date') {
        filterParams = {
          filter_label: filter.criteria_obj.filter_label,
          filter_name: filter.criteria_obj.filter_name,
          filter_type: filter.criteria_obj.filter_type,
          search_type: filter.condition,
          filter_value: filter.advance_filter_value,
        };
        params.filters[this.global_ternary_operator].push(filterParams);
      }
    }

    this.applyFiltersSearch(params);
    this.clickedUnSelectAllQuestions();
  }

  // ------- Quick Filters ENDS-------- //

  // ------ BUlk Filter modal function start -------------- //

  handleSelectedQuestionUpdate() {
    const selectedQuestions = [];
    this.questions.getValue()?.questions.map((question) => {
      if (question.isSelected) {
        selectedQuestions.push(JSON.parse(JSON.stringify(question)));
      }
    });
    this.store.dispatch(new UpdateSelectedQuestions(selectedQuestions));
    return selectedQuestions;
  }

  addRemoveTagsBulkModal() {
    this.handleSelectedQuestionUpdate();
    this.NewModalFactory.invoke('assign-tag-bulk', {
      initialState: {
        onSuccess: (removedAll) => {
          this.clickedUnSelectAllQuestions();
          if (removedAll) this.toaster.success('Tags removed successfully');
          else this.toaster.success('Tags updated successfully');
        },
      },
      class: 'modal-lg',
    });
  }

  changeExpiryDateBulkModal() {
    this.handleSelectedQuestionUpdate();
    this.NewModalFactory.invoke('assign-expiry-date-bulk', {
      initialState: {
        onSuccess: (removedAll) => {
          this.clickedUnSelectAllQuestions();
          if (removedAll)
            this.toaster.success('Expiry date removed successfully');
          else this.toaster.success('Expiry date updated successfully');
        },
      },
      class: 'modal-lg',
    });
  }

  assignSMEBulkModal() {
    this.handleSelectedQuestionUpdate();
    this.NewModalFactory.invoke('assign-sme-bulk', {
      initialState: {
        onSuccess: (removedAll) => {
          this.clickedUnSelectAllQuestions();
          if (removedAll) this.toaster.success('SMEs removed successfully');
          else this.toaster.success('SMEs updated successfully');
        },
      },
      class: 'modal-lg',
    });
  }

  deactivateBulkResponse(selectedQues) {
    let length = selectedQues.length;

    this.SweetAlert.freeInput({
      title: `Are you sure you want to archive ${
        length > 1 ? length : 'this'
      } Q/A${length > 1 ? 's' : ''}?`,
      confirmButtonText: 'Yes, Archive',
      focusCancel: true,
      icon: 'info',
      showLoaderOnConfirm: true,
      showCancelButton: true,
      reverseButtons: true,
      html: `<p>The Q/A${
        length > 1 ? 's' : ''
      } will be excluded from being available for use in Auto-fill, Q/A Search, and Suggested Responses.</p>
      <label style="display:flex;" for="reasonTextArea">Reason for archiving:</label>
         <textarea placeholder="This reason will be added as an internal note${
           length > 1 ? ' for all the Q/As' : ''
         } (optional)" class="form-control" id="reasonTextArea" aria-label="Reason for re-activation" style="resize: none;height:200px"></textarea>`,

      preConfirm: (result) => {
        return new Promise<void>((resolve) => {
          const reasonTextArea = document.getElementById(
            'reasonTextArea'
          ) as HTMLTextAreaElement;
          let reason = reasonTextArea.value.trim();
          if (reason) reason = `Archive note : ${reason}`;
          const response_ids = selectedQues.map((val) => val.response_id);
          const params = {
            response_ids,
            action_type: 'deactivate',
            reason,
          };
          this.qaBankApiService
            .updateQuestionData(params)
            .pipe(finalize(() => resolve()))
            .subscribe((response: any) => {
              this.toaster.success(
                '',
                `${
                  length > 1 ? 'These responses have' : 'This response has'
                } been archived`,
                {
                  timeOut: 3000,
                }
              );
              this.allQuestionList = this.allQuestionList.filter(
                (question: Questions) =>
                  !selectedQues.find(
                    (ques) => ques.response_id === question.response_id
                  )
              );
              this.questionsTotalCount = this.allQuestionList.length;
              this.clickedUnSelectAllQuestions();
              this.fetchQuestionData();
            });
        });
      },
    });
  }

  unArchiveQuestions(questions) {
    let length = questions.length;

    this.SweetAlert.freeInput({
      title: `Are you sure you want to unarchive ${
        length > 1 ? length : 'this'
      } Q/A${length > 1 ? 's' : ''}?`,
      confirmButtonText: 'Yes, Unarchive',
      focusCancel: true,
      icon: 'info',
      showLoaderOnConfirm: true,
      showCancelButton: true,
      reverseButtons: true,
      html: `<p>The Q/A${
        length > 1 ? 's' : ''
      } will move back into your Library or Project Responses and become available for use in Auto-fill, Q/A Search, and Suggested Responses.</p>
      <label style="display:flex;" for="reasonTextArea">Reason to unarchive :</label>
         <textarea placeholder="This reason will be added as an internal note${
           length > 1 ? ' for all the Q/As' : ''
         } (optional)" class="form-control" id="reasonTextArea" aria-label="Reason for re-activation" style="resize: none;height:200px"></textarea>`,

      preConfirm: (result) => {
        return new Promise<void>((resolve) => {
          const reasonTextArea = document.getElementById(
            'reasonTextArea'
          ) as HTMLTextAreaElement;
          let reason = reasonTextArea.value.trim();
          if (reason) reason = `Unarchive note : ${reason}`;
          const response_ids = questions.map((val) => val.response_id);
          const params = {
            reactivate_responses_list: response_ids,
            reactivation_reason: reason,
          };
          this.qaBankApiService
            .reactivateQuestionData(params)
            .pipe(finalize(() => resolve()))
            .subscribe((response: any) => {
              this.toaster.success(
                '',
                `${
                  length > 1 ? 'These responses have' : 'This response has'
                } been unarchived`,
                {
                  timeOut: 3000,
                }
              );
              this.allQuestionList = this.allQuestionList.filter(
                (question: Questions) =>
                  !questions.find(
                    (ques) => ques.response_id === question.response_id
                  )
              );
              this.questionsTotalCount = this.allQuestionList.length;
              this.clickedUnSelectAllQuestions();
              this.fetchQuestionData();
            });
        });
      },
    });
  }

  handleSendToLibrary() {
    const selectedQAList = this.handleSelectedQuestionUpdate();
    const addQuestion = () => {
      this.NewModalFactory.invoke('add-to-preapproved', {
        initialState: {
          source: 'project_history',
          onSuccess: () => {
            this.toaster.success('Q/As added to library successfully');
            this.searchByFilters();
          },
        },
        class: 'modal-md',
      });
    };

    const hasAnyComments = selectedQAList.some(
      (question: Questions) => question.hasActiveComments
    );

    if (hasAnyComments) {
      this.SweetAlert.confirm({
        title: 'Are you sure to continue?',
        text: 'The response(s) contain active review comments and/or suggestions. These will not be included when adding to the Library. Do you want to proceed?',
        confirmButtonText: 'Yes, continue',
        focusCancel: false,
      }).then((response: any) => {
        if (response.isConfirmed) {
          addQuestion();
        }
      });
    } else {
      addQuestion();
    }
  }

  // ------ BUlk Filter modal function End -------------- //

  getViewSimilarQuestionsData(question: any) {
    this.viewSimilarQuestionsVisible = true;
    this.similarQuestionFilterValue = question;
    return this.searchByFilters();
  }

  selectSortCriteriaFilter(data) {
    this.currentSortFilterSelected = data;
    return this.searchByFilters();
  }

  invokeEditModal(question) {
    this.NewModalFactory.invoke('add-to-preapproved', {
      initialState: {
        source: 'question_detail',
        response: question,
        onSuccess: () => {
          return this.searchByFilters();
        },
      },
      class: 'modal-md',
    });
  }

  addInternalNotes(question: Questions, callback) {
    this.store.dispatch(
      new UpdateActivePanelId(`internal-notes-${question.question_id}`)
    );
    question.text = question.question_text;
    this.sidePanel.invoke('internal-notes', {
      question,
      readOnly: false,
      type: 'Question',
      entity_id: question.duediligence_id,
      child_entity_id: question.question_id,
      child_entity_type: 'Question',
      onSuccess: (res: 'add' | 'delete') => {
        if (!question.note_count) question.note_count = question.notes?.length;
        if (res === 'add') question.note_count += 1;
        else question.note_count -= 1;
        callback();
      },
    });
  }

  // --- Code for pagination starts ----- //

  goToPrevious() {
    this.start_point = this.start_point - this.pageSize;
    this.end_point = this.end_point - this.pageSize;
    let dataEmptyCheck = 0;

    for (let i = this.end_point; i > this.start_point; i--) {
      if (!this.allQuestionList[i]) {
        dataEmptyCheck = 1;
        break;
      }
    }

    if (this.end_point - this.query_result_size > 0 && dataEmptyCheck) {
      return this.searchByFilters(this.end_point - this.query_result_size);
    } else {
      this.fetchQuestionData();
      this.clickedUnSelectAllQuestions();
    }
  }

  goToNext() {
    this.start_point = this.start_point + this.pageSize;
    this.end_point = this.end_point + this.pageSize;
    let dataEmptyCheck = 0;

    for (
      let i = this.start_point;
      i < Math.min(this.end_point, this.questionsTotalCount);
      i++
    ) {
      if (!this.allQuestionList[i]) {
        dataEmptyCheck = 1;
        break;
      }
    }

    if (this.questionsTotalCount > this.start_point && dataEmptyCheck) {
      return this.searchByFilters(this.start_point);
    } else {
      this.fetchQuestionData();
      this.clickedUnSelectAllQuestions();
    }
  }

  fetchQuestionData() {
    this.questions.next({
      questions: this.allQuestionList
        .slice(this.start_point, this.end_point)
        .filter((data) => data),
      activeView: this.activeView,
    });
  }

  handlePageSizeChange(size) {
    this.pageSize = size;
    this.start_point = 0;
    this.end_point = this.pageSize;
    this.fetchQuestionData();
  }

  firstClick() {
    this.start_point = 0;
    this.end_point = this.pageSize;
    this.fetchQuestionData();
    this.clickedUnSelectAllQuestions();
  }

  lastClick(start_point) {
    this.start_point = start_point;
    this.end_point = this.start_point + this.pageSize;
    let flag;
    for (
      let i = this.start_point;
      i < Math.min(this.end_point, this.questionsTotalCount);
      i++
    ) {
      if (!this.allQuestionList[i]) {
        flag = 1;
        break;
      }
    }

    if (this.questionsTotalCount > this.start_point && flag) {
      return this.searchByFilters(
        this.questionsTotalCount - this.query_result_size
      );
    } else {
      this.fetchQuestionData();
      this.clickedUnSelectAllQuestions();
    }
  }

  // --- Code for pagination Ends ----- //

  //----- Quick view filter removal methods starts --- //

  removeViewSimilarQuestionFilter() {
    this.similarQuestionFilterValue = null;
    this.viewSimilarQuestionsVisible = false;
    return this.searchByFilters();
  }

  removeFilterCriterion(index: number) {
    if (index < this.searchFiltersFromApi.default_filters.length) {
      this.search_criterias[index].advance_filter_value = null;
    } else {
      this.search_criterias.splice(index, 1);
    }
    this.searchByFilters();
  }

  removeDatesFilter(refresh = true) {
    this.dateFilterApplied = false;
    this.selectedDateRange = '';
    this.expiryQuickSortFilter = 'none';
    this.currentSortFilterSelected = 'response_date_sort_desc';
    this.datesFilterSelectedDates = { startDate: null, endDate: null };
    this.clickedUnSelectAllQuestions();
    if (refresh) this.searchByFilters();
  }

  removeQuickFilter() {
    if (this.activeView === QaTabType.Archives) this.archiveQuickFilter = 'all';
    else if (this.activeView === QaTabType.ProjectHistory)
      this.projectHistoryQuickFilter = 'all';

    this.searchByFilters();
  }

  //----- Quick view filter removal methods ends --- //

  getProjectViewLink(question: Questions) {
    return this.router.href(
      'app.diligence.project.questionnaire.category.question',
      {
        diligenceId: question.duediligence_id,
        categoryId: question.parent_section_id,
        questionId: question.question_id,
        '#': 'child_section_' + question.child_section_id,
      }
    );
  }

  copyResponse(question) {
    copyHtml(question.response_text, this.clipboardService, this.toaster);
  }
}
