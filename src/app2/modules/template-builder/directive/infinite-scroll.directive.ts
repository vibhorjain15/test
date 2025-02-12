import {
  Directive,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

/**
 * This directive will add infinite scrolling to page
 *
 * The items are fetched from the backend if the [[isServerSide]] property is true
 *
 * Usage:
 * 1. UI side rendering
 * <dv-infinite-scroll
    [currentPage]="currentPage"
    [data]="data"
    (handleQuestionListScroll)="handleQuestionListScroll($event)"
  ></dv-infinite-scroll>
 * 2. Server side rendering
  <dv-infinite-scroll
    [isServerSide]="true"
    (handleQuestionListScroll)="handleQuestionListScroll($event)"
  >
  </dv-infinite-scroll>
 * Inputs:
 * - currentPage: number - the current page number will increase on scroll
 * - pageLimit: number - limit of page in list
 * - data: array - list of available data
 * - isServerSide: number - set true if server side rending is required
 *
 * Outputs:
 * - handleQuestionListScroll: EventEmitter<number> - an event that emits the
 */

@Directive({
  selector: 'dv-infinite-scroll',
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Input() currentPage = 1;
  @Input() pageLimit = 50;
  @Input() triggerOffset = 250;
  @Input() data = [];
  @Input() id = null;
  @Input() isServerSide: any = false;
  @Output() handleQuestionListScroll = new EventEmitter();

  private scrollEv$: Subscription;

  constructor() {}

  ngOnInit(): void {
    let scrollContainer: any = document.getElementById(this.id);
    if (!scrollContainer) scrollContainer = window;
    let lastScrollTop = 0;
    let hasReachedThreshold = false;
    this.scrollEv$ = fromEvent(scrollContainer, 'scroll')
      .pipe(
        map(() => (this.id ? scrollContainer.scrollTop : window.screenTop)),
        tap(() => {
          const { scrollTop, scrollHeight, clientHeight } = this.id
            ? (scrollContainer as HTMLElement)
            : document.documentElement;
          if (scrollTop > lastScrollTop) {
            // scrolling down
            if (
              this.isServerSide &&
              scrollTop + clientHeight >= scrollHeight - this.triggerOffset &&
              !hasReachedThreshold
            ) {
              this.emitScrollEvent();
              hasReachedThreshold = true;
              setTimeout(() => {
                hasReachedThreshold = false;
              }, 100);
            } else {
              if (
                scrollTop + clientHeight >= scrollHeight - this.triggerOffset &&
                this.hasMoreRows()
              ) {
                this.emitScrollEvent();
              }
            }
          } else {
            hasReachedThreshold = false; // Reset flag when scrolling up
          }

          lastScrollTop = scrollTop; // Update lastScrollTop for next event
        })
      )
      .subscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.pageNumber?.currentValue === 1) {
      window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
      this.currentPage = 1;
    }
  }

  ngOnDestroy(): void {
    this.currentPage = 1;
    this.data = [];
    if (this.scrollEv$) {
      this.scrollEv$.unsubscribe();
    }
  }

  private emitScrollEvent() {
    this.handleQuestionListScroll.emit({
      currentPage: this.currentPage + 1,
      limit: this.pageLimit,
    });
  }

  private hasMoreRows(): boolean {
    return this.currentPage * this.pageLimit < this.data.length;
  }
}
