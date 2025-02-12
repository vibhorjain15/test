import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import {
  DateRanges,
  DownloadStatus,
  DownloadViewTabs,
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { DownloadAuditGridService } from './download-audits.service';
import { Select, Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-download_audits',
  templateUrl: './download_audits.component.html',
  styleUrls: ['./download_audits.component.css'],
})
export class DownloadAudit implements OnInit {
  allDownloads;
  myDownloadData;
  render_grid = false;
  initGridSection;
  gridName = 'admin_downloads';
  downloadStatus = DownloadStatus;
  VIEWTABS = DownloadViewTabs;
  selectedTab = this.VIEWTABS.ALL;
  expiredDownloads;
  customDateFilter;
  dateRangeActive;
  dateRangeOthers;
  apiParams = {};
  customDateFilterActive;
  minDateActive = moment().subtract(15, 'days').toDate();
  maxDate = new Date();
  minDate = moment().subtract(5, 'years').toDate();
  downloadsSub;
  filterData = {
    dateRange: {},
  };
  customFilterInitValue = {
    dateRange: {},
  };
  dateMap = {
    1: DateRanges[0].value,
    3: DateRanges[1].value,
    6: DateRanges[2].value,
    12: DateRanges[3].value,
    null: DateRanges[4].value,
  };
  defaultDateRange;
  @Select(UserState.getFirmPreferenceData) firmPref;

