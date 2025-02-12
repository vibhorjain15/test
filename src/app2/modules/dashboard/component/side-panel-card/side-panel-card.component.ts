import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'side-panel-card-component',
  templateUrl: './side-panel-card.component.html',
  styleUrls: ['./side-panel-card.component.css'],
})
export class SidePanelCardComponent implements OnInit {
  @Input() item: any = {};
  @Input() isExpanded: any = true
  @Output() onClick: any = new EventEmitter();
  constructor() {}

  ngOnInit(): void {}

  handleMenuClick() {
    this.onClick.emit();
  }
}
