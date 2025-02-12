import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

import { CKEditorMessageData } from 'src/app2/shared/models/ckeditor.model';

/**
 * CKEditor message service is used for
 * passing custom editor messages to
 * the required components.
 *
 * For example: it is being used to switch back
 * to `Open` threads tab if user is on `Resolved` tab
 * in the `ck-comments-panel`.
 * The event is triggered from the `editor.component.ts#addCommentCallback()`
 */
@Injectable({
  providedIn: 'root',
})
export class CKEditorMessageService {
  private _message: Subject<CKEditorMessageData> =
    new Subject<CKEditorMessageData>();
  onMessageReceived = this._message.asObservable();

  sendMessage(message: CKEditorMessageData): void {
    this._message.next(message);
  }
}
