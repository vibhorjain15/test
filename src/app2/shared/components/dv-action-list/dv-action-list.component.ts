import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { BsDropdownDirective } from 'ngx-bootstrap/dropdown';

import { positionedOffset } from './dv-action-list.util';
import { IDVActionList, IDVActionListItem } from './dv-action-list.model';

@Component({
  selector: 'dv-action-list',
  templateUrl: './dv-action-list.component.html',
  styleUrls: ['./dv-action-list.component.css'],
})
export class DVActionListComponent implements OnInit, OnChanges, AfterViewInit {
  @Input('actionList') actionList: IDVActionList;

  @Output() onClick: EventEmitter<IDVActionListItem> =
    new EventEmitter<IDVActionListItem>();

  @ViewChild('actionListElement', { static: true })
  actionListElement: ElementRef<HTMLElement>;

  @ViewChild('bsDropDown', { static: true })
  bsDropDown: BsDropdownDirective;

  @HostListener('window:resize')
  onWindowResize(): void {
    this.calculateVisibility(this.actionListElement.nativeElement);
  }

  ngOnInit(): void {
    this.buildIdentifiers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.actionList.isFirstChange()) {
      this.buildIdentifiers();
      setTimeout(() =>
        this.calculateVisibility(this.actionListElement.nativeElement)
      );
    }
  }

  ngAfterViewInit(): void {
    this.calculateVisibility(this.actionListElement.nativeElement);
  }

  //#region Handlers

  clickHandler(config: IDVActionListItem): void {
    if (config.isDisabled) {
      return;
    }

    this.onClick.emit(config);
  }

  //#endregion

  //#region Dropdown manager

  onDropdownStateChange(isOpen: boolean): void {
    if (isOpen) {
      setTimeout(() => {
        this.calculateVisibility(this.actionListElement.nativeElement);
        this.toggleDropdownMenuVisiblity(isOpen);
      });
    }
  }

  private hideDropdown(): void {
    this.bsDropDown.hide();
  }

  private toggleDropdownMenuVisiblity(isVisibile: boolean): void {
    const dropdownMenu = document.querySelector<HTMLElement>(
      '.js-responsive-actionlist-dropdown-menu'
    );
    if (dropdownMenu instanceof HTMLElement) {
      dropdownMenu.style.visibility = isVisibile ? '' : 'hidden';
    }
  }

  //#endregion

  //#region Action item visibility handler

  private buildIdentifiers(): void {
    const prefix = this.actionList.context?.constructor.name ?? 'action-list';
    this.actionList.actionItems.forEach((item: IDVActionListItem) => {
      item.identifier = `${prefix}-${Math.random().toString(16).slice(2)}`;
    });
  }

  private toggleItem(item: HTMLElement, hidden: boolean) {
    // Set visibilityto hidden, instead of .hidden attribute
    // so we can still calculate distance accurately
    item.style.visibility = hidden ? 'hidden' : '';
    // Get tab-itemname, if present, so we can match it up with the dropdown menu
    const itemName = item.getAttribute('data-tab-item');
    if (itemName) {
      const itemToHide = document.querySelector<HTMLElement>(
        `[data-menu-item=${itemName}]`
      );
      if (itemToHide instanceof HTMLElement) {
        itemToHide.hidden = !hidden;
      }
    }
  }

  private calculateVisibility(actionList: HTMLElement) {
    const listContainer = actionList.querySelector<HTMLElement>(
      '.js-responsive-actionlist'
    );
    const items = actionList.querySelectorAll<HTMLElement>(
      '.js-responsive-actionlist-item'
    );
    const overflowContainer = actionList.querySelector<HTMLElement>(
      '.js-responsive-actionlist-overflow'
    )!;
    const lastItemIndex = items.length - 1;
    const listContainerOffset = positionedOffset(listContainer, actionList);
    const overflowOffset = positionedOffset(overflowContainer, actionList);

    if (!overflowOffset) {
      return;
    }

    let anyHidden = false;
    let isLastItemHidden = false;
    // Check the last item's visiblity first,
    // in-order to be sure of to hide subsequent items or not.
    for (let index = items.length - 1; index >= 0; index--) {
      const item = items[index];
      const isLastItem = index === lastItemIndex;
      const itemOffset = positionedOffset(item, actionList);
      if (itemOffset) {
        let hidden = false;
        if (isLastItem) {
          hidden =
            itemOffset.left + item.offsetWidth >
            listContainerOffset.left + actionList.offsetWidth;
          isLastItemHidden = hidden;
        } else {
          hidden =
            isLastItemHidden &&
            itemOffset.left + item.offsetWidth >= overflowOffset.left;
        }

        this.toggleItem(item, hidden);
        anyHidden = anyHidden || hidden;
      }
    }

    overflowContainer.style.visibility = anyHidden ? '' : 'hidden';
    if (!anyHidden) {
      this.hideDropdown(); // hide the dropdown if its open.
    }
  }

  //#endregion
}
