import { Component, OnInit } from '@angular/core';
import { MyDownloadsGridService } from './my-downloads.service';
import { Select, Store } from '@ngxs/store';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import * as moment from 'moment';
import { WebsocketMessageState } from 'src/app2/store/download/download.state';
import {
  defaultColumn,
  grid_widths_map,
  DownloadStatus,
  DownloadViewTabs,
  DateRanges,
} from '../../constants/constant';
import { SetDownload } from 'src/app2/store/download/download.action';
import {
  GetWebsocketToken,
} from 'src/app2/store/user/user.action';
import { UserService } from 'src/app2/services/user.service';
import { UserState } from 'src/app2/store/user/user.state';
import { UtilsService } from 'src/app2/services/utils.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-my-downloads',
  templateUrl: './my-downloads.component.html',
  styleUrls: ['./my-downloads.component.css'],
})
export class MyDownloadsComponent implements OnInit {
  myDownloadData;
  myDownloadDataCopy;
  initGridSection;
  tobeExpired;
  allDownloads;
  MODES = {
    ALL: 'All',
    TOBEEXPIRED: 'ToBeExpired',
  };
  mode = this.MODES.ALL;
  downloadStatus = DownloadStatus;
  VIEW_TABS = DownloadViewTabs;
  isWebTokenActive;
  selectedTab = this.VIEW_TABS.ACTIVE;
  expiredDownloads;
  minDate = moment().subtract(5, 'years').toDate();
  maxDate = new Date();
  minActiveDate;
  maxActiveDate;
  expireGridRowClass = '';
  customDateFilter;
  dateRange;
  getDownloadsSub;
  dateRangeActive;
  firmData;
  gridName = 'my_downloads';
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
  @Select(WebsocketMessageState.getDownloads) myDownloads$;
  @Select(WebsocketMessageState.getActive) webtokenActive$;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getCurrentUserData) user;
  constructor(
    private readonly mydownloadService: MyDownloadsGridService,
    private readonly store: Store,
    private readonly userService: UserService,
    private readonly Utils: UtilsService
  ) {}

  ngOnInit() {
    this.minActiveDate = moment().subtract(15, 'days').toDate();
    this.maxActiveDate = new Date();

    this.getFirmPref();
    this.getMydownloads();
    this.webtokenActive$.subscribe((response) => {
      this.isWebTokenActive = response;
    });
  }

  getFirmPref() {
    this.firmPref.pipe(take(1)).subscribe((response) => {
      this.firmData = response;
      if (response) {
        this.defaultDateRange = response;
        this.customDateFilter = this.Utils.getPredefinedDateRanges(
          this.defaultDateRange.default_daterange_months
        );
        this.customDateFilter.selectedRange = this.Utils.getDateRanges().find(
          (val) =>
            `${val.value}` ===
            `${this.defaultDateRange.default_daterange_months}`
        )?.label;
      }
    });
  }

  setActiveSectionDates() {
    this.dateRangeActive = {
      startDate: this.Utils.getFromDateTimeFormatted(
        moment().subtract(15, 'days').toDate()
      ),
      endDate: this.Utils.getToDateTimeFormatted(new Date()),
    };
  }

  initGrid() {
    let defaultColumnDef = this.mydownloadService.getMyDownloadsGridColDef(
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
              this.store.dispatch(new SetDownload(download));
            }
          },
        },
      },
      ...defaultColumnDef,
    ];
    this.store.dispatch(new SetDefaultColumnDef({ [this.gridName]: colDefs }));
  }

  getMydownloads() {
    this.initGridSection = false;
    this.myDownloadData = null;
    this.myDownloads$.subscribe((downloads) => {
      if (downloads) {
        this.myDownloadData = downloads;
        this.allDownloads = this.myDownloadData;
        this.myDownloadDataCopy = JSON.parse(JSON.stringify(this.allDownloads));
        this.tobeExpired = this.myDownloadData.filter((download) => {
          return (
            moment(download.expiry_date).isBefore(moment().add(8, 'hours')) &&
            !download.downloaded_on
          );
        });
      }
      this.initGrid();
      this.initGridSection = true;
    });
  }

  viewDownloads(mode) {
    this.mode = mode;
    if (mode == this.MODES.ALL) {
      this.myDownloadData = [...this.allDownloads];
    } else {
      this.myDownloadData = [...this.tobeExpired];
    }
  }

  refreshWebToken() {
    this.store.dispatch(new GetWebsocketToken());
  }

  setSelectedTab(tab) {
    this.initGridSection = false;
    this.selectedTab = tab;
    this.filterData = {
      dateRange: {},
    };
    this.customFilterInitValue = {
      dateRange: {},
    };
    if (tab == this.VIEW_TABS.EXPIRED) {
      this.gridName = 'my_downloads_expired';
      this.expireGridRowClass = 'expiredGridRow';
    } else {
      this.gridName = 'my_downloads';
      this.getDownloadsSub?.unsubscribe();
      this.expireGridRowClass = '';
    }
    setTimeout(() => {
      this.initGrid();
      this.initGridSection = true;
    }, 1);
  }

  getExpiredData(dateParams = {}) {
    let params = {
      ...dateParams,
      expired: true,
    };
    this.getDownloadsSub?.unsubscribe();
    this.getDownloadsSub = this.userService
      .getUserDownloads(params)
      .subscribe((response) => {
        this.myDownloadData = response;
        this.expiredDownloads = response;
      });
  }

  onDateRangeChange(event) {
    if (this.selectedTab == this.VIEW_TABS.EXPIRED) {
      this.dateRange = {
        startDate: this.Utils.formatDatetime(event.startDate),
        endDate: this.Utils.formatDatetime(event.endDate),
        range: event.range,
      };
      const params = {
        start_date: this.dateRange.startDate,
        end_date: this.dateRange.endDate,
      };
      this.filterData = {
        dateRange: this.getDateObject(this.dateRange),
      };
      this.getExpiredData(params);
    }
  }

  // on active date change not sorting locally no API call needed
  onActiveDateRangeChange(event) {
    if (
      event &&
      event.startDate &&
      event.endDate &&
      this.myDownloadDataCopy?.length
    ) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      this.dateRangeActive = {
        startDate: this.Utils.formatDatetime(event.startDate),
        endDate: this.Utils.formatDatetime(event.endDate),
        range: null,
      };
      this.getActiveDownloadsData(startDate, endDate);
    }
  }

  getActiveDownloadsData(startDate, endDate) {
    this.myDownloadData = this.myDownloadDataCopy
      .filter((item) => {
        const downloadedOnDate = new Date(item.requested_on);
        return downloadedOnDate >= startDate && downloadedOnDate <= endDate;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.requested_on).getTime();
        const dateB = new Date(b.requested_on).getTime();
        return dateA - dateB;
      });
  }

  onClearDateFilter() {
    if (this.selectedTab == this.VIEW_TABS.EXPIRED) {
      this.dateRange = {
        startDate: null,
        endDate: null,
        range: null,
      };
      this.filterData = {
        dateRange: this.getDateObject(this.dateRange),
      };
      this.getExpiredData();
    }
  }

  loadView(filterData) {
    if (this.selectedTab == this.VIEW_TABS.ACTIVE) {
      this.setActiveSectionDates();
      this.getActiveDownloadsData(
        this.dateRangeActive.startDate,
        this.dateRangeActive.endDate
      );

      if (this.mode == this.MODES.TOBEEXPIRED && this.tobeExpired.length == 0) {
        this.viewDownloads(this.MODES.ALL);
      } else {
        this.viewDownloads(this.mode);
      }
    } else if (this.selectedTab == this.VIEW_TABS.EXPIRED) {
      if (
        !filterData.hasOwnProperty('dateRange') ||
        (filterData.dateRange && Object.keys(filterData.dateRange).length == 0)
      ) {
        if (this.defaultDateRange.default_daterange_months) {
          this.dateRange = {
            startDate: this.Utils.formatDatetime(
              this.customDateFilter.startDate
            ),
            endDate: this.Utils.formatDatetime(this.customDateFilter.endDate),
            range: this.defaultDateRange?.default_daterange_months ?? 'null',
          };
        }
      } else {
        if (filterData.dateRange.range) {
          this.dateRange = this.dateMap[filterData.dateRange.range];
          this.dateRange = {
            startDate: this.Utils.getFromDateTimeFormatted(this.dateRange[0]),
            endDate: this.Utils.getToDateTimeFormatted(this.dateRange[1]),
            range: filterData.dateRange.range,
          };
        } else if (
          filterData.dateRange.startDate &&
          filterData.dateRange.endDate
        ) {
          this.dateRange = {
            startDate: this.Utils.getFromDateTimeFormatted(
              filterData.dateRange.startDate
            ),
            endDate: this.Utils.getToDateTimeFormatted(
              filterData.dateRange.endDate
            ),
          };
        }
      }
      let params = {};
      if (
        this.dateRange &&
        this.dateRange?.startDate &&
        this.dateRange?.endDate
      ) {
        params = {
          start_date: this.dateRange.startDate,
          end_date: this.dateRange.endDate,
        };
      }
      this.getExpiredData(params);

      this.filterData = {
        dateRange: this.getDateObject(this.dateRange),
      };

      this.customFilterInitValue = {
        ...this.customFilterInitValue,
        dateRange: this.getDateObject(this.dateRange),
      };
    }
  }

  getDateObject(dateRange) {
    let dateObj;
    if (dateRange.range) {
      dateObj = {
        range: parseInt(dateRange.range),
      };
    } else {
      dateObj = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
    }
    return dateObj;
  }
}
