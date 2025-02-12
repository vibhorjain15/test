import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
import { ColorTheme, ColorType } from '../themes/color.themes';
import { SizeTheme, SizeType } from '../themes/size.theme';
import { SpacingTheme, SpacingType } from '../themes/spacing.theme';

@Directive({
  selector: '[appIcon]',
})
export class IconDirective implements OnInit, OnChanges {
  @Input() name? = '';
  @Input() size? = '';
  @Input() colored? = false;
  @Input() color: ColorType;
  @Input() isDisable? = false;
  @Input() keepColorWithDisableMode? = false;
  @Input() customSize?: SizeType;
  @Input() background?: 'filled' | 'light' | 'none' = 'none';
  @Input() shape?: 'round' | 'rectangle' | 'none' = 'none';
  @Input() bgSpace?: SpacingType = 'medium';

  constructor(
    private readonly renderer: Renderer2,
    private readonly elementRef: ElementRef,
    private readonly util: UtilsService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.color &&
      changes.color?.currentValue !== changes.color?.previousValue
    ) {
      const nativeElement = this.elementRef.nativeElement;
      nativeElement.style.color =
        this.color in ColorTheme ? ColorTheme[this.color] : this.color;
      nativeElement.style.cursor = this.isDisable ? 'not-allowed' : 'pointer';
    }
    if (
      changes.name &&
      changes.name?.currentValue !== changes.name?.previousValue
    ) {
      this.name = changes.name.currentValue;
      const nativeElement = this.elementRef.nativeElement;
      this.renderer.removeClass(
        nativeElement,
        `dvi-${changes.name?.previousValue}`
      );
      this.renderer.addClass(nativeElement, `dvi`);
      if (this.name) {
        this.renderer.addClass(nativeElement, `dvi-${this.name}`);
      }
      if (this.size) {
        this.renderer.addClass(nativeElement, `fa-${this.size}`);
      }
      if (this.colored) {
        this.renderer.addClass(nativeElement, `colored`);
      }
      if (this.color) {
        let color: any = this.color;
        if (this.color in ColorTheme) {
          color = ColorTheme[this.color];
        }
        nativeElement.style.color = color;
      }
      if (this.background !== 'none') {
        nativeElement.style.background = `${this.util.hexToRgba(
          this.color ? ColorTheme[this.color] : ColorTheme['secondary'],
          this.background == 'filled' ? 1 : 0.15
        )}`;
        if (this.background == 'filled') {
          nativeElement.style.color = this.util.isColorLightOrDarkModified(
            nativeElement.style.background
          );
        }
        nativeElement.style.padding = `${SpacingTheme[this.bgSpace]}`;
        this.renderer.addClass(nativeElement, `inline-flex-center`);
      }
      if (this.shape !== 'none') {
        let borderColor =
          this.background == 'none'
            ? this.color
              ? ColorTheme[this.color]
              : ColorTheme['secondary']
            : 'transparent';
        let borderRadius =
          this.shape == 'round'
            ? '50%'
            : this.shape == 'rectangle'
            ? '6px'
            : '0px';
        nativeElement.style.padding = `${SpacingTheme[this.bgSpace]}`;
        nativeElement.style.borderRadius = borderRadius;
        nativeElement.style.border = `1px solid ${borderColor}`;
        this.renderer.addClass(nativeElement, `inline-flex-center`);
      }
      if (this.isDisable) {
        let css;
        if (this.keepColorWithDisableMode) {
          let color: any = this.color;
          if (this.color in ColorTheme) {
            color = ColorTheme[this.color];
          }
          nativeElement.style.color = color;
          nativeElement.style.cursor = 'not-allowed';
        } else {
          nativeElement.style.color = ColorTheme['grey'];
          nativeElement.style.cursor = 'not-allowed';
        }
      }
      if (this.customSize) {
        nativeElement.style.fontSize = SizeTheme[this.customSize];
      }
    } else if (
      changes.color &&
      changes.color?.previousValue !== changes.color?.currentValue
    ) {
      const currentColor = changes.color.currentValue;
      this.elementRef.nativeElement.style.color =
        currentColor in ColorTheme ? ColorTheme[currentColor] : null;
    } else if (
      changes?.isDisable != null &&
      changes.isDisable.currentValue != changes.isDisable.previousValue
    ) {
      const nativeElement = this.elementRef.nativeElement;
      if (this.isDisable) {
        let css;
        if (this.keepColorWithDisableMode) {
          let color: any = this.color;
          if (this.color in ColorTheme) {
            color = ColorTheme[this.color];
          }
          nativeElement.style.color = color;
          nativeElement.style.cursor = 'not-allowed';
        } else {
          nativeElement.style.color = ColorTheme['grey'];
          nativeElement.style.cursor = 'not-allowed';
        }
      } else {
        nativeElement.style.color =
          this.color in ColorTheme ? ColorTheme[this.color] : this.color;
        nativeElement.style.cursor = 'pointer';
      }
    }
  }

  ngOnInit() {}
}
