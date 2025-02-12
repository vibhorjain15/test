import { ContextPlugin } from 'ckeditor5';
import { DVUtils } from '../dv-utils.plugin';

export default class CommentsIntegration extends ContextPlugin {
  static get requires() {
    return ['CommentsRepository', 'UsersIntegration', 'DVUtils'];
  }

  static get pluginName() {
    return 'CommentsIntegration' as const;
  }

  init() {
    const context = this.context;
    const commentsRepositoryPlugin = context.plugins.get('CommentsRepository');
    const utils = context.plugins.get(DVUtils);
    const dvCommentsConfig = context.config.get('dvComments');

    // Set the adapter on the `CommentsRepository#adapter` property.
    commentsRepositoryPlugin.adapter = {
      async addComment(data) {
        const payload = {
          comment_id: data.commentId,
          thread_id: data.threadId,
          content: data.content,
          attributes: JSON.stringify(data.attributes),
        };

        // Write a request to your database here. The returned `Promise`
        // should be resolved when the request has finished.
        // When the promise resolves with the comment data object, it
        // will update the editor comment using the provided data.
        return new Promise(async (resolve, reject) => {
          const response = await dvCommentsConfig
            .addComment(payload)
            .catch((error: any) => reject());
          resolve({
            commentId: data.commentId,
            createdAt: utils.getLocalDateTimeGeneric(response.created_at),
          });
        });
      },

      async updateComment(data) {
        const comment = commentsRepositoryPlugin
          .getCommentThread(data.threadId)
          ?.getComment(data.commentId);
        const payload = {
          comment_id: data.commentId,
          thread_id: data.threadId,
          content: comment?.content,
          attributes: JSON.stringify(comment?.attributes ?? {}),
        };

        // Write a request to your database here. The returned `Promise`
        // should be resolved when the request has finished.
        return new Promise(async (resolve, reject) => {
          await dvCommentsConfig
            .updateComment(payload)
            .catch((error: any) => reject());
          resolve();
        });
      },

      async removeComment(data) {
        const payload = {
          comment_id: data.commentId,
          thread_id: data.threadId,
        };

        // Write a request to your database here. The returned `Promise`
        // should be resolved when the request has finished.
        return new Promise(async (resolve, reject) => {
          await dvCommentsConfig
            .removeComment(payload)
            .catch((error: any) => reject());
          resolve();
        });
      },

      async addCommentThread(data) {
        const payload: any = {};
        payload.thread_id = data.threadId;
        payload.attributes = JSON.stringify(data.attributes);
        payload.selected_text = JSON.stringify(data.context);
        payload.comments = data.comments.map((comment) => ({
          comment_id: comment.commentId,
          thread_id: data.threadId,
          content: comment.content,
          diligence_id: this.diligence_id,
          response_id: this.response_id,
          attributes: JSON.stringify(comment.attributes),
        }));

        // Write a request to your database here. The returned `Promise`
        // should be resolved when the request has finished.
        return new Promise(async (resolve, reject) => {
          const response = await dvCommentsConfig
            .addCommentThread(payload)
            .catch((error) => {
              reject();
            });

          resolve({
            threadId: response.thread_id,
            comments: response.comments.map((comment: any) => ({
              commentId: comment.comment_id,
              createdAt: utils.getLocalDateTimeGeneric(comment.created_at),
            })), // Should be set on the server side.
          });
        });
      },

      async getCommentThread(data) {
        const payload = {
          thread_id: data.threadId,
        };

        // Write a request to your database here. The returned `Promise`
        // should resolve with the comment thread data.
        return new Promise(async (resolve, reject) => {
          const response = await dvCommentsConfig
            .getCommentThread(payload)
            .catch((error: any) => reject());
          const thread = {
            threadId: response.thread_id,
            comments:
              response.comments && response.comments.length
                ? response.comments.map((c: any) => ({
                    commentId: c.comment_id,
                    authorId: c.created_by ? `${c.created_by}` : null,
                    content: c.content,
                    createdAt: utils.getLocalDateTimeGeneric(c.created_at),
                    attributes: JSON.parse(c.attributes),
                  }))
                : [],
            // It defines the value on which the comment has been created initially.
            // If it is empty it will be set based on the comment marker.
            context: response.selected_text
              ? JSON.parse(response.selected_text)
              : response.selected_text,
            unlinkedAt: utils.getLocalDateTimeGeneric(response.unlinked_at),
            resolvedAt: utils.getLocalDateTimeGeneric(response.resolved_at),
            resolvedBy: response.resolved_by ? `${response.resolved_by}` : null,
            attributes: JSON.parse(response.attributes),
            isFromAdapter: true,
          };

          resolve(thread);
        });
      },

      async updateCommentThread(data) {
        const thread = commentsRepositoryPlugin.getCommentThread(
          data.threadId
        )!;
        const payload = {
          thread_id: data.threadId,
          selected_text: JSON.stringify((thread as any).context),
          attributes: JSON.stringify(thread.attributes),
          unlinked_at: thread.unlinkedAt,
        };

        // Write a request to your database here. The returned `Promise`
        // should be resolved when the request has finished.
        return new Promise(async (resolve, reject) => {
          await dvCommentsConfig
            .updateCommentThread(payload)
            .catch((error: any) => reject());
          resolve();
        });
      },

      async resolveCommentThread(data) {
        const payload = {
          thread_id: data.threadId,
        };

        // Write a request to your database here. The returned `Promise`
        // should be resolved when the request has finished.
        return new Promise(async (resolve, reject) => {
          const response = await dvCommentsConfig
            .resolveCommentThread(payload)
            .catch((error: any) => reject());
          resolve({
            threadId: data.threadId,
            resolvedAt: utils.getLocalDateTimeGeneric(response.resolved_at), // Should be set on the server side.
            resolvedBy: `${response.resolved_by}`, // Should be set on the server side.
          });
        });
      },

      async reopenCommentThread(data) {
        const payload = {
          thread_id: data.threadId,
        };

        // Write a request to your database here. The returned `Promise`
        // should be resolved when the request has finished.
        return new Promise(async (resolve, reject) => {
          await dvCommentsConfig
            .reopenCommentThread(payload)
            .catch((error: any) => reject());
          resolve();
        });
      },

      async removeCommentThread(data) {
        const payload = {
          thread_id: data.threadId,
        };

        // Write a request to your database here. The returned `Promise`
        // should be resolved when the request has finished.
        return new Promise(async (resolve, reject) => {
          await dvCommentsConfig
            .removeCommentThread(payload)
            .catch((error: any) => reject());
          resolve();
        });
      },
    };
  }
}
