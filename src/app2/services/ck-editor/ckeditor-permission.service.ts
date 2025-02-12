import { Injectable } from '@angular/core';

import { forkJoin } from 'rxjs';

import { ReviewCommentsService } from 'src/app2/modules/questionnaire/service/review-comments.service';
import {
  CKEditorPermission,
  CKEditorPermissionResponse,
} from 'src/app2/shared/models/ckeditor.model';

/**
 * This service is used to manage the user permissions
 * based on the dummy api call status.
 */
@Injectable({
  providedIn: 'root',
})
export class CKEditorPermissionService {
  private _permissions: CKEditorPermission;

  get canPerformOperationsOnComments(): boolean {
    return this._permissions?.canPerformOperationsOnComments ?? false;
  }

  constructor(private readonly reviewCommentsService: ReviewCommentsService) {
    this.resetPermissions();
  }

  refreshPermissions(): void {
    this.resetPermissions();

    forkJoin([
      this.reviewCommentsService.addThread({ comments: [] }, 0, 0, true),
      this.reviewCommentsService.updateThread({}, 0, 0, true),
      this.reviewCommentsService.resolveThread(
        { thread_id: 'permissioncheck' },
        0,
        0,
        true
      ),
      this.reviewCommentsService.deleteThread(
        { thread_id: 'permissioncheck' },
        0,
        0,
        true
      ),
      this.reviewCommentsService.addComment({}, 0, 0, true),
      this.reviewCommentsService.updateComment({}, 0, 0, true),
      this.reviewCommentsService.deleteComment(
        { thread_id: 'permissioncheck', comment_id: 'permissioncheck' },
        0,
        0,
        true
      ),
    ]).subscribe((response: Array<CKEditorPermissionResponse>) => {
      this._permissions.canAddThread = response[0].isCallSuccessful;
      this._permissions.canUpdateThread = response[1].isCallSuccessful;
      this._permissions.canResolveThread = response[2].isCallSuccessful;
      this._permissions.canDeleteThread = response[3].isCallSuccessful;

      this._permissions.canAddComment = response[4].isCallSuccessful;
      this._permissions.canUpdateComment = response[5].isCallSuccessful;
      this._permissions.canDeleteComment = response[6].isCallSuccessful;
    });
  }

  private resetPermissions(): void {
    this._permissions = new CKEditorPermission();
  }
}
