import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import {
  ColDef,
  ICellRendererParams,
  ValueGetterParams,
} from 'ag-grid-community';

import { RouterService } from 'src/app2/services/router.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { IBannerDetail } from 'src/app2/shared/models/banners.model';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { BannersService } from 'src/app2/services/banners/banners.service';
import {
  defaultColumn,
  grid_widths_map,
} from 'src/app2/shared/constants/constant';

@Component({
  selector: 'app-banners-list',
  templateUrl: './banners-list.component.html',
  styleUrls: ['./banners-list.component.css'],
})
export class BannersListComponent implements OnInit {
  gridName: string = 'bannersList';
  banners: Array<IBannerDetail>;

  constructor(
    private readonly store: Store,
    private readonly datePipe: DatePipe,
    private readonly toastrService: ToastrService,
    private readonly routerService: RouterService,
    private readonly bannersService: BannersService,
    private readonly sweetAlertService: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.initGridCols();
  }

  addBanner(): void {
    this.routerService.navigate(`app.firm.settings.banners.add`);
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
          cellRenderer: 'bannersActionCellRenderer',
          cellRendererParams: {
            clickedMarkAsFinal: (data: IBannerDetail) => {
              this.markAsFinal(data);
            },
            clickedEdit: (data: IBannerDetail) => {
              this.edit(data);
            },
            clickedDelete: (data: IBannerDetail) => {
              this.delete(data);
            },
          },
          sortable: false,
        },
        {
          ...defaultColumn,
          colId: 'probability',
          headerName: 'Probability',
          field: 'probability',
          cellRenderer: (params: ICellRendererParams) =>
            params.data.probability + '%',
          minWidth: grid_widths_map.sm_column_xxm,
          cellClass: 'text-center',
          sortable: true,
        },
        {
          ...defaultColumn,
          colId: 'banner_title',
          headerName: 'Banner Title',
          field: 'banner_title',
          minWidth: grid_widths_map.sm_column_lg,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          floatingFilterComponent: 'textFloatingFilterComponent',
          floatingFilterComponentParams: {
            suppressFilterButton: true,
            placeHolder: 'Search by banner title',
          },
        },
        {
          ...defaultColumn,
          colId: 'button_label',
          headerName: 'Button Label',
          field: 'button_label',
          minWidth: grid_widths_map.sm_column_lg,
          filter: 'agTextColumnFilter',
          floatingFilter: true,
          floatingFilterComponent: 'textFloatingFilterComponent',
          floatingFilterComponentParams: {
            suppressFilterButton: true,
            placeHolder: 'Search by button label',
          },
        },
        {
          ...defaultColumn,
          colId: 'banner_url',
          headerName: 'Image URL',
          field: 'banner_url',
          cellRenderer: (params: ICellRendererParams) =>
            params.data.banner_url
              ? `<a href="${params.data.banner_url}" target="_blank" rel="noopener noreferrer">${params.data.banner_url}</a>`
              : `N/A`,
          minWidth: grid_widths_map.sm_column_lg,
        },
        {
          ...defaultColumn,
          colId: 'redirect_url',
          headerName: 'Redirect URL',
          field: 'redirect_url',
          cellRenderer: (params: ICellRendererParams) =>
            params.data.redirect_url
              ? `<a href="${params.data.redirect_url}" target="_blank" rel="noopener noreferrer">${params.data.redirect_url}</a>`
              : `N/A`,
          minWidth: grid_widths_map.sm_column_lg,
        },
        {
          ...defaultColumn,
          colId: 'button_asset_url',
          headerName: 'Background Image URL',
          field: 'button_asset_url',
          cellRenderer: (params: ICellRendererParams) =>
            params.data.button_asset_url
              ? `<a href="${params.data.button_asset_url}" target="_blank" rel="noopener noreferrer">${params.data.button_asset_url}</a>`
              : `N/A`,
          minWidth: grid_widths_map.sm_column_lg,
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
    this.bannersService.getBanners().subscribe({
      next: (banners: any) => {
        this.banners = banners;
      },
      error: (error: any) => this.toastrService.error('An error occurred.', ''),
    });
  }

  private markAsFinal(bannerDetail: IBannerDetail): void {
    if (!bannerDetail.is_draft) {
      return; // already published.
    }

    bannerDetail.is_draft = false;
    this.bannersService
      .update(bannerDetail.id, bannerDetail)
      .subscribe((response: IBannerDetail) => {
        this.toastrService.success('Banner published successfully.');
      });
  }

  private edit(bannerDetail: IBannerDetail): void {
    this.routerService.navigateWithParams('app.firm.settings.banners.details', {
      bannerId: bannerDetail.id,
    });
  }

  private delete(bannerDetail: IBannerDetail): void {
    const title = `Are you sure you want to delete?`;
    const text = 'This will permanently delete the banner.';
    this.sweetAlertService.confirm({
      title,
      text,
      confirmButtonText: 'Yes, Delete',
      focusCancel: true,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        this.bannersService.delete(bannerDetail.id).subscribe((res) => {
          this.banners = this.banners.filter(
            (banner) => banner.id !== bannerDetail.id
          );
          this.sweetAlertService.close();
        });
      },
    });
  }
}
