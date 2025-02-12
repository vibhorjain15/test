import { HttpClient } from '@angular/common/http';
import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Directive({
  selector: '[document-viewer]',
})
export class DocumentViewerDirective {
  @Input() dd_document: any;
  @Output() callbackEvent: EventEmitter<any> = new EventEmitter();

  constructor(private http: HttpClient, private toaster: ToastrService) {}

  @HostListener('click', ['$event.target'])
  public onClick(target) {
    this.toaster.info('Please Wait');
    const attachmentId = this.dd_document.attachment_id ?? this.dd_document.id;
    this.http
      .get(`attachments/${attachmentId}/signed_url`)
      .subscribe((url: string) => {
        if (url) {
          window.open(url, '_blank');
        }
        this.toaster.clear();
        this.callbackEvent.emit();
      });
  }
}
