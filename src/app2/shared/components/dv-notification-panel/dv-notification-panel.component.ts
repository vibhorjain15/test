import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'dv-notification-panel',
  templateUrl: './dv-notification-panel.component.html',
  styleUrls: ['./dv-notification-panel.component.css'],
})
export class DvNotificationPanelComponent {
  @Input() text = '';
  @Input() icon = '';
  @Output() onClose = new EventEmitter();
  canShow = true;
  constructor() {}

  handleOnClose() {
    this.canShow = false;
    this.onClose.emit();
  }
}
