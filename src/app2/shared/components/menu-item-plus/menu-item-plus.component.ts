import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-menu-item-plus',
  templateUrl: './menu-item-plus.component.html',
  styleUrls: ['./menu-item-plus.component.css'],
})
export class MenuItemPlusComponent implements OnInit {
  @Input() menu_item;
  @Input() is_active;
  constructor() {}

  ngOnInit(): void {}
}
