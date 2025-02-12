import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
@Component({
  selector: 'app-entity-summary-documents',
  templateUrl: './entity-summary-documents.component.html',
  styleUrls: ['./entity-summary-documents.component.css'],
})
export class EntitySummaryDocumentsComponent implements OnInit {
  @Input() attachments;
  @Input() isManager: boolean;
  @Output() attachmentEvent: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  handleCallback() {
    this.attachmentEvent.emit();
  }
}
