import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'dv-rating',
  templateUrl: './dv-rating.component.html',
  styleUrls: ['./dv-rating.component.css'],
})
export class DvRatingComponent implements OnInit {
  @Input() ratingScales = [];
  @Input() readonly: boolean;
  @Input() max: any;
  @Input() ratingTooltip: string;
  @Input() value: any = 0;
  @Input() offColor;
  @Input() id: number = null; // useful to access the component with viewchildren if in loop
  @Output() onChange = new EventEmitter();
  scale_value: string;
  hovering: boolean;
  constructor() {}

  ngOnInit(): void {
    if (this.value) {
      this.setScaleValue(this.value);
    } else {
      this.value = 0;
    }
  }

  onRatingChange() {
    if (!this.readonly) {
      this.onChange.emit(this.value == 0 ? null : this.value);
    }
  }

  setScaleValue(value) {
    this.scale_value = this.ratingScales.find((x) => x.value === value)?.name;
  }

  hoveringOver(value: number): void {
    this.setScaleValue(value);
    this.hovering = true;
  }

  resetHovering(): void {
    this.hovering = false;
    this.setScaleValue(this.value);
  }

  resetRating(emitEvent: boolean = false) {
    this.value = 0;
    if (emitEvent) {
      this.onRatingChange();
    }
  }
}
