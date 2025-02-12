import {
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import {
  EntityType,
  FILTER_TERNARY_OPERATORS,
  diligenceStatusConstant,
} from 'src/app2/shared/constants/constant';
import { ClipboardService } from 'ngx-clipboard';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { QaItem } from '../../types/qa-bank.type';
import { of, Subject } from 'rxjs';
import { distinctUntilChanged, debounceTime, switchMap } from 'rxjs/operators';
import { ResponseType } from '../../constants/Response-type.constant';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { ToastrService } from 'ngx-toastr';
import { QaResponseType } from '../../constants/qa-response-type.constant';
import { FormControl, FormGroup } from '@angular/forms';
import { copyHtml } from '../../util/copy-html.util';
import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';
import { QaTabType } from 'src/app2/modules/qa-bank/constants/qa-bank.constants';
import {
  ArchiveFilter,
  DateSortHistory,
  DateSortLibrary,
} from 'src/app2/modules/qa-bank/constants/qa-bank-filters.constants';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';

interface QaItemModel {
  question: string;
  answer: { text: string; icons: { name: string }[] }[];
  questionIcon: { name: string };
  data: QaItem;
  rowHeaders?: any[];
  colHeaders?: any[];
  tableData?: any[];
}

@Component({
  selector: 'qa-bank',
  templateUrl: './qa-bank.component.html',
  styleUrls: ['./qa-bank.component.css'],
})
export class QaBankComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  qa: QaItemModel[] | any[] = [];
  searchParameter: string;
  searchParameterModel: string;
  isFooter;
  isSidePanelLoadingParam;
  selectedType: QaTabType = QaTabType.ProjectHistory;
  tabs: dvTabsList[] = [
    {
      name: QaTabType.Library,
      active: false,
      condition: true,
      link: null,
      disabled: false,
      tooltip: 'Search your Library',
    },
    {
      name: QaTabType.ProjectHistory,
      active: true,
      condition: true,
      link: null,
      disabled: false,
      tooltip: 'Search investor requests and standard DDQs',
    },
  ];
  showAdvancedFilters: boolean = false;
  advancedFiltersFormGroup: FormGroup;
  qaResponseType = QaResponseType;
  sortList: any[] = DateSortHistory;
  currentSortFilterSelected = 'response_date_sort_desc';
  searchQueryChanged: Subject<string> = new Subject<string>();
  filterCount: number = 1;
  pageSize: number = 10; // Determines how many questions should be loaded at once
  start_point = 0;
  end_point = this.pageSize;
  allQuestionList: QaItem[] = new Array(10000);
  questionsTotalCount;
  query_result_size = 100; // Hard coded value ( in future if the servers are upgraded we can increase the value)

  @Input() diligence;
  @Input() currentUser: CurrentUserModel;
  @Input() firmPreferences;

  constructor(
    private readonly panel: SidePanelService,
    private readonly clipboard: ClipboardService,
    private readonly customModalService: CustomModalService,
    private readonly questionnaireService: QuestionnaireService,
    private readonly toasterService: ToastrService,
    private readonly dvDatePipe: DvDatePipe
  ) {}

  ngOnInit(): void {
    this.isSidePanelLoadingParam = false;
    this.isFooter = false;
    if (this.currentUser.isFreeSubscription) {
      const tab = this.tabs.find((tab) => tab.name == QaTabType.Library);
      tab.disabled = this.currentUser.isFreeSubscription;
      tab.tooltip = tab.tooltip + '.Available with premium subscription';
    }
    if (
      this.firmPreferences.set_preapproved_default &&
      !this.currentUser.isFreeSubscription &&
      this.currentUser.isManager
    ) {
      this.tabs.find((tab) => tab.name == QaTabType.Library).active = true;
      this.tabs.find((tab) => tab.name == QaTabType.ProjectHistory).active =
        false;
      this.sortList = DateSortLibrary;
      this.setType(QaTabType.Library, true);
    } else {
      this.tabs.find((tab) => tab.name == QaTabType.Library).active = false;
      this.tabs.find((tab) => tab.name == QaTabType.ProjectHistory).active =
        true;
      this.sortList = DateSortHistory;
      this.setType(QaTabType.ProjectHistory, true);
    }

    this.advancedFiltersFormGroup = new FormGroup({
      searchWithinQuestion: new FormControl(true),
      searchWithinAnswer: new FormControl(false),
      searchWithinTags: new FormControl(false),
      searchForSelectedEntity: new FormControl(false),
    });

    this.searchQueryChanged
      .pipe(
        debounceTime(300), // wait after the last event before emitting next event
        distinctUntilChanged(), // only emit if value is different from previous value
        switchMap((searchQuery) => {
          this.loading = true;
          this.searchParameter = searchQuery;
          this.allQuestionList = new Array(10000);
          return this.searchQa(this.searchParameter);
        })
      )
      .subscribe(
        (response: any) => {
          this.parseQaResponse(response);
          this.loading = false;
        },
        (err) => {
          this.loading = false;
        }
      );

    this.filterCount = this.getFilterCount();
  }

  ngOnDestroy(): void {
    this.searchQueryChanged?.unsubscribe();
  }

  handleTabChange(index) {
    this.currentSortFilterSelected = 'response_date_sort_desc';
    this.showAdvancedFilters = false;
    if (this.tabs[index].name == QaTabType.Library)
      this.sortList = DateSortLibrary;
    else this.sortList = DateSortHistory;
    this.setType(this.tabs[index].name, false);
  }

  setType(type, forceRefresh = false, offset = null) {
    if (forceRefresh || type != this.selectedType) {
      // retain all these value when offset is given
      if (!offset) {
        this.start_point = 0;
        this.end_point = this.pageSize;
        this.allQuestionList = new Array(10000);
        this.questionsTotalCount = 0;
      }
      this.selectedType = type;
      this.loading = true;
      this.searchQa(this.searchParameter, offset).subscribe(
        (response: any) => {
          this.parseQaResponse(response, offset);
          this.loading = false;
        },
        (err) => (this.loading = false)
      );
    }
  }
  onCancelClick() {
    this.panel.close();
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  handleSortChange(sort) {
    this.currentSortFilterSelected = sort;
    this.setType(this.selectedType, true);
  }

  searchQa(searchQuery, offset = null) {
    if (searchQuery) {
      this.loading = true;
      let params = {
        boosting_params: [
          {
            entity_type: this.diligence.entity_type,
            entity_name: this.diligence.entity_name,
            entity_id: this.diligence.entity_id,
          },
        ],
        filters: {},
        offset: null,
        include_empty_responses: false,
        query_result_size: this.query_result_size,
      };
      params.filters[FILTER_TERNARY_OPERATORS.OR] = [];
      if (this.advancedFiltersFormGroup.get('searchWithinQuestion').value) {
        params.filters[FILTER_TERNARY_OPERATORS.OR].push({
          filter_name: 'question_text',
          filter_value: searchQuery,
          filter_type: 'str',
          search_type: 'contains',
        });
      }
      if (this.advancedFiltersFormGroup.get('searchWithinAnswer').value) {
        params.filters[FILTER_TERNARY_OPERATORS.OR].push({
          filter_name: 'response_text',
          filter_value: searchQuery,
          filter_type: 'str',
          search_type: 'contains',
        });
      }

      if (this.advancedFiltersFormGroup.get('searchWithinTags').value) {
        params.filters[FILTER_TERNARY_OPERATORS.OR].push({
          filter_name: 'tags',
          filter_value: searchQuery,
          filter_type: 'str',
          search_type: 'contains',
        });
      }

      if (
        !this.advancedFiltersFormGroup.get('searchWithinQuestion').value &&
        !this.advancedFiltersFormGroup.get('searchWithinAnswer').value &&
        !this.advancedFiltersFormGroup.get('searchWithinTags').value
      ) {
        params.filters[FILTER_TERNARY_OPERATORS.GENERAL] = {
          filter_name: 'general',
          filter_value: searchQuery,
          filter_type: 'str',
          search_type: 'contains',
        };
      }

      params.filters[FILTER_TERNARY_OPERATORS.AND] = [];
      if (this.selectedType == QaTabType.Library) {
        let nameFilterParams = {
          filter_name: 'diligence_type',
          filter_type: 'dropdown',
          search_type: 'exact',
          filter_value: [-1],
        };

        const archiveFilter = ArchiveFilter;
        params.filters[FILTER_TERNARY_OPERATORS.AND].push(nameFilterParams);
        params.filters[FILTER_TERNARY_OPERATORS.AND].push(archiveFilter);
      } else {
        let nameFilterParams = {
          filter_name: 'diligence_type',
          filter_type: 'dropdown',
          search_type: 'exact',
          filter_value: [1243, 1242, 1241, 2, 0, 3],
        };
        const archiveFilter = ArchiveFilter;
        params.filters[FILTER_TERNARY_OPERATORS.AND].push(nameFilterParams);
        params.filters[FILTER_TERNARY_OPERATORS.AND].push(archiveFilter);
      }

      //Code to handle sorting logic
      if (this.currentSortFilterSelected) {
        const name = this.currentSortFilterSelected
          .split('_')
          .slice(0, 3)
          .join('_');
        const type = this.currentSortFilterSelected.split('_')[3] === 'asc';
        let nameFilterParams = {
          filter_name: name,
          filter_type: 'bool',
          search_type: 'exact',
          filter_value: type,
        };
        if (!params.filters[FILTER_TERNARY_OPERATORS.AND]) {
          params.filters[FILTER_TERNARY_OPERATORS.AND] = [];
        }
        params.filters[FILTER_TERNARY_OPERATORS.AND].push(nameFilterParams);
      }

      if (this.advancedFiltersFormGroup.get('searchForSelectedEntity').value) {
        params.filters[FILTER_TERNARY_OPERATORS.AND].push({
          entity_type: EntityType[this.diligence.entity_type],
          filter_name: 'entity_id',
          filter_type: 'id',
          filter_value: this.diligence.entity_id,
          search_type: 'exact',
        });
      }

      params.offset = offset;

      return this.questionnaireService.getQaItems(params);
    } else {
      return of({ data: [] });
    }
  }

  parseQaResponse(response, offset = false) {
    let returnedList = JSON.parse(JSON.stringify((response as any).data));
    returnedList.forEach((data, index) => {
      // We add data from the offset that we send to BE or if offset is null we start adding it from start point
      if (offset) this.allQuestionList[offset + index] = data;
      else this.allQuestionList[this.start_point + index] = data;
    });
    this.questionsTotalCount = response.filtered_count;
    this.fetchQuestionData();
  }

  handleSearchQueryChange(event) {
    this.searchQueryChanged.next(event);
  }

  handleIconClick(event, qaItem) {
    switch (event?.icon.name) {
      case 'copy':
        const responseText =
          qaItem?.data?.response_text_copy ||
          (qaItem?.data.response_type === ResponseType.Date
            ? qaItem?.data?.response_text
            : null);
        if (responseText) {
          copyHtml(responseText, this.clipboard, this.toasterService);
        } else {
          copyHtml(
            qaItem?.answer?.text ?? '',
            this.clipboard,
            this.toasterService
          );
        }
        break;
      case 'info':
        this.customModalService.invoke('full-response', {
          initialState: {
            qaItem: {
              questionText: qaItem.data.question_text,
              associatedTemplate: qaItem.data.associated_template,
              associatedInvestor: qaItem.data.associated_investor,
              associatedEntity: qaItem.data.associated_entity,
              associatedEntityType:
                qaItem.data.associated_entity_type == 'Fund'
                  ? 'Product'
                  : qaItem.data.associated_entity_type,
              expiryDate: qaItem.data.expiry_date,
              isVerified: qaItem.data.is_verified,
              isPreApprovedContent: this.selectedType == QaTabType.Library,
              tagsText: qaItem.data.tags_text,
              responseText: qaItem.data.response_text,
              responseTextCopy: qaItem.data.response_text_copy,
              createdBy: qaItem.data.response_created_by_name,
              responseType: qaItem.data.response_type,
              gridData:
                qaItem.data.response_type == ResponseType.Grid ||
                qaItem.data.response_type == ResponseType.DynamicGrid
                  ? {
                      colHeaders: qaItem.colHeaders,
                      rowHeaders: qaItem.rowHeaders,
                      tableData: qaItem.tableData,
                    }
                  : null,
              createdAt: qaItem.data.response_created_at,
            },
          },
        });
        break;
    }
  }

  importTable(qaItem: QaItemModel) {
    this.customModalService.invoke('import-grid', {
      initialState: this.getGridData(qaItem),
    });
  }

  getGridData(qaItem: QaItemModel) {
    let rows = qaItem.data.grid_response.Rows.map((row) => {
      return {
        id: row.order,
        name: row.name,
      };
    });

    let columns = qaItem.data.grid_response.Columns.map((column) => {
      return {
        id: column.order,
        name: column.name,
      };
    });

    let dataset = [];

    qaItem.tableData.forEach((row: any[]) => {
      let datarow: any = {};
      row.forEach((cell, index) => {
        datarow[`column_${index}`] = cell;
      });
      dataset.push(datarow);
    });

    return {
      rows,
      columns,
      dataset,
    };
  }

  // Function to get filters selected initially
  getFilterCount() {
    let count = 0;
    if (this.advancedFiltersFormGroup.get('searchWithinQuestion').value)
      count++;
    if (this.advancedFiltersFormGroup.get('searchWithinAnswer').value) count++;
    if (this.advancedFiltersFormGroup.get('searchWithinTags').value) count++;
    if (this.advancedFiltersFormGroup.get('searchForSelectedEntity').value)
      count++;

    return count;
  }

  changeValueCount(value) {
    if (value) this.filterCount++;
    else this.filterCount--;
  }

  fetchQuestionData() {
    let qa = this.allQuestionList
      .slice(this.start_point, this.end_point)
      .filter((data) => data);

    this.qa = qa.map((item: QaItem) => {
      if (
        !item.grid_response ||
        !item.grid_response.Columns ||
        !item.grid_response.Rows ||
        (item.response_type != ResponseType.Grid &&
          item.response_type != ResponseType.DynamicGrid)
      ) {
        let iconColor = '';
        if (
          item.response_status.toLocaleLowerCase() ===
          diligenceStatusConstant.ReviewFailed.toLocaleLowerCase()
        )
          iconColor = 'red';
        else if (
          item.response_status.toLocaleLowerCase() ===
          diligenceStatusConstant.ReviewPassed.toLocaleLowerCase()
        )
          iconColor = 'green';
        else if (
          item.response_status.toLocaleLowerCase() ===
          diligenceStatusConstant.InReview.toLocaleLowerCase()
        )
          iconColor = 'default';

        return {
          question: item.question_text,
          answer: [
            {
              text: item.response_text,
              icons: [{ name: 'copy', tooltip: 'Copy this response' }],
              metaData: {
                approvedBy: item.last_reviewed_by_name,
                approvedAt: item.last_reviewed_at,
                iconColor: iconColor,
                addedByMetaData: `${item.response_created_by_name} ${
                  this.selectedType === QaTabType.Library
                    ? 'last updated on'
                    : 'added on'
                } ${this.dvDatePipe.transform(item.response_created_at)} for ${
                  item.associated_entity_short ===
                  this.currentUser.firmInfo.name
                    ? 'My Firm'
                    : item.associated_entity_short
                } ${
                  this.selectedType === QaTabType.Library
                    ? ''
                    : item.is_standard_ddq
                    ? 'in ' + item.duediligence_name
                    : 'to ' + item.associated_investor_short
                }`,
              },
            },
          ],
          questionIcon: { name: 'info', tooltip: 'More info' },
          data: item,
        };
      } else {
        let colHeaders = item.grid_response?.Columns?.sort((item1, item2) => {
          return item1.order > item2.order ? 1 : -1;
        }).map((column) => column.name);

        let sortedRows = item.grid_response?.Rows?.sort((item1, item2) => {
          return item1.order > item2.order ? 1 : -1;
        });

        let rowHeaders = sortedRows?.map((row) => row.name);

        let tableData = sortedRows?.map((row) => row.responses);

        return {
          question: item.question_text,
          questionIcon: { name: 'info', tooltip: 'More info' },
          data: item,
          colHeaders,
          rowHeaders,
          tableData,
        };
      }
    });
  }

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
      return this.setType(
        this.selectedType,
        true,
        this.end_point - this.query_result_size
      );
    } else {
      this.fetchQuestionData();
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
      return this.setType(this.selectedType, true, this.start_point);
    } else {
      this.fetchQuestionData();
    }
  }

  firstClick() {
    this.start_point = 0;
    this.end_point = this.pageSize;
    this.fetchQuestionData();
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
      return this.setType(
        this.selectedType,
        true,
        this.questionsTotalCount - this.query_result_size
      );
    } else {
      this.fetchQuestionData();
    }
  }
}
