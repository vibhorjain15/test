export type AddCommentSource =
  | 'editor-toolbar'
  | 'questionnaire-toolbar'
  | 'editor-on-ready';

export type CKEditorMessageSource =
  | 'editor-component'
  | 'ck-comments-panel'
  | 'text-multiline-response';

export interface AddCommentData {
  source: AddCommentSource;
}

export interface CKEditorMessageData {
  source: CKEditorMessageSource;
  data: any;
}

export class CKEditorPermission {
  // Operations on thread
  private _canAddThread: boolean = false;
  private _canUpdateThread: boolean = false;
  private _canResolveThread: boolean = false;
  private _canDeleteThread: boolean = false;

  // Operations on comment
  private _canAddComment: boolean = false;
  private _canUpdateComment: boolean = false;
  private _canDeleteComment: boolean = false;

  // Can user perform operations
  private _canPerformOperations: boolean = false;

  set canAddThread(value: boolean) {
    this._canAddThread = value;
    this.recalculatePermission();
  }

  set canUpdateThread(value: boolean) {
    this._canUpdateThread = value;
    this.recalculatePermission();
  }

  set canResolveThread(value: boolean) {
    this._canResolveThread = value;
    this.recalculatePermission();
  }

  set canDeleteThread(value: boolean) {
    this._canDeleteThread = value;
    this.recalculatePermission();
  }

  set canAddComment(value: boolean) {
    this._canAddComment = value;
    this.recalculatePermission();
  }

  set canUpdateComment(value: boolean) {
    this._canUpdateComment = value;
    this.recalculatePermission();
  }

  set canDeleteComment(value: boolean) {
    this._canDeleteComment = value;
    this.recalculatePermission();
  }

  get canPerformOperationsOnComments(): boolean {
    return this._canPerformOperations;
  }

  private recalculatePermission(): void {
    this._canPerformOperations =
      this._canAddThread &&
      this._canUpdateThread &&
      this._canResolveThread &&
      this._canDeleteThread &&
      this._canAddComment &&
      this._canUpdateComment &&
      this._canDeleteComment;
  }
}

export interface CKEditorPermissionResponse {
  isCallSuccessful: boolean;
}
