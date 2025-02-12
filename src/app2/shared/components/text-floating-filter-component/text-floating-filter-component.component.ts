import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { AgFloatingFilterComponent } from 'ag-grid-angular';
import {
  FilterChangedEvent,
  IFloatingFilterParams,
  IAfterGuiAttachedParams,
} from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { GridService } from 'src/app2/services/grid.service';

@Component({
  selector: 'app-text-floating-filter-component',
  templateUrl: './text-floating-filter-component.component.html',
  styleUrls: ['./text-floating-filter-component.component.css'],
})
export class TextFloatingFilterComponent
  implements AgFloatingFilterComponent, OnDestroy
{
  params;
  currentValue: string = '';
  placeHolder = '';
  @ViewChild('search', { static: true }) searchElement: ElementRef;
  subscription: Subscription;

  constructor(private readonly gridService: GridService) {}

  onParentModelChanged(
    parentModel: any,
    filterChangedEvent?: FilterChangedEvent
  ): void {
    // When the filter is empty we will receive a null value here
    if (!parentModel) {
      this.currentValue = '';
    } else {
      this.currentValue = parentModel.filter;
    }
  }
  agInit(params: IFloatingFilterParams): void {
    this.initialize(params);
  }

  initialize(params) {
    this.params = params;
    this.placeHolder = this.params.placeHolder;
    this.subscribeToclearFilterTrigger();
  }

  subscribeToclearFilterTrigger() {
    this.subscription = this.gridService.clearFilterTriggered$.subscribe(() => {
      this.clearFilter();
    });
  }

  afterGuiAttached?(params?: IAfterGuiAttachedParams): void {}
  onInputBoxChanged() {
    if (this.params.onSearch) {
      this.params.onSearch(this.currentValue);
    }
    if (!this.currentValue) {
      // clear the filter
      this.params.parentFilterInstance((instance: any) => {
        instance.onFloatingFilterChanged(null, null);
      });
      return;
    }
    this.params.parentFilterInstance((instance: any) => {
      instance.onFloatingFilterChanged('contains', this.currentValue);
    });
    setTimeout(() => this.searchElement.nativeElement.focus());
  }

  clearFilter() {
    // clear the filter
    this.currentValue = '';
    this.params.parentFilterInstance((instance: any) => {
      instance.onFloatingFilterChanged(null, null);
    });
  }

  refresh(params: IFloatingFilterParams): void {
    this.initialize(params);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
