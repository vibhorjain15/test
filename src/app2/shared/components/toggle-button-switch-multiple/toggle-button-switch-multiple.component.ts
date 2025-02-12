import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ColorTheme } from '../../themes/color.themes';

@Component({
  selector: 'toggle-button-switch-multiple',
  templateUrl: './toggle-button-switch-multiple.component.html',
  styleUrls: ['./toggle-button-switch-multiple.component.css'],
})
export class ToggleButtonSwitchMultipleComponent {
  @Input() items: {
    id: any;
    label: string;
    icon: string;
    iconSize: number;
    isSelected: boolean;
    labelClass: string;
  }[] = [];
  // @Input() firstLabel: string = '';
  // @Input() secondLabel: string;
  // @Input() firstIcon: string = '';
  // @Input() secondIcon: string;
  // @Input() selectedSwitch = this.firstLabel || this.firstIcon;
  @Input() labelColor = ColorTheme.default;
  @Input() showActiveTick: boolean = false;
  // @Input() firstIconSize: number = null;
  // @Input() secondIconSize: number = null;
  @Output() onButtonClick = new EventEmitter();

  handleButtonClick(item) {
    if (item.isSelected) return;
    this.items.forEach((toggleItem) => {
      toggleItem.isSelected = toggleItem.id == item.id;
    });
    this.onButtonClick.emit(item);
  }
}
