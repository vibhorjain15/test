import { AfterViewInit, Component, ElementRef, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';

import { Subscription, fromEvent } from 'rxjs';

import { ScrollDirection } from '../../enums/scroll-direction.enum';
import { Quarter } from '../../models/quarter.model';

@Component({
  selector: 'app-date-quarter-picker',
  templateUrl: './date-quarter-picker.component.html',
  styleUrls: ['./date-quarter-picker.component.css']
})
export class DateQuarterPickerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() fromYear: number = 2018;
  @Input() toYear: number = 2023;
  @Input() horizontalScrollBy: number = 68;

  years: Array<number> = [];
  quarters: Array<Quarter> = [];
  selectedYear: number;
  selectedQuarter: Quarter;
  isContentOverflowing: boolean = false;
  isLeftScrollable: boolean = false;
  isRightScrollable: boolean = false;
  scrollDirection = ScrollDirection;
  scrollSubscription: Subscription | undefined;

  @ViewChild('wrapper') wrapper: ElementRef<HTMLElement>;
  @ViewChild('yearContainer') yearContainer: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.setupYears();
    this.setupQuarters();
  }

  ngAfterViewInit(): void {
    this.detectOverflowingContent();
    this.scrollSubscription = fromEvent(this.yearContainer.nativeElement, 'scroll')
      .subscribe((event: Event) => {
        this.detectOverflowingContent();
      });
  }

  ngOnDestroy(): void {
    this.scrollSubscription?.unsubscribe();
  }

  detectOverflowingContent(): void {
    this.isContentOverflowing = this.yearContainer.nativeElement.scrollWidth > this.yearContainer.nativeElement.clientWidth;
    this.isLeftScrollable = (this.yearContainer.nativeElement as any).scrollLeftMax > this.yearContainer.nativeElement.scrollLeft;
    this.isRightScrollable = this.yearContainer.nativeElement.scrollLeft !== 0;
  }

  setYear(year: number): void {
    this.selectedYear = year;
    this.selectedQuarter = null;
  }

  setQuarter(quarter: Quarter): void {
    this.selectedQuarter = quarter;
    this.hideContent();
  }

  setupYears(): void {
    for (let year = this.toYear; year >= this.fromYear; year--) {
      this.years.push(year);
    }
  }

  setupQuarters(): void {
    this.quarters = [{
      id: 1,
      identifier: 'Q1',
      fromMonth: 0,
      toMonth: 2,
      monthRange: 'Jan - Mar'
    }, {
      id: 2,
      identifier: 'Q2',
      fromMonth: 3,
      toMonth: 5,
      monthRange: 'Apr - Jun'
    }, {
      id: 3,
      identifier: 'Q3',
      fromMonth: 6,
      toMonth: 8,
      monthRange: 'Jul - Sep'
    }, {
      id: 4,
      identifier: 'Q4',
      fromMonth: 9,
      toMonth: 11,
      monthRange: 'Oct - Dec'
    }];
  }

  toggleContent(): void {
    this.wrapper.nativeElement.classList.toggle('active');
    this.detectOverflowingContent();
  }

  hideContent(): void {
    this.wrapper.nativeElement.classList.remove('active');
  }

  scrollYearListContainer(direction: ScrollDirection): void {
    switch (direction) {
      case ScrollDirection.LEFT:
        this.yearContainer.nativeElement.scrollBy({ left: -this.horizontalScrollBy, behavior: 'smooth' });
        break;
      case ScrollDirection.RIGHT:
        this.yearContainer.nativeElement.scrollBy({ left: this.horizontalScrollBy, behavior: 'smooth' });
        break;
    }
  }
}
