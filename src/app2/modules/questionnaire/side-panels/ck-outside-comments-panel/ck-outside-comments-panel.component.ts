import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { Store } from '@ngxs/store';
import { Context, ContextConfig, EditorConfig } from 'ckeditor5';
import {
  CommentThread,
  CommentThreadController,
} from 'ckeditor5-premium-features';
// import CommentsArchiveUI from '@ckeditor/ckeditor5-comments/src/comments/commentsarchiveui';
import { tap } from 'rxjs/operators';
import { formatRelative, parseJSON } from 'date-fns';
import { ToastrService } from 'ngx-toastr';

import { DVUtils } from 'src/app2/shared/components/editor/plugins';
import { QuestionAttributeType } from '../../types/questions.type';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { ConfigBuilder } from 'src/app2/shared/components/editor/models/config-builder.model';
import { ReviewCommentsService } from '../../service/review-comments.service';
import { ReviewService } from '../../service/review.service';
import { QuestionnaireStatusService } from '../../service/status.service';
import { GetQuestionCount } from '../../store/questionnaire.action';
import { CKEditorPermissionService } from 'src/app2/services/ck-editor/ckeditor-permission.service';
import { CKEditorUtilService } from 'src/app2/services/ck-editor/ckeditor-util.service';
import { UnsupportedResponseTypes } from '../../constants/question-status.constant';

type TabType = 'comments' | 'comments-archive';

