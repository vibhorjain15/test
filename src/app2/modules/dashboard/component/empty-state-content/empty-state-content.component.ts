import { Component, Input } from '@angular/core';

@Component({
  selector: 'empty-state-content',
  templateUrl: './empty-state-content.component.html',
  styleUrls: ['./empty-state-content.component.css'],
})
export class EmptyStateContentComponent {
  @Input() title: string;
  @Input() description: string;
  @Input() icon: string = 'check';
}
