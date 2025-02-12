import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrls: ['./tab.component.css'],
})
export class TabComponent implements OnInit {
  @Input() items: any;
  @Input() loading: boolean;
  @Input() switchTabInParentComponent: boolean = false;
  @Input() spaceAroundTab = true;
  @Output() switchEvent: EventEmitter<any> = new EventEmitter<any>();

  constructor() {}

  ngOnInit(): void {}

  switchTab(item) {
    if (item && !item.disabled && !item.active) {
      if (!this.switchTabInParentComponent) {
        let activeItem = this.items.find((x) => x.active);
        if (activeItem) {
          activeItem.active = false;
        }
        item.active = true;
      }
      this.switchEvent.emit(item);
    }
  }
}
