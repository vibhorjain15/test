import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ClipBoardService {
  constructor(private toaster: ToastrService) {}
  private content: any = [];

  setClipboardContent(param) {
    this.content = param;
    if (param && param?.length)
      this.toaster.success('Copy to clipboard was successful!');
  }

  getClipboardContent() {
    return JSON.parse(JSON.stringify(this.content));
  }

  clearClipboardContent() {
    this.content = [];
  }
}
