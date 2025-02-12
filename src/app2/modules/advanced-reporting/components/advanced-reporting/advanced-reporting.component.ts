import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Select } from '@ngxs/store';
import { UserState } from '../../../../store/user/user.state';
import { finalize, take } from 'rxjs/operators';
import { PowerBIReportEmbedComponent } from 'powerbi-client-angular';
import { ToastrService } from 'ngx-toastr';
import { SweetAlertService } from '../../../../services/sweet-alert.service';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { PopoverDirective } from 'ngx-bootstrap/popover';
import { IEmbedConfiguration, models } from 'powerbi-client';
import { forkJoin, interval } from 'rxjs';
import { ErrorHandlerService } from 'src/app2/services/error-handler.service';

@Component({
  selector: 'app-advanced-reporting',
  templateUrl: './advanced-reporting.component.html',
  styleUrls: ['./advanced-reporting.component.css'],
})
export class AdvancedReportingComponent implements OnInit, OnDestroy {
  selectedReport: any;
  loading_data;
  loading_report;
  reports;
  models;
  export_options;
  report_config: IEmbedConfiguration;
  report_events;
  current_user;
  downloadingPdf;
  Navigator: any = navigator;
  Window: any = window;
  isExportPopoverOpen;
  isCustomViewPopoverOpen;
  customViewGroups;
  exportFileTypes = [
    {
      value: 'PDF',
    },
    {
      value: 'PPTX',
    },
    {
      value: 'PNG',
    },
  ];
  enableExport = false;
  defaultConfig;
  @Select(UserState.getCurrentUserData) user;
  @ViewChild(PowerBIReportEmbedComponent)
  reportObj!: PowerBIReportEmbedComponent;
  @ViewChild('pop') bookmarkPopover: PopoverDirective;
  fileTypes = [{ name: 'PDF', value: 'PDF' }];

  refreshEmbedToken$;

  constructor(
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly SweetAlert: SweetAlertService,
    private readonly customModalService: CustomModalService,
    private readonly errorHandler: ErrorHandlerService
  ) {
    //this.models = window['powerbi-client'].models;
    this.models = models;
    this.export_options = {
      pages: [],
      fileTypes: {
        selectedType: 'PDF',
      },
    };
    this.loading_data = true;
  }

