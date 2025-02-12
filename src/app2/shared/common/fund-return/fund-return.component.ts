import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-fund-return',
  templateUrl: './fund-return.component.html',
  styleUrls: ['./fund-return.component.css'],
})
export class FundReturnComponent implements OnInit {
  @Input() fundReturn;
  @Input() date;
  return_class = '';
  formatted_date = '';

  constructor() {}

  ngOnInit(): void {
    if (this.date) {
      this.formatted_date = this.date.toUpperCase();
    }
    if (this.fundReturn === null || this.fundReturn === undefined) {
      this.return_class = 'label-default';
    } else if (this.fundReturn > 0) {
      this.return_class = 'label-success';
    } else if (this.fundReturn < 0) {
      this.return_class = 'label-danger';
    } else if (this.fundReturn === 0) {
      this.return_class = 'label-info';
    }
    if (this.fundReturn) {
      this.fundReturn = `${this.fundReturn.toFixed(2)}%`;
    }
  }
}
