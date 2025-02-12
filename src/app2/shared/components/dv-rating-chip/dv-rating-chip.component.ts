import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-rating-chip',
  templateUrl: './dv-rating-chip.component.html',
  styleUrls: ['./dv-rating-chip.component.css'],
})
export class DvRatingChipComponent {
  @Input() tooltip = '';
  @Input() color = '';
  @Input() label = '';
  @Input() textColor = '';
}
