import { Component, Input, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'helper-text',
  templateUrl: './helper-text.component.html',
  styleUrls: ['./helper-text.component.css'],
})
export class HelperTextComponent implements OnInit {
  constructor() {}
  @Input() innerHtml: string = '';
  @Input() secondaryText: string;
  @Input() showMoreLabel: string = 'Learn More';
  @Input() showLessLabel: string;
  @Input() helperTextThemeVersion: 'v1' | 'default' = 'default';
  @Input() panelClass: string = 'panel-info';
  showMore: boolean;
  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      this.showMore = false;
    }
  }
}
