import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'dv-partnership-card',
  templateUrl: './partnership-card.component.html',
  styleUrls: ['./partnership-card.component.css'],
})
export class PartnershipCardComponent implements OnInit {
  @Input() partner;
  @Input() showCheckbox = false;
  @Output() onClick = new EventEmitter();
  description;

  ngOnInit(): void {
    this.description = this.partner.description.split('<p>')[2];
  }

  handleOnClick() {
    this.onClick.emit();
  }

  handleCheckboxClick(data) {
    this.partner.isChecked = data;
  }
}
