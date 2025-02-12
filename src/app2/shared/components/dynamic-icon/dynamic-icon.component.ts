import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dynamic-icon',
  templateUrl: './dynamic-icon.component.html',
  styleUrls: ['./dynamic-icon.component.css']
})
export class DynamicIconComponent {
  @Input() staticIconSrc: string;
  @Input() dynamicIconSrc: string;
  @Input() height: number = 40;
  @Input() width: number = 40;
  @Input() imageAlt: string = 'image';
}
