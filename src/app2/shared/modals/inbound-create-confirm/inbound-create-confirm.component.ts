import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-inbound-create-confirm',
  templateUrl: './inbound-create-confirm.component.html',
  styleUrls: ['./inbound-create-confirm.component.css'],
})
export class InboundCreateConfirmComponent implements OnInit {
  @Input() link = '';
  modalTitle = 'New Opportunity Created';
  loading = false;
  copied = false;

  constructor() {}

  ngOnInit(): void {}

  copyToClipboard() {
    navigator.clipboard.writeText(this.link);
    this.copied = true;
  }
}
