import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ColorTheme, ColorType } from 'src/app2/shared/themes/color.themes';

@Component({
  selector: 'qa-button-tabs',
  templateUrl: './qa-button-tabs.component.html',
  styleUrls: ['./qa-button-tabs.component.css'],
})
export class QaButtonTabsComponent implements OnInit {
  @Input() iconName?: string = '';
  @Input() color: 'primary' | 'default' = 'default';
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() iconColor: ColorType = 'default';
  @Output() onClick: EventEmitter<string> = new EventEmitter();
  constructor() {}

  ngOnInit(): void {}

  handleButtonSelect() {
    if (!this.disabled) {
      this.onClick.emit(this.label);
    }
  }
}
