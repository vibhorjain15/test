import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-save-view-details',
  templateUrl: './save-view-details.component.html',
  styleUrls: ['./save-view-details.component.css'],
})
export class SaveViewDetailsModal {
  @Input() state;
  constructor() {}
}
