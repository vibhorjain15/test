import { Component, OnDestroy, OnInit } from '@angular/core';
import { AgFloatingFilterComponent } from 'ag-grid-angular';
import {
  FilterChangedEvent,
  IFloatingFilterParams,
  IAfterGuiAttachedParams,
} from 'ag-grid-community';
import { Subscription } from 'rxjs';
import { GridService } from 'src/app2/services/grid.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-dropdown-floating-filter',
  templateUrl: './dropdown-floating-filter.component.html',
  styleUrls: ['./dropdown-floating-filter.component.css'],
})
export class DropdownFloatingFilterComponent
  implements AgFloatingFilterComponent, OnInit, OnDestroy
{
  params;
  currentValue: string = null;
  selectOptions = [];
  is_manager: boolean;
  subscription: Subscription;

  constructor(
    private readonly Utils: UtilsService,
    private readonly gridService: GridService
  ) {}
  ngOnInit(): void {
    this.is_manager = this.Utils.isManager();
    if (!this.selectOptions.length) {
      this.selectOptions = [
        { value: 'Project', label: 'Project' },
        { value: 'Product', label: 'Product' },
        {
          value: this.is_manager ? 'Investor' : 'Firm',
          label: this.is_manager ? 'Investor' : 'Firm',
        },
        { value: 'Template', label: 'Template' },
      ];
      if (this.is_manager) {
        this.selectOptions.unshift({ value: 'My Firm', label: 'My Firm' });
      }
    }
    this.subscribeToclearFilterTrigger();
  }

  subscribeToclearFilterTrigger() {
    this.subscription = this.gridService.clearFilterTriggered$.subscribe(() => {
      this.clearFilter();
    });
  }

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
    this.params = params;

    if (this.params?.selectOptions) {
      this.selectOptions = this.params.selectOptions;
    }
  }
  afterGuiAttached?(params?: IAfterGuiAttachedParams): void {}
  onFilterChange(data) {
    this.currentValue = data;
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
  }
  clearFilter() {
    // clear the filter
    this.currentValue = '';
    this.params?.parentFilterInstance((instance: any) => {
      instance?.onFloatingFilterChanged(null, null);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
