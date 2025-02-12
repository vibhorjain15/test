import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

export type FiltersType = {
  key: string;
  label: string;
  isActive: boolean;
  isDisabled: boolean;
  isLoading?: boolean;
};
@Component({
  selector: 'dv-quick-filters',
  templateUrl: './dv-filters.component.html',
  styleUrls: ['./dv-filters.component.css'],
})
export class DvFiltersComponent implements OnInit {
  @Input() filters = [];
  @Output() onClick = new EventEmitter();

  @ViewChild('scrollContent', { static: true }) scrollContent: ElementRef;
  @ViewChild('leftArrow', { static: true }) leftArrow: ElementRef;
  @ViewChild('rightArrow', { static: true }) rightArrow: ElementRef;
  private distance: number = 350;

  constructor() {}
  ngOnInit(): void {
    setTimeout(() => {
      this.scrollToActive();
    }, 0);
  }
  scrollToActive() {
    let activeElement: any = document.getElementById('acitve-quick-filter');
    this.scrollContent.nativeElement.scrollTo({
      left: activeElement?.offsetLeft,
    });
    this.canShowIcons();
  }

  handleFirstClick() {
    this.scrollContent.nativeElement.scrollTo({
      left: this.scrollContent.nativeElement.scrollLeft - this.distance,
    });
    this.canShowIcons();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.canShowIcons();
  }

  handleLastClick() {
    this.scrollContent.nativeElement.scrollTo({
      left: this.scrollContent.nativeElement.scrollLeft + this.distance,
    });
    this.canShowIcons();
  }

  canShowIcons() {
    // Amount of time taken for smooth scroll
    setTimeout(() => {
      let { scrollLeft, scrollWidth, clientWidth } =
        this.scrollContent.nativeElement;
      scrollLeft = Math.ceil(scrollLeft);
      this.leftArrow.nativeElement.style.display =
        scrollLeft > 0 ? 'flex' : 'none';
      this.rightArrow.nativeElement.style.display =
        scrollWidth - clientWidth > scrollLeft + 1 ? 'flex' : 'none';
    }, 500);
  }

  onScroll() {
    //on each scroll check to show/hide arrow icons
    this.canShowIcons();
  }

  handleFilterClick(filter, parentFilter?) {
    !filter.isDisabled &&
      this.onClick.emit({ icon: filter, parentFilter: parentFilter });
  }
}