@Component({
  selector: 'ck-outside-comments-panel',
  templateUrl: './ck-outside-comments-panel.component.html',
  styleUrls: ['./ck-outside-comments-panel.component.css'],
})
export class CkOutsideCommentsPanelComponent
  implements AfterViewInit, OnDestroy
{
  @Input() question: QuestionAttributeType;
  @Input('mentionsList') mentionsList: Array<any> = [];
  @Input() onSuccess: (operationType: 'add' | 'delete' | 'resolveAll') => void;

  @ViewChild('commentsContainer', { static: true, read: ElementRef })
  commentsContainer: ElementRef<HTMLElement>;
  @ViewChild('commentsArchiveListContainer', { static: true, read: ElementRef })
  commentsArchiveListContainer: ElementRef<HTMLElement>; // Container for the resolved comment threads annotations.
  annotationTarget: HTMLElement;

  tab: TabType = 'comments';
  context: Context;
  channelId: string = '';
  commentThreads: Array<CommentThread> = []; // Store all the comment threads
  resolvedCommentThreads: Array<CommentThread> = [];
  remoteThreadsLoaded: boolean = false;
  activeThreadId: string;
  isAnyOpenCommentsAvailable: boolean = false;
  openThreadCount: number = 0;

  observer: ResizeObserver;

  diligenceId: number;
  responseId: number;

  //#region Question navigation control props

  isClickedOnQuestionNavigationControls: boolean = false;
  allQuestions: Array<QuestionAttributeType | any> = [];
  previousQuestion: QuestionAttributeType;
  nextQuestion: QuestionAttributeType;
  isPreviousButtonDisabled = true;
  isNextButtonDisabled = true;
  activeQuestionIndex: number;
  apiCallsInProgress: boolean = false;

  //#endregion

  constructor(
    private readonly store: Store,
    private readonly toaster: ToastrService,
    private readonly sidePanelService: SidePanelService,
    private readonly reviewCommentsService: ReviewCommentsService,
    private readonly reviewService: ReviewService,
    private readonly ckEditorUtilService: CKEditorUtilService,
    private readonly questionnaireStatusService: QuestionnaireStatusService,
    private readonly ckEditorPermissionService: CKEditorPermissionService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngAfterViewInit(): void {
    this.diligenceId = this.store.selectSnapshot(
      (state) => state.questionnaire.diligenceId
    );
    this.responseId = this.question.answer.attributes.id;
    this.openThreadCount =
      this.question.answer.attributes.response_unresolved_comments_counts ?? 0;
    this.annotationTarget = this.document.getElementById(
      'ck-comment-target-' + this.question.id
    );

    const config = new ConfigBuilder()
      .addOutsideEditorPlugins()
      .addOutsideEditorSidebar(this.commentsContainer.nativeElement)
      .addOutsideComments()
      .getConfig() as ContextConfig;

    delete config.placeholder;
    delete config.initialData;

    this.ckEditorUtilService.addUsers(config);
    this.addMentionList(config);
    this.addDVCommentsConfig(config);
    Context.create(config).then((context) => {
      this.context = context;
      this.initCommentHandlers();
      this.initRemoteCommentThreads();

      setTimeout(() => {
        this.initializeQuestionNavigationData();
      }, 1000);
    });
  }

  onCancel() {
    this.sidePanelService.close();
  }

  //#region Comments archive toggle

  handleTabClick(tab: TabType): void {
    if (tab === this.tab) {
      return;
    }

    this.tab = tab;
  }

  //#endregion

  //#region Previous and Next button handlers

  initializeQuestionNavigationData(): void {
    this.reviewService.initializeQuestionNavigationData(this.question);
    const { previous, next } = this.reviewService.getPreviousNextQuestion(
      this.question
    );
    this.previousQuestion = previous;
    this.nextQuestion = next;
    this.activeQuestionIndex = this.question.index;
    this.isPreviousButtonDisabled = !previous;
    this.isNextButtonDisabled = !next;
  }

  navigateToPreviousQuestion(): void {
    this.isClickedOnQuestionNavigationControls = true;
    this.reviewService.activateRequiredQuestion(false);
  }

  navigateToNextQuestion(): void {
    this.isClickedOnQuestionNavigationControls = true;
    this.reviewService.activateRequiredQuestion(true);
  }

  //#endregion

  //#region Add Comment

  addComment(): void {
    if (!this.ckEditorPermissionService.canPerformOperationsOnComments) {
      this.toaster.error('You are not authorised to make this request!');
      return;
    }

    this.handleTabClick('comments'); // Switch tab to open comments
    const commentsRepository = this.context.plugins.get('CommentsRepository');
    const threadId = `${this.question.id}:${new Date().getTime()}`;
    const contextValue = UnsupportedResponseTypes.includes(
      this.question.answer.attributes.response_type as any
    )
      ? 'General comment (no text selected)'
      : this.question.answer.attributes.responseText;

    // Added timeout because the newly created annotation was not
    // getting focused on creation.
    setTimeout(() => {
      commentsRepository.openNewCommentThread({
        channelId: this.channelId,
        threadId,
        target: this.annotationTarget,
        context: {
          type: 'text',
          value: contextValue,
        },
        isResolvable: true,
      });

      setTimeout(() => {
        this.ckEditorUtilService.scrollToBottom(
          this.commentsContainer.nativeElement
        );
      });
    });
  }

  initAddCommentOnLoad(): void {
    if (
      this.isAnyOpenCommentsAvailable ||
      !this.ckEditorPermissionService.canPerformOperationsOnComments
    ) {
      return;
    }

    this.addComment();
  }

  //#endregion

  //#region Bulk resolve comments

  checkForOpenComments(): void {
    const commentsRepositoryPlugin =
      this.context.plugins.get('CommentsRepository');
    this.isAnyOpenCommentsAvailable = commentsRepositoryPlugin
      .getCommentThreads()
      .some((thread) => !thread.isResolved);
  }

  resolveComments(): void {
    if (!this.ckEditorPermissionService.canPerformOperationsOnComments) {
      this.toaster.error('You are not authorised to make this request!');
      return;
    }

    const commentsRepositoryPlugin =
      this.context.plugins.get('CommentsRepository');

    const activeCommntThreads = commentsRepositoryPlugin
      .getCommentThreads()
      .filter((commentThread) => !commentThread.isResolved);

    if (!activeCommntThreads.length) {
      return; // Return as there are no open comments to resolve.
    }

    this.apiCallsInProgress = true;
    this.diligenceId = this.store.selectSnapshot(
      (state) => state.questionnaire.diligenceId
    );
    const responseId = this.question.answer.attributes.id;
    const channelId: string = '';
    this.reviewCommentsService
      .resolveThreads(this.diligenceId, responseId)
      .subscribe((response: any) => {
        for (const commentThread of activeCommntThreads) {
          // Mark the comment as resolved
          commentThread.resolve({ isFromAdapter: true });

          // Mark the comment as unlinked
          commentsRepositoryPlugin.updateCommentThread({
            channelId: channelId,
            threadId: commentThread.id,
            unlinkedAt: new Date(),
            isFromAdapter: true, // `isFromAdapter = true` stops execution of adapter methods
          });
        }

        this.store.dispatch(new GetQuestionCount());
        this.onSuccess('resolveAll');
        this.checkForOpenComments();
        this.apiCallsInProgress = false;
      });
  }

  //#endregion

  //#region Comment Thread handlers

  setActiveThreadId(threadId: string): void {
    this.activeThreadId = threadId;
  }

  initRemoteCommentThreads(): void {
    if (!this.diligenceId || !this.responseId) {
      return;
    }

    const commentsRepository = this.context.plugins.get('CommentsRepository');
    const utilsPlugin = this.context.plugins.get(DVUtils);
    const channelId: string = '';
    const today = new Date();
    this.reviewCommentsService
      .getThreads(this.diligenceId, this.responseId, false)
      .subscribe((commentThreadsData: any) => {
        const resolvedThreads = [];
        const activeThreads = [];
        for (const thread of commentThreadsData) {
          if (thread.resolved_by !== null) {
            resolvedThreads.push(thread);
          } else {
            activeThreads.push(thread);
          }
        }

        commentThreadsData = [...activeThreads, ...resolvedThreads];
        for (const commentThread of commentThreadsData) {
          const thread = this.reviewCommentsService.getCKEditorFormattedThread(
            commentThread,
            utilsPlugin
          );

          commentsRepository.addCommentThread({
            channelId,
            ...thread,
            target: this.annotationTarget,
          });
        }

        this.resolvedCommentThreads = commentsRepository
          .getCommentThreads()
          .filter((thread) => thread.isResolved)
          .map((thread) => {
            (thread as any).resolvedAtInWords = this.getDateInWords(
              thread.resolvedAt as any,
              today
            );
            ((thread.comments as any)._items as Array<any>).forEach(
              (comment: any) => {
                comment.createdAtInWords = this.getDateInWords(
                  comment.createdAt,
                  today
                );
              }
            );

            (thread as any).headerText = this.getHeaderText(
              (thread as any).context.value
            );

            return thread;
          });
        this.remoteThreadsLoaded = true;
        this.checkForOpenComments();
        this.initAddCommentOnLoad();

        // Added height observer to reset height to minimum required
        // as ckeditor keeps increasing the height even if user cancels
        // the add comment operation
        this.addResizeObserver();
        this.updateCommentStateBasedOnPermissions();
      });
  }

  initCommentHandlers(): void {
    const commentsRepository = this.context.plugins.get('CommentsRepository');

    commentsRepository.on(
      'addCommentThread',
      (evt, { threadId }) => {
        this.handleNewCommentThread(threadId);
      },
      { priority: 'low' }
    );

    commentsRepository.on(
      'removeCommentThread',
      (evt, { threadId }) => {
        this.handleRemovedCommentThread(threadId);
      },
      { priority: 'low' }
    );

    commentsRepository.on(
      'resolveCommentThread',
      (evt, { threadId }) => {
        this.handleRemovedCommentThread(threadId);
        this.handleCustomUI(threadId);
      },
      { priority: 'low' }
    );

    commentsRepository.on(
      'reopenCommentThread',
      (evt, { threadId }) => {
        this.handleNewCommentThread(threadId);
      },
      { priority: 'low' }
    );
  }

  handleNewCommentThread(threadId: string): void {
    const commentsRepository = this.context.plugins.get('CommentsRepository');
    const annotations = this.context.plugins.get('Annotations');
    const thread = commentsRepository.getCommentThread(threadId);

    // If the thread is not attached yet, attach it.
    // This is the difference between local and remote comments.
    // Locally created comments are attached in the `openNewCommentThread()` call.
    // Remotely created comments need to be attached when they are received.
    if (!thread.isAttached) {
      thread.attachTo(() => (thread.isResolved ? null : this.annotationTarget));
    }

    // When an annotation is created or reopened we need to bound its focus manager with the field.
    // Thanks to that, the annotation will be focused whenever the field is focused as well.
    // However, this can be done only for one annotation, so we do it only if there are no open
    // annotations for a given field.
    if (!this.commentThreads.length && !thread.isResolved) {
      const threadView = (
        (commentsRepository as any)._threadToController.get(
          thread
        ) as CommentThreadController
      ).view;
      const annotation = annotations.collection.getByInnerView(threadView);

      annotation.focusableElements.add(this.annotationTarget);
    }

    if (!thread.isResolved) {
      this.commentThreads.push(thread);
    }
  }

  handleRemovedCommentThread(threadId: string): void {
    const commentsRepository = this.context.plugins.get('CommentsRepository');
    const annotations = this.context.plugins.get('Annotations');

    const threadIndex = this.commentThreads.findIndex(
      (thread) => thread.id === threadId
    );

    // Remove the comment thread from the list
    this.commentThreads = this.commentThreads.filter(
      (thread) => thread.id !== threadId
    );

    // In `handleNewCommentThread` we bound the first comment thread annotation focus manager with the field.
    // If we are removing that comment thread, we need to handle field focus as well.
    // After removing or resolving the first thread you should field focus to the next thread's annotation.
    if (threadIndex === 0) {
      const thread = commentsRepository.getCommentThread(threadId);
      const threadController = (
        commentsRepository as any
      )._threadToController.get(thread) as CommentThreadController;

      // Remove the old binding between removed annotation and field.
      if (threadController) {
        const threadView = threadController.view;
        const annotation = annotations.collection.getByInnerView(threadView);

        annotation.focusableElements.remove(this.annotationTarget);
      }

      const newActiveThread = this.commentThreads[0];

      // If there other open threads, bind another annotation to the field.
      if (newActiveThread) {
        const newThreadView = (
          (commentsRepository as any)._threadToController.get(
            newActiveThread
          ) as CommentThreadController
        ).view;
        const newAnnotation =
          annotations.collection.getByInnerView(newThreadView);

        newAnnotation.focusableElements.add(this.annotationTarget);
      }
    }
  }

  //#endregion

  //#region editor configs

  private addDVCommentsConfig(config: EditorConfig): void {
    config.dvComments = {
      addComment: (data: any) => {
        return this.reviewCommentsService
          .addComment(data, this.diligenceId, this.responseId)
          .toPromise();
      },

      updateComment: (data: any) => {
        return this.reviewCommentsService
          .updateComment(data, this.diligenceId, this.responseId)
          .toPromise();
      },

      removeComment: (data: any) => {
        return this.reviewCommentsService
          .deleteComment(data, this.diligenceId, this.responseId)
          .toPromise();
      },

      addCommentThread: (data: any) => {
        return this.reviewCommentsService
          .addThread(data, this.diligenceId, this.responseId)
          .pipe(
            tap((response: any) => {
              this.checkForOpenComments();
              this.onSuccess('add');
              this.store.dispatch(new GetQuestionCount());
            })
          )
          .toPromise();
      },

      getCommentThread: (data: any) => {
        return this.reviewCommentsService
          .getThread(data, this.diligenceId, this.responseId)
          .toPromise();
      },

      updateCommentThread: (data: any) => {
        return this.reviewCommentsService
          .updateThread(data, this.diligenceId, this.responseId)
          .toPromise();
      },

      resolveCommentThread: (data: any) => {
        return this.reviewCommentsService
          .resolveThread(data, this.diligenceId, this.responseId)
          .pipe(
            tap((response: any) => {
              this.checkForOpenComments();
              this.onSuccess('delete');
              this.store.dispatch(new GetQuestionCount());
            })
          )
          .toPromise();
      },

      reopenCommentThread: (data: any) => {
        return this.reviewCommentsService
          .reopenThread(data, this.diligenceId, this.responseId)
          .toPromise();
      },

      removeCommentThread: (data: any) => {
        return this.reviewCommentsService
          .deleteThread(data, this.diligenceId, this.responseId)
          .pipe(
            tap((response: any) => {
              this.checkForOpenComments();
              this.onSuccess('delete');
              this.store.dispatch(new GetQuestionCount());
            })
          )
          .toPromise();
      },
    };
  }

  private addMentionList(config?: EditorConfig): void {
    if (!this.mentionsList || this.mentionsList.length === 0) {
      this.mentionsList = this.ckEditorUtilService.getUserMentionList();
    }

    if (config) {
      config.comments.editorConfig.mention.feeds[0].feed = this.mentionsList;
    }
  }

  //#endregion

  //#region Utils

  private getDateInWords(date: string, baseDate: Date): string {
    let dateInWords = formatRelative(parseJSON(date), baseDate);

    dateInWords = dateInWords.replace('at ', '');
    if (dateInWords.endsWith(' AM')) {
      dateInWords = dateInWords.replace(' AM', 'AM');
    } else if (dateInWords.endsWith(' am')) {
      dateInWords = dateInWords.replace(' am', 'AM');
    }

    if (dateInWords.endsWith(' PM')) {
      dateInWords = dateInWords.replace(' PM', 'PM');
    } else if (dateInWords.endsWith(' pm')) {
      dateInWords = dateInWords.replace(' pm', 'PM');
    }

    const dateParts = dateInWords.split(' ');
    for (let idx = 0; idx < dateParts.length - 1; idx++) {
      dateParts[idx] =
        dateParts[idx].charAt(0).toUpperCase() + dateParts[idx].slice(1);
    }

    return dateParts.join(' ');
  }

  private handleCustomUI(threadId: string): void {
    const today = new Date();
    const commentsRepository = this.context.plugins.get('CommentsRepository');

    // Add the comment thread to resolved comments list
    // to create custom resolved UI.
    const thread = commentsRepository.getCommentThread(threadId);
    (thread as any).resolvedAtInWords = this.getDateInWords(
      thread.resolvedAt as any,
      today
    );
    ((thread.comments as any)._items as Array<any>).forEach((comment: any) => {
      comment.createdAtInWords = this.getDateInWords(comment.createdAt, today);
    });
    (thread as any).headerText = this.getHeaderText(
      (thread as any).context.value
    );
    this.resolvedCommentThreads.push(thread);

    // Destroy the annotation from the open tab.
    this.destroyAnnotation(threadId);
  }

  private destroyAnnotation(threadId: string): void {
    const commentsRepository = this.context.plugins.get('CommentsRepository');
    const annotations = this.context.plugins.get('Annotations');
    const thread = commentsRepository.getCommentThread(threadId);
    const threadController = (
      commentsRepository as any
    )._threadToController.get(thread) as CommentThreadController;

    if (threadController) {
      const threadView = threadController.view;
      const annotation = annotations.collection.getByInnerView(threadView);
      annotations.collection.remove(annotation);

      // [TODO]: This is just a hot-fix to move resolved comment to archived container.
      // Check for archived plugin support from CKEditor for outside editor comment.
      // this.commentsArchiveListContainer.nativeElement.appendChild(
      //   annotation.view.element
      // );
      // annotation.destroy();
    }
  }

  //#endregion

  /**
   * Expands the header text, if it is overflowing as per the
   * original CKEditor source.
   * @param event The `MouseEvent`.
   */
  showHeaderText(event: MouseEvent): void {
    const ck_context_element = event.target as HTMLDivElement;
    switch (event.type) {
      case 'mouseenter':
        const ck_context_value_element = ck_context_element.querySelector(
          '.ck-context__value'
        ) as HTMLSpanElement;
        if (
          ck_context_value_element.offsetWidth <
          ck_context_value_element.scrollWidth
        ) {
          ck_context_element.classList.add('overlay');
        }
        break;
      case 'mouseleave':
        ck_context_element.classList.remove('overlay');
        break;
    }
  }

  /**
   * Gets the truncated header text as per the original
   * CKEditor source.
   * @param text The header text.
   * @returns The truncated header text.
   */
  getHeaderText(text: string): string {
    if (text.length < 150) return text;
    const lastIndex = text.lastIndexOf(' ', 147);
    return text.substring(0, lastIndex > -1 ? lastIndex : 147) + '...';
  }

  private addResizeObserver(): void {
    const element = this.commentsContainer?.nativeElement
      ?.firstChild as HTMLDivElement;
    if (!element) {
      return;
    }

    this.observer = new ResizeObserver((_) => {
      element.style.minHeight = 'fit-content';
    });

    this.observer.observe(element);
  }

  /**
   * Updates the state of comments based on user privileges.
   */
  private updateCommentStateBasedOnPermissions(): void {
    const commentsRepository = this.context.plugins.get('CommentsRepository');
    const activeThreads = commentsRepository
      .getCommentThreads()
      .filter((thread) => !thread.isResolved);
    activeThreads.forEach((thread) => {
      thread.isReadOnly =
        !this.ckEditorPermissionService.canPerformOperationsOnComments;
    });
  }

  ngOnDestroy(): void {
    const element = this.commentsContainer?.nativeElement
      ?.firstChild as HTMLDivElement;
    if (element) {
      this.observer?.unobserve(element);
    }
  }
}
