import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { ResponseType } from '../constants/Response-type.constant';
import {
  UpdateLocalQuestionMap,
  UpdateReviewCommentsData,
  UpdateSectionFilterCounter,
} from '../store/questionnaire.action';
import { DVUtils } from 'src/app2/shared/components/editor/plugins';

@Injectable({
  providedIn: 'root',
})
export class ReviewCommentsService {
  readonly API_V2: string = 'v2/response_comments'; // ckeditor comment endpoint
  commentsLookup: any;
  allTextMultilineResponse = {};
  questionIdMultitextMap = {};
  constructor(
    private readonly questionnaireService: QuestionnaireService,
    private readonly toaster: ToastrService,
    private readonly Utils: UtilsService,
    private readonly store: Store,
    private readonly http: HttpClient
  ) {}

  addCommentHandler(
    req,
    done,
    fail,
    selectedText,
    diligenceId,
    responseId,
    isReply = false,
    currentCommentIds = null,
    sectionId = null,
    questionId = null,
    parentQuestionId = null,
    editorText = null,
    responseType = null,
    editable = null,
    question,
    callback = null
  ) {
    if (selectedText.replace(/&nbsp;/g, '').replace(/\s/g, '').length > 0) {
      const params: any = {
        diligence_id: diligenceId,
        response_id: responseId,
        content: req.content,
        selected_text: selectedText,
      };
      if (isReply) {
        params.parent_id = req.conversationUid;
      }
      this.questionnaireService.addReviewComment(params).subscribe(
        (response: any) => {
          if (callback && !isReply) callback();
          if (isReply) {
            // adding a reply won't change the editor text so call function from here
            this.bulkResolveCommentsAndUpdateValues(
              currentCommentIds,
              diligenceId,
              responseId,
              sectionId,
              questionId,
              parentQuestionId,
              editorText,
              responseType,
              editable,
              question
            );
            return done({
              commentUid: response.id,
            });
          }
          return done({
            conversationUid: response.id,
          });
        },
        (error: any) => fail(error)
      );
    } else {
      this.toaster.error(
        'Please select some text to add a review comment',
        '',
        {
          onActivateTick: true,
        }
      );
    }
  }

  editCommentHandler(
    req,
    done,
    fail,
    selectedText,
    diligenceId,
    responseId,
    userId
  ) {
    if (selectedText.replace(/&nbsp;/g, '').replace(/\s/g, '').length > 0) {
      const selectedComment = this.commentsLookup.comments.find(
        (comment) => comment.uid === req.commentUid
      );
      if (selectedComment.author === userId) {
        const params = {
          diligence_id: diligenceId,
          response_id: responseId,
          content: req.content,
          selected_text: selectedText,
          parent_id:
            Number(req.conversationUid) !== req.commentUid
              ? req.conversationUid
              : undefined,
        };
        this.questionnaireService
          .editReviewComment(req.commentUid, params)
          .subscribe(
            (response: any) => {
              return done({
                canEdit: true,
              });
            },
            (error: any) => fail(error)
          );
      } else {
        this.toaster.error('You are not authorized to edit this comment.', '', {
          onActivateTick: true,
        });
      }
    } else {
      this.toaster.error(
        'Please select some text to add a review comment',
        '',
        {
          onActivateTick: true,
        }
      );
    }
  }

  deleteCommentHandler(
    req,
    done,
    fail,
    isConversation = false,
    diligenceId = null,
    responseId = null,
    currentCommentIds = null,
    sectionId = null,
    questionId = null,
    parentQuestionId = null,
    editorText = null,
    responseType = null,
    editable = null,
    question,
    callback = null
  ) {
    this.questionnaireService
      .deleteReviewComment(
        isConversation ? req.conversationUid : req.commentUid
      )
      .subscribe(
        (response: any) => {
          if (callback && isConversation) callback();
          if (!isConversation) {
            // deleting a reply won't change the editor text so call function from here
            this.bulkResolveCommentsAndUpdateValues(
              currentCommentIds,
              diligenceId,
              responseId,
              sectionId,
              questionId,
              parentQuestionId,
              editorText,
              responseType,
              editable,
              question
            );
          }
          return done({
            canDelete: true,
          });
        },
        (error: any) => fail(error)
      );
  }

