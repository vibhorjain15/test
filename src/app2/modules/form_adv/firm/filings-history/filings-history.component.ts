import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from 'src/app2/services/utils.service';
import { RouterService } from 'src/app2/services/router.service';
import * as moment from 'moment';
import { UserState } from 'src/app2/store/user/user.state';
import { GetCurrentUser } from 'src/app2/store/user/user.action';
import { Select, Store } from '@ngxs/store';
import { map, shareReplay, take, tap, finalize } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DownloadMedium } from 'src/app2/shared/constants/constant';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-filings-history',
  templateUrl: './filings-history.component.html',
})
export class FilingsHistoryComponent implements OnInit {
  firmCRD: any;
  loading_grid: boolean = false;
  displaySidebarPanel: boolean = false;
  formadv_firm: any = null;
  columnDefs: any;
  gridDatasource: any = [];
  subscription: any;
  username: any;
  has_threshold: boolean;
  skip_default: boolean;
  dateRange: { start_at: any; end_at: any; set: boolean };
  current_page: number;
  total_pages: any;
  is_loading: boolean;
  formadv_questions: any;
  editDateRange: any;
  edit_timeline: boolean;
  filings: any = [];
  thresholds: any = [];
  thresholdTypes: any = [];
  notesList = [];
  downloadMedium;
  @Select(UserState.getCurrentUserData) user$;
  materialThresholds: any = [
    {
      id: 0,
      text: 'Absolute',
    },
    {
      id: 1,
      text: 'Change',
    },
  ];
  total_records: any;
  showLoadingIndicator = false;
  constructor(
    private router: RouterService,
    private Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private customModal: CustomModalService,
    private routerState: ActivatedRoute
  ) {
    this.loading_grid = false;
    this.firmCRD = this.router.getState(this.routerState).params.firmCRD;
    this.has_threshold =
      this.router.getState(this.routerState).params.has_threshold === 'true';
    this.skip_default =
      this.router.getState(this.routerState).params.skip_default === 'true';
    this.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        let current_user = JSON.parse(JSON.stringify(user));
        this.username = current_user.userName;
        this.subscription = current_user.firmInfo.subscription;
        this.downloadMedium =
          current_user.firmInfo.preferences.doc_access_preference;
      }
    });

    if (
      this.router.getState(this.routerState).params.start_at &&
      this.router.getState(this.routerState).params.end_at
    ) {
      this.dateRange = {
        start_at: this.router.getState(this.routerState).params.start_at,
        end_at: this.router.getState(this.routerState).params.end_at,
        set: true,
      };
    } else {
      this.dateRange = {
        start_at: null,
        end_at: null,
        set: false,
      };
    }
  }

  ngOnInit(): void {
    this.initSetting();
    this.http
      .get(`formadv_firms/${this.firmCRD}`)
      .subscribe((response: any) => {
        this.formadv_firm = response;
      });

    if (!this.skip_default) {
      this.http
        .get(`firm_preferences/material_change_preference`)
        .subscribe((response: boolean) => {
          this.has_threshold = response === true;
          return this.getFormAdvTimeline();
        });
    } else {
      this.getFormAdvTimeline();
    }
    this.getNotes();
  }

  initSetting() {
    this.current_page = 0;
    this.total_pages = null;
    this.is_loading = false;
    this.formadv_questions = [];
    this.editDateRange = ['', ''];
    this.edit_timeline = false;
  }

  getFormAdvTimeline() {
    this.http
      .get(`Formadv_filings/timeline?firmCrd=${this.firmCRD}`)
      .subscribe((response: any) => {
        this.filings = response;
        if (!this.dateRange.set) {
          if (this.filings.length <= 2) {
            switch (this.filings.length) {
              case 0:
                this.dateRange.start_at = null;
                this.dateRange.end_at = null;
                break;
              case 1:
                this.dateRange.start_at = this.filings[0].filingDate;
                this.dateRange.end_at = null;
                break;
              case 2:
                this.dateRange.start_at = this.filings[1].filingDate;
                this.dateRange.end_at = this.filings[0].filingDate;
                break;
            }
          } else {
            this.dateRange.start_at = this.filings[1].filingDate;
            this.dateRange.end_at = this.filings[0].filingDate;
          }

          this.dateRange.set = true;
        }

        if (this.has_threshold) {
          this.http.get('formadv_thresholds').subscribe((response: any) => {
            this.thresholds = response;
            this.loadFormAdvQuestions();
            this.thresholdTypes = this.materialThresholds;
          });
        } else {
          this.loadFormAdvQuestions();
        }
      });
  }

  loadFormAdvQuestions(showLoadingIndicator = false) {
    if (this.showLoadingIndicator) return;
    if (
      this.current_page &&
      this.total_pages &&
      this.current_page === this.total_pages
    )
      return;
    if (
      this.subscription === 'Institutional' ||
      this.subscription === 'Productive' ||
      this.subscription === 'FormADV' ||
      this.subscription === 'Full' ||
      this.subscription === 'FormADVAnalytics' ||
      this.subscription === 'Smart'
    ) {
      if (this.is_loading || this.current_page === this.total_pages) {
        return;
      }

      this.current_page += 1;
      this.showLoadingIndicator = showLoadingIndicator;
      let url = `Formadv_Questions?end_at=${this.dateRange.end_at}&firmCrd=${this.firmCRD}&has_threshold=${this.has_threshold}&pageNumber=${this.current_page}&start_at=${this.dateRange.start_at}`;
      this.http
        .get(url)
        .pipe(
          map((response: any) => {
            return response;
          }),
          finalize(() => {
            if (showLoadingIndicator) {
              this.showLoadingIndicator = false;
            }
            this.loading_grid = true;
          }),
          shareReplay(1) // This will cache the last (1) emitted value and share it amongst all the subscriptions of this observable hence preventing multiple API call
        )
        .subscribe((response: any) => {
          this.total_records = response.meta.totalRecords;
          this.total_pages = response.meta.totalPages;

          response.results.map((question: any) => {
            this.formadv_questions.push(question);
          });
        });
    }
  }

  trackBy(index, item) {
    return item.id;
  }

  downloadExcel() {
    if (this.formadv_questions.length) {
      this.toaster.info('Request being processed.');
      let email = this.username.replace(/\+/gi, '%2B');
      let url = `Formadv_filings/history/export?end_at=${this.dateRange.end_at}&firmCrd=${this.firmCRD}&recipients=${email}&start_at=${this.dateRange.start_at}`;
      this.http.get(url).subscribe((response: any) => {
        let message =
          "Once the document is ready for download, it will be accessible in the 'My Downloads' section.";
        if (this.downloadMedium == DownloadMedium.BOTH) {
          message =
            "Once the document is ready for download, it will be accessible in the 'My Downloads' section and in your inbox.";
        }
        return this.toaster.success(message, 'Request processed successfully.');
      });
    }
  }

  toggleMaterialChanges() {
    this.has_threshold = !this.has_threshold;
    this.router.navigateWithParams(
      'app.form_adv.firm.filings_history',
      {
        has_threshold: this.has_threshold,
        start_at: this.dateRange.start_at,
        end_at: this.dateRange.end_at,
        skip_default: true,
        firmCRD: this.firmCRD,
      },
      {
        reload: true,
      }
    );
  }

  returnToList() {
    this.router.navigate('app.form_adv.regulatory_monitor.portfolio');
  }

  triggerWorkflow() {
    this.customModal.invoke('trigger-workflow', {
      initialState: {
        entity_type: 'FormADV',
        entity_id: this.formadv_firm.id,
        name: this.formadv_firm.businessName,
      },
    });
  }

  selectDate(date: { filingDate: any }) {
    const selectedDateMoment = moment(date.filingDate, 'MM-DD-YYYY');
    const endAtMoment = moment(this.dateRange.end_at, 'MM-DD-YYYY');
    const startAtMoment = moment(this.dateRange.start_at, 'MM-DD-YYYY');

    const isAfter = moment(selectedDateMoment).isAfter(endAtMoment);
    const isBefore = moment(selectedDateMoment).isBefore(startAtMoment);
    const isBetween = moment(selectedDateMoment).isBetween(
      startAtMoment,
      endAtMoment,
      null,
      '()'
    );

    let rangeChanged = false;

    if (isBefore) {
      this.dateRange.start_at = date.filingDate;
      rangeChanged = true;
    } else if (isAfter) {
      this.dateRange.end_at = date.filingDate;
      rangeChanged = true;
    } else if (isBetween) {
      /*Code below is to take time difference into consideration*/
      /*diff_from_start = selectedDateMoment.diff(startAtMoment, 'days')
      diff_from_end = endAtMoment.diff(selectedDateMoment, 'days')*/

      const start_at_idx = this.Utils.pluck(this.filings, 'filingDate').indexOf(
        this.dateRange.start_at
      );
      const end_at_idx = this.Utils.pluck(this.filings, 'filingDate').indexOf(
        this.dateRange.end_at
      );
      const selected_date_idx = this.Utils.pluck(
        this.filings,
        'filingDate'
      ).indexOf(date.filingDate);

      /*Code below is to take index difference into consideration*/
      const diff_from_start = start_at_idx - selected_date_idx;
      const diff_from_end = selected_date_idx - end_at_idx;

      if (diff_from_start <= diff_from_end) {
        this.dateRange.start_at = date.filingDate;
      } else {
        this.dateRange.end_at = date.filingDate;
      }
      rangeChanged = true;
    }

    if (rangeChanged) {
      this.initSetting();
      this.loadFormAdvQuestions();
    }
  }

  selectCustomDates(date: { filingDate: any }) {
    const idx = this.editDateRange.indexOf(date.filingDate);

    if (idx > -1) {
      return (this.editDateRange[idx] = '');
    } else {
      if (this.editDateRange[0].length === 0) {
        return (this.editDateRange[0] = date.filingDate);
      } else {
        return (this.editDateRange[1] = date.filingDate);
      }
    }
  }

  getFilingData() {
    this.loading_grid = false;
    if (this.editDateRange[0].length > 0 && this.editDateRange[1].length > 0) {
      const isBefore = moment(
        moment(this.editDateRange[1], 'MM-DD-YYYY')
      ).isBefore(moment(this.editDateRange[0], 'MM-DD-YYYY'));

      if (isBefore) {
        this.dateRange.start_at = this.editDateRange[1];
        this.dateRange.end_at = this.editDateRange[0];
      } else {
        this.dateRange.start_at = this.editDateRange[0];
        this.dateRange.end_at = this.editDateRange[1];
      }

      this.initSetting();
      this.loadFormAdvQuestions();
      this.router.navigateWithParams('app.form_adv.firm.filings_history', {
        has_threshold: this.has_threshold,
        start_at: this.dateRange.start_at,
        end_at: this.dateRange.end_at,
        firmCRD: this.firmCRD,
        skip_default: true,
      });
    } else {
      this.toaster.error('Please select at least two filing dates');
    }
  }

  onSideBarClose() {
    this.displaySidebarPanel = false;
  }

  getNotes() {
    return new Promise((resolve) => {
      this.http
        .get('notes', {
          params: {
            entity_id: this.firmCRD,
            entity_type: 'FormADV',
          },
        })
        .subscribe(
          (notes: any[]) => {
            this.notesList = notes;
            resolve(notes);
          },
          (e) => resolve([])
        );
    });
  }

  async displayNotes() {
    this.displaySidebarPanel = true;
    this.customModal.invoke('add-notes', {
      initialState: {
        title: `Add Notes for ${this.formadv_firm.businessName}`,
        emptyStateMessage: 'There are no notes for this question',
        childId: '',
        childType: 'Question',
        entityId: this.firmCRD,
        entityType: 'FormADV',
        loadedNotes: await this.getNotes(),
        additionalSaveParams: {},
      },
      class: 'modal-lg',
    });
  }

  handleQuestionListScroll($event) {
    if (
      this.loading_grid && // data is loaded
      this.current_page <= this.total_pages && // pages available
      !this.showLoadingIndicator // not showing loading indicator
    ) {
      this.loadFormAdvQuestions(true);
    }
  }
}
