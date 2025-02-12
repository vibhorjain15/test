import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { BaseDataService } from 'src/app2/services/base-data.service';
import * as moment from 'moment';
import { exploreTrackService } from './my-explore-track-service';
import { UserState } from 'src/app2/store/user/user.state';
import { Select, Store } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import {
  defaultColumn,
  FILTER_TERNARY_OPERATORS,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DvGridComponent } from 'src/app2/shared/components/dv-grid/dv-grid.component';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
declare var $: any;

@Component({
  selector: 'app-explor-track',
  templateUrl: './explore-track.component.html',
})
export class ExploreTrackComponent implements OnInit {
  @ViewChild('regulatoryMonitorExplore') grid: DvGridComponent;
  username: any;
  resource: any;
  showingFilingsResults: boolean;
  filterSummary: {};
  showingSearchResults: boolean;
  global_ternary_operator: string;
  activeTeamMember_name: any;
  activeTeamMember_id: number;
  criteria_options: any;
  teamMembers: any = [];
  gridDatasource: any = [];
  search_criterias: any = [];
  loading_grid: boolean;
  search_filings_form: any;
  is_collapsed: boolean;
  columnDefs: any;

  @Select(UserState.getCurrentUserData) user$;
  @ViewChild('searchPanel') searchPanel: ElementRef;
  panelElement: any;

  globalTernaryOperator = [
      { id: FILTER_TERNARY_OPERATORS.OR, name: 'ANY' },
      { id: FILTER_TERNARY_OPERATORS.AND, name: 'ALL' },
  ];
  constructor(
    private store: Store,
    private services: exploreTrackService,
    private baseDataService: BaseDataService,
    private customModal: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient
  ) {}

  async ngOnInit() {
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((user) => {
        if (user) {
          this.username = JSON.parse(JSON.stringify(user)).userName;
        }
      });

    this.showingFilingsResults = true;
    this.filterSummary = {};
    this.showingSearchResults = false;
    this.toggleSearchPanel();
    this.criteria_options = await this.getCriteriaList();
    this.teamMembers = await this.getTeamMembersData();
    this.gridDatasource = await this.getGridDatasource();
    this.global_ternary_operator = 'or';
    this.activeTeamMember_name = null;
    this.activeTeamMember_id = null;

    this.columnDefs = this.services.getActionsColDef();
    this.columnDefs.push({
      ...defaultColumn,
      colId: 'is_tracking',
      headerName: 'Is Tracked?',
      field: 'is_tracking',
      cellRenderer: 'formAdvActionsComponent',
      cellRendererParams: {
        innerRenderer: 'formAdvActionsComponent',
        refreshGrid: async (field) => {
          this.gridDatasource = await this.getGridDatasource();
        },
      },
      minWidth: grid_widths_map.sm_column_lg,
      floatingFilter: true,
      filter: 'agSetColumnFilter',
      filterParams: {
        cellRenderer: (params) => {
          return params.value === '(Select All)'
            ? '(Select All)'
            : params.value === 'true'
            ? 'Yes'
            : 'No';
        },
        valueFormatter: (params) => {
          return params.value === '(Select All)'
            ? '(Select All)'
            : params.value === 'true'
            ? 'Yes'
            : 'No';
        },
      },
    });
    this.store.dispatch(
      new SetDefaultColumnDef({
        ['formadv-regulatory-monitor-explore']: this.columnDefs,
      })
    );

    this.search_criterias = [];
  }
  ngAfterViewInit() {
    this.panelElement = this.searchPanel.nativeElement;
  }

  async getTeamMembersData() {
    let self = this;
    return new Promise(async function (resolve, reject) {
      try {
        self.toaster.clear();
        self.baseDataService.getTeamMembers().subscribe(
          (response: any) => {
            self.toaster.clear();
            resolve(response);
          },
          (error: any) => {
            self.toaster.clear();
            reject(error);
          }
        );
      } catch (error) {
        self.toaster.clear();
        reject(error);
      }
    });
  }

  async getCriteriaList() {
    let self = this;
    return new Promise(async function (resolve, reject) {
      try {
        self.toaster.clear();
        self.http.get('formadv_filings/criteria').subscribe(
          (response: any) => {
            self.toaster.clear();
            resolve(response);
          },
          (error: any) => {
            self.toaster.clear();
            reject(error);
          }
        );
      } catch (error) {
        self.toaster.clear();
        reject(error);
      }
    });
  }