  resolveCommentHandler(
    req,
    done,
    fail,
    diligenceId,
    responseId,
    callback = null
  ) {
    const params = {
      diligence_id: diligenceId,
      response_id: responseId,
      is_resolved: true,
    };
    this.questionnaireService
      .editReviewComment(req.conversationUid, params)
      .subscribe(
        (response: any) => {
          if (callback) callback(); // to show updated resolved comments in the modal
          return done({
            canResolve: true,
          });
        },
        (error: any) => fail(error)
      );
  }

  lookupCommentsHandler(req, done, fail, diligenceId, responseId) {
    if (!responseId) return;
    this.questionnaireService
      .getReviewComments(diligenceId, responseId)
      .subscribe(
        (response: any[]) => {
          const conv: any = {
            uid: req.conversationUid,
            comments: response
              .filter(
                (comment) =>
                  comment.id === Number(req.conversationUid) ||
                  comment.parent_id === Number(req.conversationUid)
              )
              .map((comment: any) => {
                return {
                  author: comment.created_by,
                  authorName: comment.created_by_name,
                  createdAt: this.Utils.getLocalDateTime(comment.created_at)
                    .toDate()
                    .toISOString(),
                  content: comment.content,
                  modifiedAt:
                    comment.updated_at === null
                      ? this.Utils.getLocalDateTime(comment.created_at)
                          .toDate()
                          .toISOString()
                      : this.Utils.getLocalDateTime(comment.updated_at)
                          .toDate()
                          .toISOString(),
                  uid: comment.id + '',
                };
              }),
          };
          this.commentsLookup = conv;
          return done({ conversation: conv });
        },
        (error: any) => fail(error)
      );
  }

  bulkResolveCommentsAndUpdateValues(
    currentCommentIds,
    diligenceId,
    responseId,
    sectionId,
    questionId,
    parentQuestionId,
    editorText,
    responseType,
    editable,
    question
  ) {
    const params = {
      current_comment_ids: currentCommentIds,
    };
    responseType === ResponseType.TextMultiLine &&
      this.updateStateQuestionMap(question, editorText);
    this.questionnaireService
      .bulkResolveComments(diligenceId, responseId, params)
      .subscribe((res: any) => {
        const data = {
          response_comments_counts: res.response_comments_counts,
          response_unresolved_comments_counts:
            res.response_unresolved_comments_counts,
          editorText: editorText,
          updateTextResponse:
            responseType === ResponseType.TextMultiLine && editable,
        };
        this.store.dispatch(
          new UpdateReviewCommentsData(
            `${question.sequenceID}-${question.sectionID}-${question.id}`,
            sectionId,
            questionId,
            parentQuestionId,
            data
          )
        );
        let sectionFilter = JSON.parse(
          JSON.stringify(
            this.store.selectSnapshot(
              (state) => state.questionnaire.sectionFilterCounter
            )
          )
        );
        sectionFilter[questionId].unresolvedComments =
          res.response_unresolved_comments_counts;
        this.store.dispatch(new UpdateSectionFilterCounter(sectionFilter));
      });
  }

  updateStateQuestionMap(question, value) {
    const id = `${question.sequenceID}-${question.sectionID}-${question.id}`;
    value = value?.replace(' tox-comment--active', '');
    this.store.dispatch(
      new UpdateLocalQuestionMap(id, {
        responseText: value ? value : null,
        textResponse: value ? value : null,
      })
    );
  }

  updateTextmultilineResponse(questionId, id, question) {
    if (!(questionId in this.allTextMultilineResponse)) {
      this.allTextMultilineResponse[questionId] = true;
      question.answer.attributes.textResponse = (window as any).tinymce
        .get(id)
        ?.getContent()
        .replace(' tox-comment--active', '');
    }
  }

  clearMultiTextData() {
    this.allTextMultilineResponse = {};
    this.questionIdMultitextMap = {};
  }

  //#region CKEditor Comments Service

