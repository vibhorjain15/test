import { OnInit, Component, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'dv-rating-dropdown',
  templateUrl: './dv-rating-dropdown.component.html',
})
export class DvRatingDropdownComponent implements OnInit {
  @Input() color;
  @Input() readonly;
  @Input() ratingScales = [];
  @Input() score;
  @Input() tooltip = 'efef';
  @Input() showDropDown = true;
  @Input() isQuestion = false;
  @Input() isNARating = false;
  @Output() onChange = new EventEmitter();
  @Output() onClick = new EventEmitter();
  @Input() isDisabled: boolean = false;
  toggleDropDown = false;

  ngOnInit(): void {}
  isToggled(data: any) {
    this.toggleDropDown = data;
  }

  onRatingChange(data) {
    this.onChange.emit(data);
  }

  handleOnClick() {
    this.onClick.emit();
  }
}
