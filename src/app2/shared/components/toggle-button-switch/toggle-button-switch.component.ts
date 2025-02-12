import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ColorTheme } from '../../themes/color.themes';

@Component({
  selector: 'toggle-button-switch',
  templateUrl: './toggle-button-switch.component.html',
  styleUrls: ['./toggle-button-switch.component.css'],
})
export class ToggleButtonSwitchComponent {
  @Input() firstLabel: string = '';
  @Input() secondLabel: string;
  @Input() firstIcon: string = '';
  @Input() secondIcon: string;
  @Input() selectedSwitch = this.firstLabel || this.firstIcon;
  @Input() labelColor = ColorTheme.default;
  @Input() showActiveTick: boolean = false;
  @Input() firstIconSize: number = null;
  @Input() secondIconSize: number = null;
  @Output() onButtonClick = new EventEmitter();

  handleButtonClick(type) {
    if (this.selectedSwitch == type) return;
    this.selectedSwitch = type;
    this.onButtonClick.emit(type);
  }
}
