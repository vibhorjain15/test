import { Component, Input } from '@angular/core';

import { BsModalRef } from 'ngx-bootstrap/modal';

import { ReleaseDetail } from 'src/app2/shared/models/releases.model';

@Component({
  selector: 'release-note-modal-template',
  templateUrl: './release-note-modal-template.component.html',
  styleUrls: ['./release-note-modal-template.component.css']
})
export class ReleaseNoteModalTemplateComponent {
  @Input() release: ReleaseDetail;

  constructor(
    private readonly modalRef: BsModalRef
  ) { }

  closeModal(): void {
    this.modalRef.hide();
  }
}
