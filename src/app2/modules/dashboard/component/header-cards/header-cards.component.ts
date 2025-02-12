import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'header-card-component',
  templateUrl: './header-cards.component.html',
  styleUrls: ['./header-cards.component.css'],
})
export class HeaderCardComponent {
  @Input() title: string = '';
  @Input() count;
  @Input() newCount;
  @Input() isActive = false;
  @Input() icon ;
  @Output() onClick = new EventEmitter() ;
  constructor() {}

}
