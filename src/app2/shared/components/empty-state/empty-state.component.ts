import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css'],
})
export class EmptyStateComponent implements OnInit {
  @Input() iconName? = '';
  @Input() message? = '';
  @Input() actionLabel? = '';
  @Output() action = new EventEmitter();
  constructor() {}
  ngOnInit(): void {}
  onActionClicked() {
    if (this.action) {
      this.action.emit();
    }
  }
}
