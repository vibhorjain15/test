import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ColorTheme } from '../../themes/color.themes';

export interface DropDownType {
  label: string;
  key: string;
  disabled?: boolean;
  tooltip?: string;
  color?: string;
  param?: string;
  isEmpty?: boolean;
  rightIconTooltip?: string;
  placement?: string;
  children?: DropDownType[];
  isOpen?: boolean;
  displayLabel?: string;
  focus?: boolean;
  count?: number;
  isActive?: boolean;
}
@Component({
  selector: 'dv-dropdown',
  templateUrl: './dv-dropdown.component.html',
  styleUrls: ['./dv-dropdown.component.css'],
})
export class DvDropdownComponent implements OnInit {
  @Input() label = '';
  @Input() iconName = '';
  @Input() iconColor = '';
  @Input() iconSize: 'small' | 'medium' | 'large' = 'large';
  @Input() dropDownList: DropDownType[] = [
    { label: 'Move to', key: 'move' },
    { label: 'Copy to', key: 'copy' },
  ];
  @Input() type: 'primary' | 'default' = 'primary';
  @Input() dropdownPlacement: 'top' | 'bottom' | 'left' | 'right' = 'left';
  @Input() toggleDropDown: boolean;
  @Input() inpToolTip: string;
  @Input() container = 'body';
  @Input() scrollable = false;
  @Input() isIconLabel = false;
  @Input() isChild = false;
  @Input() autoClose = true;
  @Input() customButton = false;
  @Input() disabled = false;
  @Input() dropup = false;
  @Input() inheritWidth = false;
  @Input() rightIconTooltip = 'Delete';
  @Input() customClass;
  @Input() iconClass = '';
  @Input() showCursorIfDisabled = false;
  @Input() hoverTransform: boolean = false;
  @Output() onDropdownClick = new EventEmitter();
  @Output() onIconClick = new EventEmitter();
  @Output() onDropdownToggle = new EventEmitter();
  size = 25;
  ColorTheme = ColorTheme;
  ngOnInit(): void {
    if (this.iconSize === 'small') this.size = 14;
    if (this.iconSize === 'medium') this.size = 20;
    if (this.iconSize === 'large') this.size = 24;
  }

  handleDropdownClick(event, data) {
    event.stopPropagation();
    // Return if its a child dropdown
    if (data?.children) {
      this.toggleDropDown = true;
      data.isOpen = true;
      return;
    }
    if (!data?.disabled) {
      if (!data?.children) {
        this.toggleDropDown = false;
        this.onDropdownClick.emit(data);
      }
    }
  }

  handleIconClick(event, data) {
    event.stopPropagation();
    this.toggleDropDown = false;
    this.onIconClick.emit(data);
  }

  isToggled(data: any) {
    this.toggleDropDown = data;
    if (!data) this.closeAllChildDropdown(this.dropDownList);
    this.onDropdownToggle.emit(this.toggleDropDown);
  }

  handleChildToggle(data, list) {
    //Closing all the parent level opened dropdowns except the one clicked
    if (data)
      this.dropDownList.forEach((items) => {
        if (items.key != list.key) items.isOpen = false;
      });
    list.isOpen = data;
  }

  handleChildDropdown(data) {
    this.onDropdownClick.emit(data);
  }

  handleClick(link) {
    link.isOpen = !link.isOpen;
  }

  // Added recursive function to close all the child dropdown whenever user closes the parent
  closeAllChildDropdown(list) {
    list.forEach((data) => {
      data.isOpen = false;
      if (data.children) this.closeAllChildDropdown(data.children);
    });
  }

  closeAllDropdown() {
    this.dropDownList.forEach((data) => {
      data.isOpen = false;
    });
  }
}
