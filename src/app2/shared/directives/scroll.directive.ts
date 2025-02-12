import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ScrollTopButtonService } from '../components/scroll-top-button/scroll-top-button.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[dvScroll]',
})
export class VirtualScrollDirective implements OnChanges, OnInit, OnDestroy {
  @Input() items: any[];
  @Input() itemHeight = 20;
  @Input() loadingItems = 20; // The number of questions rendered int he dom will always be double this limit for smoother scroll experience experience
  //Lower limit is 20 below which this will start to break or not work properly
  @Input() isInfiniteScroll = true;
  @Input() uniqueKey = 'id';
  @Input() scrollToIndex;
  @Output() onChange = new EventEmitter();
  visibleItems: any[] = [];
  scrollTop = 0;
  offsetY: any;
  startNode = 0;
  endNode = this.loadingItems;
  subscription: Subscription;
  private previousScrollPosition = 0;
  constructor(
    private scrollTopService: ScrollTopButtonService
  ) {}

  ngOnInit(): void {
    this.subscription = this.scrollTopService.onScrollUp.subscribe((event) => {
      this.startNode = 0;
      this.endNode = this.loadingItems;
      this.visibleItems = [...this.items.slice(this.startNode, this.endNode)];
      this.onChange.emit({ list: this.visibleItems, css: 0 });
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.items &&
      changes.items.currentValue !== changes.items.previousValue
    ) {
      if (this.isInfiniteScroll) {
        this.updateVisibleItemsByInfiniteLoading(true);
      } else {
        this.updateVisibleItems();
      }
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: any) {
    const currentScrollPosition = window.scrollY;
    let scrollDown = currentScrollPosition > this.previousScrollPosition;
    let scrollPix = event.target.scrollingElement.scrollTop;
    this.scrollTop = scrollPix;
    if (this.isInfiniteScroll) {
      this.updateVisibleItemsByInfiniteLoading(scrollDown);
    } else {
      this.updateVisibleItems();
    }
    this.previousScrollPosition = currentScrollPosition;
  }

  // not getting used for now: Virtual scroll logic for fixed height
  private updateVisibleItems() {
    let questionContainer = (document as any).getElementById(
      'question-card-wrapper'
    );
    questionContainer.style.height = `${this.itemHeight * this.items.length}px`;
    let element = (document as any).body;
    element.style.height = `${this.itemHeight * this.items.length}px`;
    let itemCount = this.items.length;
    let startNode = Math.floor(this.scrollTop / this.itemHeight);
    startNode = Math.max(0, startNode);
    let visibleNodesCount = Math.ceil(window.innerHeight / this.itemHeight);
    visibleNodesCount = Math.min(itemCount - startNode, visibleNodesCount);
    this.offsetY = startNode * 20;
    this.visibleItems = this.items.slice(
      startNode,
      startNode + visibleNodesCount
    );
    this.onChange.emit({ list: this.visibleItems, css: this.offsetY });
  }

  private updateVisibleItemsByInfiniteLoading(scrollDown) {
    let id = this.visibleItems[this.visibleItems.length - 5]?.[this.uniqueKey];
    let idTop = this.visibleItems[5]?.[this.uniqueKey];
    if (!this.visibleItems.length) {
      this.visibleItems = [
        ...this.items.slice(0, Math.min(this.items.length, this.endNode)),
      ];
      this.onChange.emit({ list: this.visibleItems, css: 0 });
    } else {
      this.visibleItems = [
        ...this.items.slice(
          this.startNode,
          Math.min(this.items.length, this.endNode)
        ),
      ];
    }

    // This condition is to check if there is autoscroll requested by the parent if yes
    // then find the required slot in which that question will belong to and render it in DOM
    if (this.scrollToIndex && this.scrollToIndex > this.loadingItems) {
      let requiredSlotToLoad = Math.floor(
        this.scrollToIndex / (this.loadingItems * 2)
      );
      this.startNode = this.loadingItems * 2 * requiredSlotToLoad;
      this.endNode = this.startNode + 2 * this.loadingItems;
      this.visibleItems = [...this.items.slice(this.startNode, this.endNode)];
      this.onChange.emit({ list: this.visibleItems, css: 0 });
      this.scrollToIndex = null;
      return;
    }

    // This block handles scroll down event and do required operation
    if (idTop && !scrollDown) {
      const elementTop = document.getElementById(idTop);
      const rect = elementTop?.getBoundingClientRect();
      if (
        elementTop &&
        ((rect.bottom > 0 && rect.top > 0) ||
          this.scrollEndFinder().isScrollToTop) &&
        this.startNode
      ) {
        this.startNode = Math.max(this.startNode - this.loadingItems, 0);

        this.endNode = Math.max(
          this.endNode - this.loadingItems,
          this.loadingItems
        );
        this.visibleItems = [...this.items.slice(this.startNode, this.endNode)];
        if (this.scrollEndFinder().isScrollToTop) {
          this.scrollTopService.scrollToTop.emit();
        }
      }
    } else if (id && scrollDown) {
      // This block handles scroll up event and do required operation
      const element = document.getElementById(id);

      const rect = element?.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (
        element &&
        ((rect.top < windowHeight && rect.bottom > 0) ||
          this.scrollEndFinder().isScrollToBottom)
      ) {
        if (
          this.endNode > this.loadingItems &&
          this.endNode < this.items.length
        )
          this.startNode = this.startNode + this.loadingItems;

        if (this.endNode < this.items.length)
          this.endNode = this.endNode + this.loadingItems;

        this.visibleItems = [...this.items.slice(this.startNode, this.endNode)];
      }
    } else {
      this.visibleItems = [...this.items.slice(this.startNode, this.endNode)];
    }

    this.onChange.emit({ list: this.visibleItems, css: 0 });
  }

  scrollEndFinder() {
    let distanceToBottom =
      document.documentElement.scrollHeight - window.innerHeight;
    let isScrollToBottom = Math.abs(window.scrollY - distanceToBottom) < 1;
    let isScrollToTop = window.scrollY == 0;
    return { isScrollToBottom, isScrollToTop };
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
