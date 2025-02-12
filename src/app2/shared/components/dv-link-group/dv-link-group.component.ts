import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'dv-link-group',
  templateUrl: './dv-link-group.component.html',
  styleUrls: ['./dv-link-group.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DvLinkGroupComponent {
  @Input() type: 'horizontal' | 'vertical' = 'horizontal'; // vertical pending
}
