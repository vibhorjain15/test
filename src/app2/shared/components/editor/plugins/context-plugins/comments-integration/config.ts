type ResponseType = (data: any) => Promise<any>;

export interface DVCommentsConfig {
  addComment: ResponseType;
  updateComment: ResponseType;
  removeComment: ResponseType;
  addCommentThread: ResponseType;
  getCommentThread: ResponseType;
  updateCommentThread: ResponseType;
  resolveCommentThread: ResponseType;
  reopenCommentThread: ResponseType;
  removeCommentThread: ResponseType;
}
