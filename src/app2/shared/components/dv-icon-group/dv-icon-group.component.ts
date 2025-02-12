import { Component, Input } from '@angular/core';
import { ColorTheme, ColorType } from '../../themes/color.themes';
import { SpacingType } from '../../themes/spacing.theme';

@Component({
  selector: 'dv-icon-group',
  templateUrl: './dv-icon-group.component.html',
  styleUrls: ['./dv-icon-group.component.css'],
})
export class DvIconGroupComponent {
  @Input() color: ColorType = 'default';
  @Input() type: 'horizontal' | 'vertical' = 'horizontal'; // vertical pending
  @Input() spacing: SpacingType = 'huge'; // vertical pending
  styleColor = ColorTheme.default;
  ngOnInit(): void {
    this.styleColor = ColorTheme[this.color];
  }
}
