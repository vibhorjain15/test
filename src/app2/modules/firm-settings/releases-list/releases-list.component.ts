import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import {
  ColDef,
  ICellRendererParams,
  ValueGetterParams,
} from 'ag-grid-community';

import { RouterService } from 'src/app2/services/router.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { IReleaseDetail } from 'src/app2/shared/models/releases.model';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ReleasesService } from 'src/app2/services/releases/releases.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';
import { PanelControl } from 'src/app2/shared/components/dv-panel-heading/dv-panel-heading.component';

import { DvDatePipe } from 'src/app2/shared/pipes/dv-date.pipe';
@Component({
  selector: 'app-releases-list',
  templateUrl: './releases-list.component.html',
  styleUrls: ['./releases-list.component.css'],
})
export class ReleasesListComponent implements OnInit {
  gridName: string = 'releasesList';
  releases: Array<IReleaseDetail>;
  panelHeadingControls: PanelControl[] = [];
  constructor(
    private readonly store: Store,
    private readonly dvDatePipe: DvDatePipe,
    private readonly toastrService: ToastrService,
    private readonly routerService: RouterService,
    private readonly releasesService: ReleasesService,
    private readonly sweetAlertService: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.initGridCols();
    this.setPanelHeadingControls();
  }

  addReleaseNote(): void {
    this.routerService.navigate(`app.firm.settings.releases.add`);
  }

  setPanelHeadingControls() {
    this.panelHeadingControls = [
      {
        text: 'Add New',
        handleClick: this.addReleaseNote.bind(this),
        tooltip: 'Create New Release',
        leftIcon: 'plus',
      },
    ];
  }

  private initGridCols(): void {
    const defaultColumnDefs: Array<ColDef> = [];
    defaultColumnDefs.push(
      ...[
        {
          ...defaultColumn,
          colId: 'action',
          headerName: 'Actions',
          field: 'action',
          minWidth: grid_widths_map.sm_column_xm,
          cellRenderer: 'releasesActionCellRenderer',
          cellRendererParams: {
            clickedMarkAsFinal: (data: IReleaseDetail) => {
              this.markAsFinal(data);
            },
            clickedEdit: (data: IReleaseDetail) => {
              this.edit(data);
            },
            clickedDelete: (data: IReleaseDetail) => {
              this.delete(data);
            },
          },
          sortable: false,
        },
        {
          ...defaultColumn,
          colId: 'release_date',
          headerName: 'Release Date',
          field: 'release_date',
          valueGetter: (params: ValueGetterParams) =>
            this.dvDatePipe.transform(params.data.release_date, [
              'isLocaleDate',
            ]),
          minWidth: grid_widths_map.sm_column_xm,
          suppressColumnsToolPanel: true,
        },
        {
          ...defaultColumn,
          colId: 'title',
          headerName: 'Release Title',
          field: 'title',
          minWidth: grid_widths_map.sm_column_lg,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          floatingFilterComponent: 'textFloatingFilterComponent',
          floatingFilterComponentParams: {
            suppressFilterButton: true,
            placeHolder: 'Search by Release Title',
          },
        },
        {
          ...defaultColumn,
          colId: 'description',
          headerName: 'Description',
          field: 'description',
          cellRenderer: 'releaseNotesDescriptionTemplateCellRenderer',
          minWidth: grid_widths_map.lg_column_sm,
        },
        {
          ...defaultColumn,
          colId: 'image_urls',
          headerName: '# of Image(s)',
          field: 'image_urls',
          valueGetter: (params: ValueGetterParams) =>
            params.data.image_urls?.length ?? 0,
          minWidth: grid_widths_map.sm_column_xm,
        },
        {
          ...defaultColumn,
          colId: 'faq_url',
          headerName: 'FAQ URL',
          field: 'faq_url',
          cellRenderer: (params: ICellRendererParams) =>
            params.data.faq_url
              ? `<a href="${params.data.faq_url}" target="_blank" rel="noopener noreferrer">${params.data.faq_url}</a>`
              : `N/A`,
          minWidth: grid_widths_map.sm_column_lg,
        },
        {
          ...defaultColumn,
          colId: 'video_url',
          headerName: 'Video URL',
          field: 'video_url',
          cellRenderer: (params: ICellRendererParams) =>
            params.data.video_url
              ? `<a href="${params.data.video_url}" target="_blank" rel="noopener noreferrer">${params.data.video_url}</a>`
              : `N/A`,
          minWidth: grid_widths_map.sm_column_lg,
        },
        {
          ...defaultColumn,
          colId: 'storylane_url',
          headerName: 'Storylane URL',
          field: 'storylane_url',
          cellRenderer: (params: ICellRendererParams) =>
            params.data.storylane_url
              ? `<a href="${params.data.storylane_url}" target="_blank" rel="noopener noreferrer">${params.data.storylane_url}</a>`
              : `N/A`,
          minWidth: grid_widths_map.sm_column_lg,
        },
        {
          ...defaultColumn,
          colId: 'created_by_name',
          headerName: 'Created By',
          field: 'created_by_name',
          minWidth: grid_widths_map.sm_column_lg,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          floatingFilterComponent: 'textFloatingFilterComponent',
          floatingFilterComponentParams: {
            suppressFilterButton: true,
            placeHolder: 'Search by creator name',
          },
        },
      ]
    );

    this.store
      .dispatch(new SetDefaultColumnDef({ [this.gridName]: defaultColumnDefs }))
      .subscribe((_) => {
        this.initGrid();
      });
  }

  private initGrid(): void {
    this.releasesService.getReleases().subscribe({
      next: (releases) => (this.releases = releases),
      error: (error: any) => this.toastrService.error('An error occurred.', ''),
    });
  }

  private markAsFinal(releaseDetail: IReleaseDetail): void {
    if (!releaseDetail.is_draft) {
      return; // already released.
    }

    releaseDetail.is_draft = false;
    this.releasesService
      .update(releaseDetail.id, releaseDetail)
      .subscribe((response: IReleaseDetail) => {
        this.toastrService.success('Release note published successfully.');
      });
  }

  private edit(releaseDetail: IReleaseDetail): void {
    this.routerService.navigateWithParams(
      'app.firm.settings.releases.details',
      {
        releaseId: releaseDetail.id,
      }
    );
  }

  private delete(releaseDetail: IReleaseDetail): void {
    const title = `Are you sure you want to delete - ${releaseDetail.title}?`;
    const text = 'This will permanently delete the release note.';
    this.sweetAlertService.confirm({
      title,
      text,
      confirmButtonText: 'Yes, Delete',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.releasesService.delete(releaseDetail.id).subscribe((res) => {
          this.releases = this.releases.filter(
            (release) => release.id !== releaseDetail.id
          );
          this.sweetAlertService.close();
        });
      },
    });
  }
}
