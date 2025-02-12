import { Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-view-selected-entities',
  templateUrl: `./view-selected-entities.component.html`,
})
export class ViewSelectedEntitiesComponent implements OnInit {
  @Input() entities: any;
  @Input() filter: any;
  @Input() entityType: any;
  @Input() readonly: any;
  @Input() entityGroup: any;
  @Input() success: any;
  filterDisplay: any;
  searchEntity = '';
  ngOnInit(): void {
    this.filterDisplay = this.filter
      ? this.displayFilter(this.filter)
      : 'Unfiltered';
  }

  displayFilter(criterion: any) {
    let displayedFilter = '',
      value = '';
    if (criterion.criteria_obj.type.toLowerCase() == 'date') {
      let displayedDate = '';
      if (criterion.condition == 'between') {
        let startDate = moment(criterion.advance_filter_value.startDate).format(
          'YYYY-MM-DD'
        );
        let endDate = moment(criterion.advance_filter_value.endDate).format(
          'YYYY-MM-DD'
        );
        displayedDate = startDate + ' to ' + endDate;
      } else {
        displayedDate = moment(criterion.advance_filter_value).format(
          'YYYY-MM-DD'
        );
      }
      displayedFilter =
        `${criterion.criteria_obj.filter_name} : ` + displayedDate;
    } else {
      if (criterion.criteria_obj.hasOwnProperty('options')) {
        for (let option of criterion.criteria_obj.options) {
          if (option.id == criterion.advance_filter_value) {
            value = option.value;
          }
        }
      }
      if (value !== '') {
        displayedFilter = `${criterion.criteria_obj.filter_name} : ` + value;
      } else {
        displayedFilter =
          `${criterion.criteria_obj.filter_name} : ` +
          criterion.advance_filter_value;
      }
    }
    return displayedFilter;
  }

  submit(modalCallback: any) {
    this.success(this.entities);
    modalCallback();
  }
}
