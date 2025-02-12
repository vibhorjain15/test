import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LabelType, Options } from '@angular-slider/ngx-slider';

@Component({
  selector: 'dv-slider',
  templateUrl: './dv-slider.component.html',
  styleUrls: ['./dv-slider.component.css'],
})
export class DvSliderComponent {
  @Input() value: number;
  @Input() min: number;
  @Input() max: number;
  @Input() incrementStep: number = 1;
  @Input() disabled: boolean;
  @Input() showPercentage: boolean;
  @Output() onSliderChange: EventEmitter<number> = new EventEmitter();
  options: Options;

  ngOnInit() {
    this.options = {
      disabled: this.disabled,
      floor: this.min,
      ceil: this.max,
      step: this.incrementStep,
      showSelectionBar: true,
      translate: (value: number, label: LabelType): string => {
        return this.showPercentage ? `${value}%` : value.toString();
      },
      getSelectionBarColor: (value: number): string => {
        return this.getSliderAndPointerColor(value);
      },
      getPointerColor: (value: number): string => {
        return this.getSliderAndPointerColor(value);
      },
    };
  }

  onChange(number) {
    this.onSliderChange.emit(number);
  }

  getSliderAndPointerColor(value: number): string {
    if (!value) {
      return '#dcdcdc';
    }
    if (value >= 80) {
      return '#25b29b';
    }
    if (value >= 70 && value < 80) {
      return '#93e9be';
    }
    if (value >= 60 && value < 70) {
      return '#F6D83E';
    }
    return '#f57c00';
  }
}