  async getGridDatasource() {
    let self = this;
    let params = {};
    self.loading_grid = false;
    if (this.activeTeamMember_id) {
      params = { user_id: this.activeTeamMember_id };
    }

    return new Promise(async function (resolve, reject) {
      try {
        self.toaster.clear();
        self.http.get('Firm_FirmCRD_Mappings', { params }).subscribe(
          (response: any) => {
            self.toaster.clear();
            self.loading_grid = true;
            resolve(response);
          },
          (error: any) => {
            self.toaster.clear();
            reject(error);
          }
        );
      } catch (error) {
        self.toaster.clear();
        reject(error);
      }
    });
  }

  toggleSearchPanel() {
    //const $panel = $('.js-search-panel');
    const $panel = this.panelElement;
    this.is_collapsed = !this.is_collapsed;
    $panel?.find('.panel-body').slideToggle();
    return true;
  }

  openBulkModal() {
    this.customModal.invoke('upload-crd', {
      initialState: {
        selectedUser: this.activeTeamMember_id,
        onSuccess: async () => {
          this.loading_grid = true;
          this.customModal.close();
          this.gridDatasource = await this.getGridDatasource();
        },
      },
    });
  }

  searchFilings() {
    if (!this.search_filings_form.$valid) {
      return;
    }
    this.showingFilingsResults = false;

    const params = {
      global_operator: this.global_ternary_operator,
      criterias: [],
    };

    this.search_criterias.forEach((criteria) => {
      const criteria_obj = {};
      criteria_obj['criteria_label'] = criteria.criteria_obj.value;
      if (criteria.criteria_obj.value === 'not_updated_since') {
        criteria_obj['value'] = moment(criteria.value).format('DD-MMMM-YYYY');
      } else {
        criteria_obj['value'] = criteria.value;
      }
      return params.criterias.push(criteria_obj);
    });

    this.compileFilterSummary();
    this.showingSearchResults = true;

    this.toggleSearchPanel();

    delete this.resource;
    //this.resource = this.FirmCRDMappingResource.$new(params);
    setTimeout(() => {
      this.showingFilingsResults = true;
    }, 1000);
  }

  compileFilterSummary() {
    this.filterSummary = {
      global_operator: this.global_ternary_operator,
      criterias: [],
    };

    this.search_criterias.forEach((criteria) => {
      const criteria_obj = {};
      criteria_obj['label'] = criteria.criteria_obj.label;
      criteria_obj['value'] = [];
      if (criteria.criteria_obj.value === 'not_updated_since') {
        criteria_obj['value'].push(
          moment(criteria.value).format('DD-MMMM-YYYY')
        );
      } else {
        criteria_obj['value'].push(criteria.value);
      }
      return this.filterSummary['criterias'].push(criteria_obj);
    });
  }

  clearTeamMember() {
    this.activeTeamMember_name = null;
    this.activeTeamMember_id = null;
    this.loading_grid = true;
    this.getGridDatasource();
  }

  downloadSearchResultsToExcel() {
    const firm_arr = [];
    this.resource.data.each((firm: { firmCRD: any }) => {
      return firm_arr.push(firm.firmCRD);
    });
    this.toaster.info(
      'Request being processed. You will receive an email with the excel'
    );
    this.http
      .get(
        `formadv_firms/export?firmCRDs=${firm_arr.join(',')}&recipients=${
          this.username
        }`
      )
      .subscribe((response: any) => {
        this.toaster.success(
          'Request processed. Please check your email for the search results'
        );
      });
  }

  async filterByTeamMember(user: { fullName: any; id: any }) {
    this.activeTeamMember_name = user.fullName;
    this.activeTeamMember_id = user.id;
    this.loading_grid = true;
    this.gridDatasource = await this.getGridDatasource();
  }

  selectCriteria(criteria: any, index: string | number) {
    this.search_criterias[index].value = '';
  }

  removeCriteria() {
    this.search_criterias.splice(this.search_criterias.length - 1, 1);
    this.search_filings_form.$setPristine();
  }

  addNewCriteria() {
    this.search_criterias.push({});
    this.search_filings_form.$setPristine();
  }

  resetQuestionFiltersData() {}

  gridReady(params: any) {
    if (params.gridApi) {
      params.gridApi.setRowData(this.gridDatasource);
    }
  }
}