  addThread(
    data: any,
    diligence_id: number,
    response_id: number,
    isPermissionCheckCall: boolean = false
  ): Observable<any> {
    data.diligence_id = diligence_id;
    data.response_id = response_id;
    (data.comments as Array<any>).forEach((comment: any) => {
      comment.diligence_id = diligence_id;
      comment.response_id = response_id;
    });

    const options = {
      headers: new HttpHeaders(
        this.getPermissionCheckCallHeaders(isPermissionCheckCall)
      ),
    };

    return this.http.post(`${this.API_V2}/thread`, data, options);
  }

  updateThread(
    data: any,
    diligence_id: number,
    response_id: number,
    isPermissionCheckCall: boolean = false
  ): Observable<any> {
    data.diligence_id = diligence_id;
    data.response_id = response_id;
    const options = {
      headers: new HttpHeaders(
        this.getPermissionCheckCallHeaders(isPermissionCheckCall)
      ),
    };

    return this.http.put(`${this.API_V2}/thread`, data, options);
  }

  resolveThread(
    data: any,
    diligence_id: number,
    response_id: number,
    isPermissionCheckCall: boolean = false
  ): Observable<any> {
    const options = {
      params: {
        thread_id: data.thread_id,
      },
      headers: new HttpHeaders(
        this.getPermissionCheckCallHeaders(isPermissionCheckCall)
      ),
    };

    return this.http.put(
      `${this.API_V2}/diligence/${diligence_id}/responses/${response_id}/thread/resolve`,
      null,
      options
    );
  }

  resolveThreads(diligence_id: number, response_id: number): Observable<any> {
    return this.http.put(
      `${this.API_V2}/diligence/${diligence_id}/responses/${response_id}/threads/resolve`,
      null
    );
  }

  reopenThread(
    data: any,
    diligence_id: number,
    response_id: number
  ): Observable<any> {
    const options = {
      params: {
        thread_id: data.thread_id,
      },
    };
    return this.http.put(
      `${this.API_V2}/diligence/${diligence_id}/responses/${response_id}/thread/reopen`,
      null,
      options
    );
  }

  deleteThread(
    data: any,
    diligence_id: number,
    response_id: number,
    isPermissionCheckCall: boolean = false
  ): Observable<any> {
    const options = {
      params: {
        thread_id: data.thread_id,
      },
      headers: new HttpHeaders(
        this.getPermissionCheckCallHeaders(isPermissionCheckCall)
      ),
    };
    return this.http.delete(
      `${this.API_V2}/diligence/${diligence_id}/responses/${response_id}/thread`,
      options
    );
  }

  addComment(
    data: any,
    diligence_id: number,
    response_id: number,
    isPermissionCheckCall: boolean = false
  ): Observable<any> {
    data.diligence_id = diligence_id;
    data.response_id = response_id;
    const options = {
      headers: new HttpHeaders(
        this.getPermissionCheckCallHeaders(isPermissionCheckCall)
      ),
    };

    return this.http.post(`${this.API_V2}/comment`, data, options);
  }

  updateComment(
    data: any,
    diligence_id: number,
    response_id: number,
    isPermissionCheckCall: boolean = false
  ): Observable<any> {
    data.diligence_id = diligence_id;
    data.response_id = response_id;
    const options = {
      headers: new HttpHeaders(
        this.getPermissionCheckCallHeaders(isPermissionCheckCall)
      ),
    };

    return this.http.put(`${this.API_V2}/comment`, data, options);
  }

  deleteComment(
    data: any,
    diligence_id: number,
    response_id: number,
    isPermissionCheckCall: boolean = false
  ): Observable<any> {
    const options = {
      params: {
        thread_id: data.thread_id,
        comment_id: data.comment_id,
      },
      headers: new HttpHeaders(
        this.getPermissionCheckCallHeaders(isPermissionCheckCall)
      ),
    };
    return this.http.delete(
      `${this.API_V2}/diligence/${diligence_id}/responses/${response_id}/comment`,
      options
    );
  }

  getThread(
    data: any,
    diligence_id: number,
    response_id: number
  ): Observable<any> {
    const options = {
      params: {
        thread_id: data.thread_id,
      },
    };
    return this.http.get(
      `${this.API_V2}/diligence/${diligence_id}/responses/${response_id}/thread`,
      options
    );
  }

