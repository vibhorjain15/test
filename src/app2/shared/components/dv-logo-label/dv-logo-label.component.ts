import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  TemplateRef,
  ChangeDetectionStrategy,
} from '@angular/core';

import { ColorTheme, ColorType } from '../../themes/color.themes';
import { SizeTheme, SizeType } from '../../themes/size.theme';

@Component({
  selector: 'dv-logo-label',
  templateUrl: './dv-logo-label.component.html',
  styleUrls: ['./dv-logo-label.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvLogoLabelComponent implements OnInit {
  @Input() label?: string = ''; // label for the icon
  @Input() icon?: string = ''; // icon type you wanna display
  @Input() iconColor: ColorType = 'default'; // for color of the icon
  @Output() onClick: EventEmitter<string> = new EventEmitter(); // event emitter when the icon is clicked
  @Input() isEnabled?: boolean = true; //if the ican i disabled or enabled
  @Input() iconLabel?: string = ''; // incase you dont want to provide icon you can use iconLabel to display
  @Input() isDropDown: boolean = false; // if the icon has capablity to dropdown a list or not
  @Input() dropDownList; // list for dropdown items
  @Input() tempRefrence: TemplateRef<any>;
  @Input() count: number;
  color?: string = '';
  colorTheme = ColorTheme;
  @Input() previewLabel: string = '';
  @Input() type: 'button' | 'normal' = 'button'; // wether you want it to be a button with onhover property or just normal label to display data
  @Input() isLoading = false;
  @Input() SizeType: SizeType = 'massive';
  @Input() hoverTransform: boolean = false;
  iconSize: any = '24px';
  @Input() labelPosition: any = 'bottom';
  @Input() ariaLabel: any = '';
  constructor() {}

  ngOnInit(): void {
    if (this.iconColor == 'default') this.color = '';
    else if (this.iconColor == 'orange') this.color = 'orange';
    this.iconSize = SizeTheme[this.SizeType];
  }

  // when the icon button is clicked we can emit a string of anysort
  onClickButton(event: any) {
    if (this.isLoading) {
      return;
    }
    this.onClick.emit(this.label);
  }
}
