import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ColorTheme, ColorType } from '../../themes/color.themes';
import { SizeTheme, SizeType } from '../../themes/size.theme';
import { TruncatePipe } from '../../pipes/trucate.pipe';

@Component({
  selector: 'dv-label',
  templateUrl: './dv-label.component.html',
  styleUrls: ['./dv-label.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvLabelComponent implements OnInit {
  @Input() type: 'disable' | 'default' | 'bold' = 'default';
  @Input() color: ColorType = 'default';
  @Input() size: SizeType = 'large';
  @Input() label;
  @Input() align: 'left' | 'center' | 'right';
  @Input() truncateLimit?: number; // Maximum number of characters you want to show
  colorTheme = ColorTheme;

  styleSize = SizeTheme.large;
  styleColor = ColorTheme.default;
  constructor(public truncate: TruncatePipe) {}
  ngOnInit(): void {
    this.label = this.addDownloadLink(this.label);
    this.styleSize = SizeTheme[this.size];
    this.styleColor = ColorTheme[this.color];
  }

  addDownloadLink(anchorString: string): string {
    const clickRegex = /\(click\)="([^"]*)"/;
    const dataNgClickRegex = /data-ng-click="[^"]*"/; // data-ng-click if present already 
    const clickMatch = anchorString.match(clickRegex);
    if (clickMatch && !dataNgClickRegex.test(anchorString)) {
      // click event present already and data-ng-click not present 
      const clickFunctionValue = clickMatch[1];
      return anchorString.replace(
        clickRegex,
        `data-ng-click="${clickFunctionValue}" $&`
      );
    }
    return anchorString;
  }
}
