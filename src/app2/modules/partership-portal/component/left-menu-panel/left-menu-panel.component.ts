import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'left-menu-panel',
  templateUrl: './left-menu-panel.component.html',
  styleUrls: ['./left-menu-panel.component.css'],
})
export class LeftMenuPanelComponent implements OnInit {
  @Input() header = 'All partnerships';
  @Input() list: {
    id: number | string;
    label: string;
    state: 'active' | 'inactive';
  }[] = [];

  @Input() isNew = true;
  @Input() loader;

  @Output() onMenuClick = new EventEmitter();
  constructor(private readonly modal: CustomModalService) {}

  ngOnInit(): void {}

  menuKey(index, item) {
    return item.id;
  }

  handleMenuClick(index) {
    this.onMenuClick.emit(index);
  }
}
