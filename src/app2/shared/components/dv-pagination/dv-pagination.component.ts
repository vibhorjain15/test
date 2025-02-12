import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'dv-pagination',
  templateUrl: './dv-pagination.component.html',
  styleUrls: ['./dv-pagination.component.css'],
})
export class DvPaginationComponent implements OnInit, OnChanges {
  @Input() pageSizes: any[] = [
    { name: 10, id: 10 },
    { name: 25, id: 25 },
    { name: 50, id: 50 },
    { name: 100, id: 100 },
  ];
  @Input() pageSize: number = 10;
  @Input() startCount: number;
  @Input() endCount: number;
  @Input() totalCount: number;
  @Input() loader: boolean = false;
  @Input() lite: boolean = false; // To render liter and smaller version of pagination
  currentPage = 1;
  totalPages;
  isFirstPage: boolean;
  isLastPage: boolean;
  @Output() onPageSizeChanged = new EventEmitter<any>();
  @Output() onNextClick = new EventEmitter<any>();
  @Output() onPrevClick = new EventEmitter<any>();
  @Output() onFirstClick = new EventEmitter<any>();
  @Output() onLastClick = new EventEmitter<any>();

  ngOnInit(): void {
    this.totalPages = Math.ceil(this.totalCount / this.pageSize);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes &&
      changes.totalCount?.currentValue !== undefined &&
      changes.totalCount?.currentValue !== changes.totalCount?.previousValue
    ) {
      this.totalPages = Math.ceil(this.totalCount / this.pageSize);
      if (this.totalPages) this.currentPage = 1;
      else this.currentPage = 0;
    }
  }
  handleOnPageSizeChanged(size) {
    this.pageSize = size;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize);
    this.onPageSizeChanged.emit(size);
  }

  onFirstClicked() {
    this.currentPage = 1;
    this.onFirstClick.emit();
  }

  onPrevClicked() {
    this.currentPage--;
    this.onPrevClick.emit();
  }

  onNextClicked() {
    this.currentPage++;
    this.onNextClick.emit();
  }

  onLastClicked() {
    let lastPageQues = this.totalCount % this.pageSize; // will get the remaining items left
    let start_point;
    if (lastPageQues > 0) start_point = this.totalCount - lastPageQues;
    else start_point = this.totalCount - this.pageSize;

    this.currentPage = this.totalPages;
    this.onLastClick.emit(start_point);
  }
}
