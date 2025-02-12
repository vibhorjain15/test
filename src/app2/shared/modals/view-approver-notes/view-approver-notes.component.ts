import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-view-approver-notes',
  templateUrl: './view-approver-notes.component.html',
})
export class ViewApproverNotesComponent implements OnInit {
  @Input() approver_notes: any;
  constructor() {}

  ngOnInit(): void {}
}
