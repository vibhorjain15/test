import { Component, Input } from '@angular/core';
import { SizeType } from '../../themes/size.theme';
import { SpacingTheme } from '../../themes/spacing.theme';

@Component({
  selector: 'dv-question-card-group',
  templateUrl: './dv-question-card-group.component.html',
  styleUrls: ['./dv-question-card-group.component.css'],
})
export class DvQuestionCardGroupComponent {
  @Input() spacing: SizeType = 'medium';
  marginBottom = SpacingTheme.medium;
  ngOnInit(): void {
    this.marginBottom = SpacingTheme[this.spacing];
  }
}
