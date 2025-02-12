import { Component, Input } from '@angular/core';

@Component({
  selector: 'dv-progress-bar',
  templateUrl: './dv-progress-bar.component.html',
  styleUrls: ['./dv-progress-bar.component.css'],
})
export class DvProgressBarComponent {
  @Input() value = 0;
  @Input() type: 'success' | 'primary' = 'success';
  @Input() suffix = '%';
  @Input() count = '';
  progressBarLabelId: string =
    'progressBar-label-' + Math.random().toString(36).substring(2);
}