  /**
   * Get comment threads.
   * @param diligence_id The diligence id.
   * @param response_id The response id.
   * @param include_resolved_threads_only Determines whether to include resolved comments only or not.
   */
  getThreads(
    diligence_id: number,
    response_id: number,
    include_resolved_threads_only: boolean
  ): Observable<any>;
  /**
   * Get the comment threads, excluding the once which are mentioned in `excluded_thread_ids`
   * @param diligence_id The diligence id.
   * @param response_id The response id.
   * @param excluded_thread_ids The list of thread ids to exclude while fetching the result.
   */
  getThreads(
    diligence_id: number,
    response_id: number,
    excluded_thread_ids: Array<string>
  ): Observable<any>;
  getThreads(
    diligence_id: number,
    response_id: number,
    args: boolean | Array<string>
  ) {
    const options: any = {};
    // Fetch the active threads added without selecting any text incase of in-editor mode.
    if (Array.isArray(args)) {
      options.params = {
        excluded_thread_ids: args,
        fetch_excluded_threads_only: true,
      };
    } else {
      options.params = {
        include_resolved_threads_only: args,
      };
    }

    return this.http.get(
      `${this.API_V2}/diligence/${diligence_id}/responses/${response_id}/threads`,
      options
    );
  }

  getSuggestion(
    data: any,
    diligence_id: number,
    response_id: number
  ): Observable<any> {
    const options = {
      params: {
        suggestion_id: data.thread_id,
      },
    };
    return this.http.get(
      `${this.API_V2}/diligence/${diligence_id}/responses/${response_id}/suggestion`,
      options
    );
  }

  addSuggestion(
    data: any,
    diligence_id: number,
    response_id: number
  ): Observable<any> {
    data.diligence_id = diligence_id;
    data.response_id = response_id;
    return this.http.post(`${this.API_V2}/suggestion`, data);
  }

  updateSuggestion(
    data: any,
    diligence_id: number,
    response_id: number
  ): Observable<any> {
    data.diligence_id = diligence_id;
    data.response_id = response_id;
    return this.http.put(`${this.API_V2}/suggestion`, data);
  }

  syncSuggestion(
    data: any,
    diligence_id: number,
    response_id: number
  ): Observable<any> {
    data.diligence_id = diligence_id;
    data.response_id = response_id;
    return this.http.post(`${this.API_V2}/sync/suggestions`, data);
  }

  /**
   * Gets the backend returned comment thread formatted into the ck editor required one.
   * @param commentThread The comment thread that we get from backend.
   * @param utilsPlugin The ck editor utils plugin.
   * @returns The formatted comment thread required by ck editor.
   */
  getCKEditorFormattedThread(commentThread: any, utilsPlugin: DVUtils): any {
    return {
      threadId: commentThread.thread_id,
      comments:
        commentThread.comments && commentThread.comments.length
          ? commentThread.comments.map((c: any) => ({
              commentId: c.comment_id,
              authorId: c.created_by ? `${c.created_by}` : null,
              content: c.content,
              createdAt: utilsPlugin.getLocalDateTimeGeneric(c.created_at),
              attributes: JSON.parse(c.attributes),
            }))
          : [],
      // It defines the value on which the comment has been created initially.
      // If it is empty it will be set based on the comment marker.
      context: commentThread.selected_text
        ? JSON.parse(commentThread.selected_text)
        : commentThread.selected_text,
      unlinkedAt: utilsPlugin.getLocalDateTimeGeneric(
        commentThread.unlinked_at
      ),
      resolvedAt: utilsPlugin.getLocalDateTimeGeneric(
        commentThread.resolved_at
      ),
      resolvedBy: commentThread.resolved_by
        ? `${commentThread.resolved_by}`
        : null,
      attributes: JSON.parse(commentThread.attributes),
      isFromAdapter: true, // added during initialization, so do not call the adapter
    };
  }

  isCommentThreadAddedWithoutSelectingText(threadId: string): boolean {
    return threadId.includes(':');
  }

  private getPermissionCheckCallHeaders(isPermissionCheckCall: boolean): {
    [name: string]: string;
  } {
    return {
      'is-dummy-api-call': isPermissionCheckCall === true ? 'true' : 'false',
    };
  }

  //#endregion
}
