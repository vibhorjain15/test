import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
@Component({
  selector: 'new-pagination-bar',
  templateUrl: './new-pagination-bar.component.html',
  styleUrls: ['./new-pagination-bar.component.css'],
})
export class NewPaginationbarComponent  {
  @Input() countData = {
    currentPage: 0,
    totalPages: 0,
    startCount: 0,
    endCount: 0,
    totalCount: 0,
    isFirstPage: false,
    isLastPage: false,
  };
  @Input() gridPageSize = "10"
  @Output() onPageSizeChanged = new EventEmitter();
  @Output() onFirstClicked = new EventEmitter();
  @Output() onLastClicked = new EventEmitter();
  @Output() onPrevClicked = new EventEmitter();
  @Output() onNextClicked = new EventEmitter();

}
