import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as moment from 'moment';

/*
* This component holds each assignment details which is shown in accordion when mandatory_review is on
* It has all the required operation related to assignments in each step review 
* Inputs : 
            1. reviewList - All the assigned users/function in a step
            2. TeamRole - all the team user and function list
*/
@Component({
  selector: 'review-definition-mandatory',
  templateUrl: './review-definition-mandatory.component.html',
  styleUrls: ['./review-definition-mandatory.component.css'],
})
export class ReviewDefinitionMandatoryComponent implements OnInit {
  @Input() reviewerList;
  @Input() teamRoleList;
  @Input() formSubmitted: boolean;
  @Input() type: 'modal' | 'firm' = 'firm';
  @Input() disabled: boolean;
  @Output() onReviewerAdd = new EventEmitter();
  @Output() onReviewerDelete = new EventEmitter();
  @Output() onReviewerDataChange = new EventEmitter();
  minDate = moment().add(1, 'day').toDate();
  selectedReviewer;
  constructor() {}

  ngOnInit(): void {}

  handleDelete(index) {
    if (this.disabled) return;
    this.onReviewerDataChange.emit({
      type: 'delete',
      index: index,
    });
  }

  handleReviewerChange(reviewer) {
    this.onReviewerDataChange.emit({ type: 'reviewerAdd', value: reviewer });
    this.selectedReviewer = {};
  }

  onMandatoryChange(value, index) {
    this.onReviewerDataChange.emit({
      type: 'mandatoryChange',
      value: value,
      index: index,
    });
  }

  handleDateChange(date, user, index) {
    this.onReviewerDataChange.emit({
      type: 'date',
      value: date,
      index: index,
    });
  }
}
