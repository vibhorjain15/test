import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'document-name',
  templateUrl: './document-name.component.html',
  styleUrls: ['./document-name.component.css'],
})
export class DocumentNameComponent implements OnInit {
  @Input() document: any;
  @Input() canModify: boolean = true;
  @Input() isQuestionView: boolean = false;
  @Input() truncateAfter: number = 60;
  @Input() deleteTooltip = 'Delete document';
  @Output() onDeleteDocument: EventEmitter<any> = new EventEmitter<any>();
  @Output() onEditDocument: EventEmitter<any> = new EventEmitter<any>();
  constructor() {}

  ngOnInit(): void {}

  onDelete() {
    this.onDeleteDocument.emit();
  }

  onEdit() {
    this.onEditDocument.emit();
  }
}
