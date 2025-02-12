import { Component, OnDestroy } from '@angular/core';
import { IStatusPanelParams } from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { GridService } from 'src/app2/services/grid.service';

@Component({
  selector: 'pagination-bar-component',
  templateUrl: './pagination-bar.component.html',
})
export class PaginationBarComponent implements OnDestroy {
  private params: any;
  currentPage: number;
  totalPages: number;
  startCount: number;
  endCount: number;
  totalCount: number;
  isFirstPage: boolean = true;
  isLastPage: boolean;
  gridPageSize;
  subscription: Subscription;
  pageSizeId=this.generateId('page-size');
  pageSizeSubscription: Subscription;

  constructor(private gridService: GridService) {}

  agInit(params: IStatusPanelParams): void {
    this.params = params;
    this.gridPageSize = params['gridPageSize'];
    this.subscribeToPaginationChanges();
    this.subscribeToPageSizeChanges();
  }

  subscribeToPageSizeChanges() {
    this.pageSizeSubscription = this.gridService.gridPageSizeChanged$.subscribe(
      (response) => {
        this.gridPageSize = response;
      }
    );
  }

  subscribeToPaginationChanges() {
    this.subscription = this.gridService.gridPaginationChanged$.subscribe(
      () => {
        this.currentPage = this.params.api.paginationGetCurrentPage() + 1;
        this.totalPages = this.params.api.paginationGetTotalPages() || 1;
        this.isFirstPage = this.currentPage === 1;
        this.isLastPage = this.currentPage === this.totalPages;
        this.totalCount = this.params.api.getDisplayedRowCount();
        const pageSize = this.params.api.paginationGetPageSize();
        if (this.totalCount) {
          this.startCount = pageSize * (this.currentPage - 1) + 1;
        } else {
          this.startCount = 0;
        }
        this.endCount = Math.min(this.totalCount, pageSize * this.currentPage);
      }
    );
  }

  onPageSizeChanged(newValue): void {
    this.params.onPageSizeChanged(newValue);
  }

  onFirstClicked() {
    this.params.onFirstClicked();
  }

  onLastClicked() {
    this.params.onLastClicked();
  }

  onPrevClicked() {
    this.params.onPrevClicked();
  }

  onNextClicked() {
    this.params.onNextClicked();
  }
  generateId(suffix: string): string {
    return `${suffix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