  constructor(
    private downloadAuditService: DownloadAuditGridService,
    private readonly store: Store,
    private readonly Utils: UtilsService
  ) {}
  ngOnInit() {
    this.firmPref.pipe(take(1)).subscribe((response) => {
      if (response) {
        this.defaultDateRange = response;
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          response.default_daterange_months
        );
        this.customDateFilter.selectedRange = this.Utils.getDateRanges().find(
          (val) => `${val.value}` === `${response.default_daterange_months}`
        )?.label;

        this.customDateFilterActive = [
          new Date(moment().subtract(15, 'days').toDate()),
          new Date(),
        ];

        this.initGrid();
        this.render_grid = true;
      }
    });
  }

  getDownloads(params) {
    this.initGridSection = false;
    this.downloadsSub?.unsubscribe();
    this.downloadsSub = this.downloadAuditService
      .getDownloads(params)
      .subscribe(
        (response) => {
          this.myDownloadData = response;
          this.initGridSection = true;
        },
        () => {
          this.initGridSection = true;
        }
      );
  }

  initGrid() {
    let defaultColumnDef = this.downloadAuditService.getDownloadAuditGridColDef(
      this.selectedTab
    );
    const colDefs = [
      {
        ...defaultColumn,
        colId: 'filename',
        headerName: 'File Name',
        field: 'filename',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        floatingFilterComponent: 'textFloatingFilterComponent',
        floatingFilterComponentParams: {
          suppressFilterButton: true,
          placeHolder: 'Search by file name',
        },
        flex: 1,
        minWidth: grid_widths_map.sm_column_sm,
        suppressColumnsToolPanel: true,
        sortable: true,
        cellRenderer: 'myDownloadFileNameRenderer',
        cellRendererParams: {
          updateDownloadedOn: (row) => {
            const index = this.allDownloads.findIndex(
              (x) => x.task_id === row.task_id
            );
            if (index > -1) {
              let download = this.allDownloads[index];
              download = {
                ...download,
                downloaded_on: new Date(),
              };
            }
          },
        },
      },
      ...defaultColumnDef,
    ];
    this.store.dispatch(new SetDefaultColumnDef({ [this.gridName]: colDefs }));
  }

  setSelectedTab(tab) {
    this.render_grid = false;
    this.selectedTab = tab;
    this.filterData = {
      dateRange: {},
    };
    this.customFilterInitValue = {
      dateRange: {},
    };
    if (tab == this.VIEWTABS.EXPIRED) {
      this.gridName = 'admin_downloads_expired';
    } else if (tab == this.VIEWTABS.ACTIVE) {
      this.gridName = 'admin_downloads_active';
    } else {
      this.gridName = 'admin_downloads';
    }
    setTimeout(() => {
      this.initGrid();
      this.render_grid = true;
    }, 1);
  }

  onDateRangeChange(event) {
    if (
      event &&
      event.startDate &&
      event.endDate &&
      (this.selectedTab == this.VIEWTABS.ALL ||
        this.selectedTab == this.VIEWTABS.EXPIRED)
    ) {
      this.dateRangeOthers = event;
      this.apiParams = {
        ...this.apiParams,
        start_date: event.startDate,
        end_date: event.endDate,
      };
      this.filterData = {
        dateRange: this.getDateObject(this.dateRangeOthers),
      };
      this.getDownloads(this.apiParams);
    }
  }

  onActiveDateRangeChange(event) {
    if (
      event &&
      event.startDate &&
      event.endDate &&
      this.selectedTab == this.VIEWTABS.ACTIVE
    ) {
      this.dateRangeActive = event;
      this.apiParams = {
        ...this.apiParams,
        start_date: event.startDate,
        end_date: event.endDate,
      };
      this.getDownloads(this.apiParams);
    }
  }

  onClearDateFilter() {
    if (
      this.selectedTab == this.VIEWTABS.EXPIRED ||
      this.selectedTab == this.VIEWTABS.ALL
    ) {
      this.dateRangeOthers = null;
    }
    let expired =
      this.apiParams.hasOwnProperty('expired') && this.apiParams['expired'];
    this.apiParams = {};
    if (expired)
      this.apiParams = {
        expired: true,
      };
    this.filterData = {
      dateRange: this.getDateObject(this.dateRangeOthers),
    };
    this.getDownloads(this.apiParams);
  }

  setActiveSectionDates() {
    this.dateRangeActive = {
      startDate: this.Utils.getFromDateTimeFormatted(
        moment().subtract(15, 'days').toDate()
      ),
      endDate: this.Utils.getToDateTimeFormatted(new Date()),
    };
  }

  loadView(filterData) {
    if (this.selectedTab == this.VIEWTABS.ACTIVE) {
      this.setActiveSectionDates();
      this.apiParams = {
        expired: false,
        start_date: this.dateRangeActive.startDate,
        end_date: this.dateRangeActive.endDate,
      };
      this.getDownloads(this.apiParams);
    } else if (
      this.selectedTab == this.VIEWTABS.EXPIRED ||
      this.selectedTab == this.VIEWTABS.ALL
    ) {
      if (
        !filterData.hasOwnProperty('dateRange') ||
        (filterData.dateRange && Object.keys(filterData.dateRange).length == 0)
      ) {
        if (this.defaultDateRange.default_daterange_months) {
          this.dateRangeOthers = {
            startDate: this.Utils.formatDatetime(
              this.customDateFilter.startDate
            ),
            endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
            range: this.defaultDateRange?.default_daterange_months ?? 'null',
          };
        }
      } else {
        if (filterData.dateRange.range) {
          this.dateRangeOthers = this.dateMap[filterData.dateRange.range];
          this.dateRangeOthers = {
            startDate: this.Utils.getFromDateTimeFormatted(
              this.dateRangeOthers[0]
            ),
            endDate: this.Utils.getToDateTimeFormatted(this.dateRangeOthers[1]),
            range: filterData.dateRange.range,
          };
        } else if (
          filterData.dateRange.startDate &&
          filterData.dateRange.endDate
        ) {
          this.dateRangeOthers = {
            startDate: this.Utils.getFromDateTimeFormatted(
              filterData.dateRange.startDate
            ),
            endDate: this.Utils.getToDateTimeFormatted(
              filterData.dateRange.endDate
            ),
          };
        }
      }
      if (this.selectedTab == this.VIEWTABS.ALL) {
        this.apiParams = {};
      } else {
        this.apiParams = {
          expired: true,
        };
      }
      if (
        this.dateRangeOthers &&
        this.dateRangeOthers?.startDate &&
        this.dateRangeOthers?.endDate
      ) {
        this.apiParams = {
          ...this.apiParams,
          start_date: this.dateRangeOthers.startDate,
          end_date: this.dateRangeOthers.endDate,
        };
      }
      this.getDownloads(this.apiParams);

      this.filterData = {
        dateRange: this.getDateObject(this.dateRangeOthers),
      };

      this.customFilterInitValue = {
        ...this.customFilterInitValue,
        dateRange: this.getDateObject(this.dateRangeOthers),
      };
    }
  }

  getDateObject(dateRange) {
    let dateObj;
    if (dateRange?.range) {
      dateObj = {
        range: parseInt(dateRange.range),
      };
    } else if (dateRange) {
      dateObj = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
    }
    return dateObj;
  }
}