  ngOnInit() {
    document.getElementById('page-container')?.classList.add('max-width-100');
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.current_user = JSON.parse(JSON.stringify(data));
        this.initApi();
      }
    });
  }

  initApi() {
    forkJoin([
      this.http.get('EmbedReport'),
      this.http.get('EmbedReports/DefaultConfiguration'),
    ]).subscribe(
      ([response1, response2]) => {
        this.reports = response1;
        this.defaultConfig = response2;
        this.loading_data = false;
      },
      (error) => {
        this.loading_data = false;
      }
    );
  }

  resetSelections() {
    for (var page of this.export_options.pages) {
      page.doExport = false;
    }
  }

  showBookmarks() {
    this.isExportPopoverOpen = false;
    this.isCustomViewPopoverOpen = !this.isCustomViewPopoverOpen;
  }

  showExports() {
    this.isCustomViewPopoverOpen = false;
    this.isExportPopoverOpen = !this.isExportPopoverOpen;
  }

  getSavedViews(id) {
    this.http
      .get('PowerBIViews', { params: { report_id: id } })
      .subscribe((response: any[]) => {
        this.setCustomViewGroups(response);
      });
  }

  setCustomViewGroups(apiResponse: any[]) {
    this.customViewGroups = [];
    apiResponse
      .filter((item) => !item.parent_id)
      .forEach((customViewGroup) => {
        customViewGroup.customViews = apiResponse.filter(
          (item) => item.parent_id === customViewGroup.id
        );
        customViewGroup.isOpen = false;
        this.customViewGroups.push(customViewGroup);
      });
  }

  confirmDelete(customViewGroup, customView = null) {
    let title = 'Are you sure you want to delete this group?';
    let id = customViewGroup.id;
    if (customView) {
      title = 'Are you sure you want to delete this view?';
      id = customView.id;
    }
    this.SweetAlert.confirm({
      title: title,
      text: customView
        ? ''
        : 'The saved views in the group will also be deleted!',
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.deleteView(id, resolve).subscribe(() => {
            if (customView) {
              this.removeCustomViewFromGroup(customView);
            } else {
              this.removeCustomViewGroup(customViewGroup.id);
            }
            this.toaster.success(
              '',
              `${customView ? 'View' : 'Group'} deleted successfully`
            );
          });
        });
      },
    }).then(() => {
      swal.close();
    });
  }

  deleteView(id, resolve) {
    return this.http
      .delete(`powerbi_views/${id}`)
      .pipe(finalize(() => resolve()));
  }

  loadView(view) {
    if (view.state) {
      this.loading_report = true;
      this.reportObj
        .getReport()
        .bookmarksManager.applyState(view.state)
        .then((res) => {
          if (this.selectedReport.rlS_enabled) {
            this.setSlicers(false).then(() =>
              setTimeout(() => (this.loading_report = false), 500)
            );
          } else {
            this.loading_report = false;
          }
        });
      this.isCustomViewPopoverOpen = false;
    }
  }

  showSavePopup(customView = null) {
    this.customModalService.invoke('powerbi-create-customview', {
      initialState: {
        customView,
        customViewGroups: this.customViewGroups,
        reportObj: this.reportObj,
        reportId: this.selectedReport.report_id,
        onSave: (response) => {
          if (response.customViewGroup) {
            this.addCustomViewGroup(response.customViewGroup);
          }
          if (customView) {
            customView.name = response.customView.name;

            if (customView.parent_id != response.customView.parent_id) {
              this.removeCustomViewFromGroup(customView);
              this.addCustomViewToGroup(
                response.customView,
                response.customView.parent_id
              );
            }
            this.toaster.success('', `View updated successfully`);
          } else {
            this.addCustomViewToGroup(
              response.customView,
              response.customView.parent_id
            );
            this.toaster.success('', `View added successfully`);
          }
        },
      },
    });
  }

  handleCustomViewGroupOpen(id) {
    this.customViewGroups.forEach(
      (customViewGroup) =>
        // opening the selected custom view group, and closing all others
        (customViewGroup.isOpen =
          !customViewGroup.isOpen && customViewGroup.id === id)
    );
  }

  handleExportPageOpen(name) {
    this.export_options.pages.forEach(
      (page) =>
        // opening the selected page, and closing all others
        (page.isOpen = !page.isOpen && page.name === name)
    );
  }

  addCustomViewGroup(customViewGroup) {
    this.customViewGroups.push({
      ...customViewGroup,
      customViews: [],
      isOpen: false,
    });
  }

  addCustomViewToGroup(customView, groupId) {
    let customViewGroup = this.customViewGroups.find(
      (group) => group.id === groupId
    );

    customViewGroup.customViews.push(customView);
  }

  removeCustomViewFromGroup(customView) {
    let customViewGroup = this.customViewGroups.find(
      (group) => group.id === customView.parent_id
    );
    customViewGroup.customViews.splice(
      customViewGroup.customViews.findIndex(
        (view) => view.id === customView.id
      ),
      1
    );
  }

  removeCustomViewGroup(id) {
    let index = this.customViewGroups.findIndex((group) => group.id === id);

    this.customViewGroups.splice(index, 1);
  }

  saveCustomViewGroup(customViewGroup = null) {
    this.customModalService.invoke('powerbi-create-customview-group', {
      initialState: {
        customViewGroup,
        reportId: this.selectedReport.report_id,
        onSave: (response) => {
          if (customViewGroup) {
            let customViewGroup = this.customViewGroups.find(
              (group) => group.id === response.id
            );

            customViewGroup.name = response.name;
            this.toaster.success('', `Group updated successfully`);
          } else {
            this.addCustomViewGroup(response);
            this.toaster.success('', `Group added successfully`);
          }
        },
      },
    });
  }

  loadSelectedReport() {
    setTimeout(() => {
      this.loading_data = true;
      this.export_options.pages = [];
      this.isExportPopoverOpen = false;
      this.isCustomViewPopoverOpen = false;
      this.enableExport = false;
      this.downloadingPdf = false;
      let params = {
        report_id: this.selectedReport.report_id,
        workspace_id: this.selectedReport.workspace_id,
        dataset_id: this.selectedReport.dataset_id,
      };
      this.http.get('EmbedReport', { params: params }).subscribe(
        (response) => {
          this.loadReport(response);
          this.getSavedViews(this.selectedReport.report_id);
          this.isCustomViewPopoverOpen = false;
          this.loading_data = false;
        },
        (error) => {
          this.loading_data = false;
        }
      );
    }, 0);
  }

  async loadExportPages() {
    let pages = await this.getReportPages();
    pages = pages.filter(
      (page) =>
        !page.displayName.toLowerCase().includes('hidden') &&
        !page.displayName.toLowerCase().includes('details')
    );
    let exportList = [];
    pages.forEach((page) => {
      exportList.push({
        name: page.name,
        displayName: page.displayName,
        doExport: false,
        isOpen: false,
      });
    });
    this.export_options.pages = exportList;
  }

  loadReport(data) {
    this.loading_report = true;
    let embedData = JSON.parse(data);
    this.report_config = {
      type: 'report',
      tokenType: this.models.TokenType.Embed,
      accessToken: embedData.EmbedToken.token,
      embedUrl: embedData.EmbedReports[0].EmbedUrl,
      settings: {
        panes: {
          pageNavigation: {
            visible: true,
            position: this.models.PageNavigationPosition.Left,
          },
        },
        bars: {
          actionBar: {
            visible: true,
          },
        },
      },
    };

    this.report_events = new Map([
      [
        'loaded',
        () => {
          this.loadExportPages();
          if (this.selectedReport.rlS_enabled) {
            this.setSlicers(true).then(() =>
              setTimeout(() => (this.loading_report = false), 500)
            );
          } else {
            this.loading_report = false;
          }
        },
      ],
    ]);

    this.setAutoRefreshEmbedToken(this.selectedReport.report_id);
  }

  setAutoRefreshEmbedToken(reportId) {
    this.refreshEmbedToken$?.unsubscribe();
    this.refreshEmbedToken$ = interval(1000 * 60 * 55).subscribe(async () => {
      // automatically fetch a new embed token from API every 55 minutes and set it on the report
      // the powerbi embed tokens expire after an hour, and if a new token is not set, any further actions on the dashboard give 401
      // refs: DV-6980
      try {
        let report = this.reportObj?.getReport();
        if (
          report &&
          this.selectedReport &&
          this.selectedReport.report_id == reportId // ensuring that the same report is still active on the browser
        ) {
          let params = {
            report_id: this.selectedReport.report_id,
            workspace_id: this.selectedReport.workspace_id,
            dataset_id: this.selectedReport.dataset_id,
          };
          let response = await this.http
            .get('EmbedReport', { params: params })
            .toPromise();
          let embedData = JSON.parse(String(response));
          report.setAccessToken(embedData.EmbedToken.token);
        }
      } catch (ex) {
        this.errorHandler.handleError(ex, {
          source: 'Advanced reports automated token refresh error',
        });
      }
    });
  }

  getReportPages() {
    const report = this.reportObj.getReport();
    const pages = report.getPages();
    return pages;
  }

  async exportReports() {
    let pages = this.export_options.pages
      .filter((page) => page.doExport)
      .map((page) => {
        return {
          name: page.name,
          display_name: page.displayName,
        };
      });

    let state = (
      await this.reportObj
        .getReport()
        .bookmarksManager.capture({ allPages: true })
    ).state;
    let params = {
      format: this.export_options.fileTypes.selectedType,
      pages: pages,
      page_bookmark: state,
      report_id: this.selectedReport.report_id,
      dashboard_name: this.selectedReport.report_name,
    };
    this.downloadingPdf = true;
    this.toaster.info(
      'You can keep exploring the dashboard while the file(s) download in your browser. Large exports will be sent to you via email.',
      'Downloading File...',
      {
        timeOut: 0,
      }
    );
    this.http
      .post(`EmbedReports/${this.selectedReport.report_id}/export`, params, {
        responseType: 'arraybuffer',
        observe: 'response',
      })
      .subscribe(
        (response: any) => {
          this.toaster.clear();
          if (response?.status == HttpStatusCode.NoContent) {
            this.toaster.success(
              '',
              'The export request is taking longer than expected. You will receive an email with the exported report'
            );
          } else {
            this.processDownload(response);
          }
          this.downloadingPdf = false;
          this.isExportPopoverOpen = false;
          this.resetSelections();
        },
        (error) => {
          this.toaster.clear();
          this.downloadingPdf = false;
          this.isExportPopoverOpen = false;
        }
      );
  }

  processDownload(response) {
    let blob: any, ex: any;
    const octetStreamMime = 'application/octet-stream';
    let success = false;
    // Get the filename from the x-filename header or default to "download.bin"
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename_from_header = contentDisposition
      .split(';')[1]
      .split('filename')[1]
      .split('=')[1]
      .replaceAll('"', '')
      .trim();
    const filename = filename_from_header || 'download.xlsx';
    // Determine the content type from the header or default to "application/octet-stream"
    const contentType = response.headers.get('content-type') || octetStreamMime;
    try {
      // Try using msSaveBlob if supported
      blob = new Blob([response.body], { type: contentType });
      if (this.Navigator.msSaveBlob) {
        this.Navigator.msSaveBlob(blob, filename);
      } else {
        // Try using other saveBlob implementations, if available
        const saveBlob =
          this.Navigator.webkitSaveBlob ||
          this.Navigator.mozSaveBlob ||
          this.Navigator.saveBlob;
        if (!saveBlob) {
          throw 'Not supported';
        }
        saveBlob(blob, filename);
      }
      success = true;
    } catch (error) {
      ex = error;
    }
    if (!success) {
      // Get the blob url creator
      const urlCreator =
        this.Window.URL ||
        this.Window.webkitURL ||
        this.Window.mozURL ||
        this.Window.msURL;
      if (urlCreator) {
        // Try to use a download link
        let url: any;
        const link = document.createElement('a');
        if ('download' in link) {
          // Try to simulate a click
          try {
            // Prepare a blob URL
            blob = new Blob([response.body], { type: contentType });
            url = urlCreator.createObjectURL(blob);
            link.setAttribute('href', url);
            // Set the download attribute (Supported in Chrome 14+ / Firefox 20+)
            link.setAttribute('download', filename);
            // Simulate clicking the download link
            const event = document.createEvent('MouseEvents');
            event.initMouseEvent(
              'click',
              true,
              true,
              window,
              1,
              0,
              0,
              0,
              0,
              false,
              false,
              false,
              false,
              0,
              null
            );
            link.dispatchEvent(event);
            success = true;
          } catch (error1) {
            ex = error1;
          }
        }
        if (!success) {
          // Fallback to window.location method
          try {
            // Prepare a blob URL
            // Use application/octet-stream when using window.location to force download
            blob = new Blob([response.body], { type: octetStreamMime });
            url = urlCreator.createObjectURL(blob);
            window.location = url;
            success = true;
          } catch (error2) {
            ex = error2;
          }
        }
      }
    }
    if (!success) {
      // Fallback to window.open method
      // TODO: define httpPath
      /* const popup = window.open(httpPath, '_blank', '');
            PopupCheckerService.check(popup); */
    }
  }

  setSlicers(setAsOfDateSlicer = true) {
    let currentUserId = this.current_user.id;
    let userFilter = {
      $schema: 'http://powerbi.com/product/schema#basic',
      target: {
        table: 'User',
        column: 'ID',
      },
      operator: 'In',
      values: [`${currentUserId}`],
      filterType: this.models.FilterType.BasicFilter,
      requireSingleSelection: true,
    };

    let dateFilter = {
      $schema: 'http://powerbi.com/product/schema#basic',
      target: {
        table: 'N Month',
        column: 'Number',
      },
      operator: 'In',
      values: ['' + this.defaultConfig.default_months],
      filterType: this.models.FilterType.BasicFilter,
      requireSingleSelection: true,
    };
    let promise = this.getReportPages();
    promise
      .then((pages) => {
        for (let page of pages) {
          page
            .getVisuals()
            .then((visuals: any) => {
              for (var visual of visuals) {
                ((visual) => {
                  if (visual.type === 'slicer') {
                    visual
                      .getSlicerState()
                      .then((slicer: { targets: { length?: any } }) => {
                        if (
                          slicer &&
                          slicer.targets &&
                          slicer.targets.length === 1 &&
                          slicer.targets[0].table === userFilter.target.table &&
                          slicer.targets[0].column === userFilter.target.column
                        ) {
                          visual.setSlicerState({
                            filters: [userFilter],
                          });
                        } else if (
                          setAsOfDateSlicer &&
                          slicer &&
                          slicer.targets &&
                          slicer.targets.length === 1 &&
                          slicer.targets[0].table === dateFilter.target.table &&
                          slicer.targets[0].column ===
                            dateFilter.target.column &&
                          (this.selectedReport.report_name
                            .toLowerCase()
                            .includes('diligence report') ||
                            this.selectedReport.report_name
                              .toLowerCase()
                              .includes('requestor diligence dashboard') ||
                            this.selectedReport.report_name
                              .toLowerCase()
                              .includes('response charting & benchmarking')) // this default date range needs to be applied only for diligence report for the time being
                        ) {
                          visual.setSlicerState({
                            filters: [dateFilter],
                          });
                        }
                      })
                      .catch((error: any) => {});
                  }
                })(visual);
              }
            })
            .catch((error: any) => {});
        }
      })
      .catch((error: any) => {});
    return promise;
  }

  closePopover(popoverName) {
    if (popoverName === 'bookmark') {
      this.bookmarkPopover?.hide();
    }
  }

  ngOnDestroy(): void {
    document
      .getElementById('page-container')
      ?.classList.remove('max-width-100');
    this.refreshEmbedToken$?.unsubscribe();
  }

  handleExportSelectionChange(isSelected, page) {
    page.doExport = isSelected;
    page.isPartialSelected = false;
    this.enableExport = this.export_options.pages.some((page) => page.doExport);
  }
}
