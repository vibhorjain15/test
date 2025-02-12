import { Component, Input, OnInit } from '@angular/core';
import { ColorTheme, ColorType } from '../../themes/color.themes';
import { SpacingType, SpacingTheme } from '../../themes/spacing.theme';

@Component({
  selector: 'dv-badge',
  templateUrl: './dv-badge.component.html',
  styleUrls: ['./dv-badge.component.css'],
})
export class DvBadgeComponent implements OnInit {
  @Input() label: string = '';
  @Input() color: ColorType;
  @Input() status:
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'in_progress'
    | 'disable'
    | 'normal' = 'info';
  @Input() spacingType: 'small' | 'normal' = 'normal';
  @Input() height: SpacingType = 'large';
  ColorTheme = ColorTheme;
  SpacingTheme = SpacingTheme;
  constructor() {}

  ngOnInit(): void {}
}
