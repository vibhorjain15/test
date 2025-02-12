import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ColorTheme, ColorType } from '../../themes/color.themes';
import { SizeTheme, SizeType } from '../../themes/size.theme';

@Component({
  selector: 'dv-link',
  templateUrl: './dv-link.component.html',
  styleUrls: ['./dv-link.component.css'],
})
export class DvLinkComponent implements OnInit, OnChanges {
  @Input() name = 'Sample';
  @Input() icon;
  @Input() type: 'disable' | 'default' | 'bold' | 'italic' = 'default';
  @Input() color: ColorType = 'default';
  @Input() size: SizeType = 'large';
  @Input() tooltip;
  @Input() linkClass: '';
  @Output() onClick = new EventEmitter();
  styleSize = SizeTheme.large;
  styleColor = ColorTheme.default;
  ngOnInit(): void {
    this.styleSize = SizeTheme[this.size];
    this.styleColor = ColorTheme[this.color];
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.ngOnInit();
  }
  handleLinkClick(event) {
    this.onClick.emit();
  }
}
