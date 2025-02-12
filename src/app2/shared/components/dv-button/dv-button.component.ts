import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { SizeTheme, SizeType } from '../../themes/size.theme';

@Component({
  selector: 'dv-button',
  templateUrl: './dv-button.component.html',
  styleUrls: ['./dv-button.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvButtonComponent implements OnInit, AfterViewInit {
  @Input() loader? = false;
  @Input() disabled? = false;
  @Input() btnClass? = '';
  @Input() leftIcon? = null;
  @Input() size? = '';
  @Input() btnType?:
    | 'primary'
    | 'default'
    | 'orange'
    | 'orange-fill'
    | 'transparent'
    | 'secondary'
    | 'darkBlue'
    | 'link'
    | 'success'
    | 'orange-border'
    | 'btn-link'
    | 'danger'
    | 'tab-selection'
    | 'blue-border' = 'primary';
  @Input() tabIndex = 0; // Default tab index
  @Output() onClick? = new EventEmitter();
  @Output() onDisabledClick? = new EventEmitter();
  @Input() btnWidth? = '';
  @Input() borderRadius? = '';
  @Input() fontSizeType: SizeType = 'large';
  @Input() iconSize: SizeType;
  @Input() adaptivePosition = true;
  @Input() tooltipText = '';
  @Input() tooltipPlacement: string = 'top';
  @Input() onlyIcon: boolean = false;
  @Input() disabledClass: boolean = false; // This attribute was specially added to show the button as clickable but still listen click event so that premium alert can be shown
  fontSize: string;
  @Input() type = null;
  @ViewChild('buttonContent', { static: true }) buttonContent: ElementRef;
  @Input() ariaLabel: string;
  @Input() id?: string;
  constructor(private cd: ChangeDetectorRef) {}
  ngOnInit() {
    this.fontSize = SizeTheme[this.fontSizeType];
  }

  ngAfterViewInit() {
    this.updateAriaLabel();
  }

  handleOnClick(event) {
    if (this.disabled || this.loader) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    this.onClick.emit('');
  }

  updateAriaLabel() {
    if (!this.ariaLabel) {
      this.ariaLabel =
        this.tooltipText || this.getTextContent() || this.ariaLabel || 'button';
      this.cd.markForCheck();
    }
  }

  getTextContent(): string {
    if (this.buttonContent) {
      return this.buttonContent.nativeElement.textContent.trim();
    }
    return '';
  }
}
