import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { ClassicEditor } from 'ckeditor5';
import { CommentsRepository, TrackChanges } from 'ckeditor5-premium-features';
import Sidebar from '@ckeditor/ckeditor5-comments/src/annotations/sidebar';
import CommentsArchiveUI from '@ckeditor/ckeditor5-comments/src/comments/commentsarchiveui';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';

import { DVUtils } from 'src/app2/shared/components/editor/plugins';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { QuestionAttributeType } from '../../types/questions.type';
import { ReviewCommentsService } from '../../service/review-comments.service';
import { ReviewService } from '../../service/review.service';
import { CKEditorMessageService } from 'src/app2/services/ck-editor/ckeditor-message.service';
import { QuestionnaireStatusService } from '../../service/status.service';
import {
  AddCommentData,
  CKEditorMessageData,
} from 'src/app2/shared/models/ckeditor.model';
import { CKEditorInstanceManagerService } from 'src/app2/services/ck-editor/ckeditor-instance-manager.service';
import { CKEditorPermissionService } from 'src/app2/services/ck-editor/ckeditor-permission.service';
import { CKEditorUtilService } from 'src/app2/services/ck-editor/ckeditor-util.service';

type TabType = 'comments' | 'comments-archive';

@Component({
  selector: 'ck-comments-panel',
  templateUrl: './ck-comments-panel.component.html',
  styleUrls: ['./ck-comments-panel.component.css'],
})
export class CkCommentsPanelComponent
  implements AfterViewInit, OnDestroy, OnInit
{
  private _destroy$: Subject<void> = new Subject<void>();

  @Input() question: QuestionAttributeType;
  @Input() addCommentConfig: AddCommentData;
  @Input() onClose: () => {};
  @Input() onSuccess: (operationType: 'add' | 'delete' | 'resolveAll') => void;

  @ViewChild('commentsContainer', { read: ElementRef })
  commentsContainer: ElementRef<HTMLElement>;
  @ViewChild('commentsArchiveListContainer', { read: ElementRef })
  commentsArchiveListContainer: ElementRef<HTMLElement>; // Container for the resolved comment threads annotations.
  diligenceId: number;
  responseId: number;
  tab: TabType = 'comments';
  annotationTarget: HTMLElement;

  //#region Question navigation control props

  isClickedOnQuestionNavigationControls: boolean = false;
  allQuestions: Array<QuestionAttributeType | any> = [];
  previousQuestion: QuestionAttributeType;
  nextQuestion: QuestionAttributeType;
  isPreviousButtonDisabled = true;
  isNextButtonDisabled = true;
  activeQuestionIndex: number;
  isAnyOpenCommentsAvailable: boolean = false;
  apiCallsInProgress: boolean = false;
  showLoader: boolean = false;

  //#endregion

  //#region Outside editor comment props

  isOutsideEditorComment: boolean = false;

  //#endregion

  editor: ClassicEditor = null;
  commentsRepositoryPlugin: CommentsRepository = null;
  commentsArchiveUI: CommentsArchiveUI = null;
  trackChanges: TrackChanges = null;
  utilsPlugin: DVUtils = null;
  observer: ResizeObserver;

  constructor(
    private readonly sidePanelService: SidePanelService,
    private readonly reviewCommentsService: ReviewCommentsService,
    private readonly reviewService: ReviewService,
    private readonly ckEditorMessageService: CKEditorMessageService,
    private readonly questionnaireStatusService: QuestionnaireStatusService,
    private readonly store: Store,
    private readonly toaster: ToastrService,
    private readonly ckEditorUtilService: CKEditorUtilService,
    private readonly ckEditorPermissionService: CKEditorPermissionService,
    private readonly ckeditorInstanceManagerService: CKEditorInstanceManagerService,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    if (this.question && this.question.responseType !== 'TextMultiLine') {
      this.isOutsideEditorComment = true;
      return;
    }

    // Checks whether the response is updated or not
    // To enable to state of `Resolve All Comment` button
    if (!this.isOutsideEditorComment) {
      this.ckEditorMessageService.onMessageReceived
        .pipe(takeUntil(this._destroy$))
        .subscribe((message: CKEditorMessageData) => {
          if (
            message.source === 'text-multiline-response' &&
            message.data === 'responseUpdated'
          ) {
            this.apiCallsInProgress = false; // Enable the `Resolve All Comments` button after saving the response
            this.showLoader = false;
          }

          if (
            message.source === 'text-multiline-response' &&
            message.data === 'showLoader'
          ) {
            this.showLoader = true;
          }
        });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeSidebar();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.isOutsideEditorComment) {
      return;
    }

    this.removeEditorListeners();
    this._destroy$.next();
    this._destroy$.complete();

    this.editor = null;
    this.commentsRepositoryPlugin = null;
    this.commentsArchiveUI = null;
    this.trackChanges = null;
    this.utilsPlugin = null;

    // Check why this is getting called when we close and open the side-panel again
    const element = this.commentsContainer?.nativeElement
      ?.firstChild as HTMLDivElement;
    if (element) {
      this.observer?.unobserve(element);
    }
  }

  getEditorInstance(): ClassicEditor {
    return this.ckeditorInstanceManagerService.getEditorInstance(
      this.question.uniqueQuestionId
    );
  }

  initializeSidebar(): void {
    this.editor = this.getEditorInstance();
    if (!this.editor || this.isOutsideEditorComment) {
      return;
    }

    setTimeout(() => {
      this.addResizeObserver();
      this.initializeQuestionNavigationData();
    }, 1000);

    this.diligenceId = this.store.selectSnapshot(
      (state) => state.questionnaire.diligenceId
    );
    this.responseId = this.question.answer.attributes.id;

    this.annotationTarget = this.document.getElementById(
      'ck-comment-target-' + this.question.id
    );

    const sidebarPlugin = this.editor.plugins.get('Sidebar') as Sidebar;
    const annotationUIsPlugin = this.editor.plugins.get('AnnotationsUIs');

    sidebarPlugin.setContainer(this.commentsContainer.nativeElement);
    annotationUIsPlugin.switchTo('wideSidebar');

    this.trackChanges = this.editor.plugins.get('TrackChanges') as TrackChanges;
    this.commentsRepositoryPlugin =
      this.editor.plugins.get('CommentsRepository');
    this.utilsPlugin = this.editor.plugins.get(DVUtils);

    // The `CommentsArchiveUI` plugin handles all annotation views that can be used
    // to render resolved comment threads inside the comments archive container.
    this.commentsArchiveUI = this.editor.plugins.get(
      'CommentsArchiveUI'
    ) as CommentsArchiveUI;

    this.initCommentsArchive();

    // Render add comment annotation, if addCommentConfig.source === 'editor-toolbar'
    if (
      this.addCommentConfig &&
      this.addCommentConfig.source === 'editor-toolbar'
    ) {
      // Added delay to render the side-panel first.
      setTimeout(() => {
        this.addComment();
      }, 500);
    }

    // Close side-panel
    // The editor instance will not get destroyed, until a new editor is instantiated.
    // So, this is not needed as the editor instance will always be there.
    // editor.on('change:state', this.handleStateChange);

    this.initCommentHandlers();
    this.initResolvedRemoteComments();
    this.initAddCommentEventListener();
  }

  // Used as property to stop the listener on side-panel close.
  handleStateChange = (
    eventInfo,
    name: string,
    value: string,
    oldValue: string
  ) => {
    // No need to close side-panel when user clicks on Navigation button
    // because the user experience will not be smooth.
    if (value === 'destroyed' && !this.isClickedOnQuestionNavigationControls) {
      this.onCancel();
    }
  };

  onCancel() {
    this.onClose();
    this.sidePanelService.close();
  }

  // Remove the state change listener.
  // Otherwise, it will get cached.
  removeEditorListeners(): void {
    if (this.editor) {
      this.editor.off('change:state', this.handleStateChange);
    }

    if (this.commentsArchiveUI) {
      this.commentsArchiveUI.annotationViews.off(
        'add',
        this.commentsArchiveOnAddCallback
      );
      this.commentsArchiveUI.annotationViews.off(
        'remove',
        this.commentsArchiveOnRemoveCallback
      );
    }

    if (this.commentsRepositoryPlugin) {
      this.commentsRepositoryPlugin.off(
        'addCommentThread',
        this.addCommentThreadCallback
      );
      this.commentsRepositoryPlugin.off(
        'removeCommentThread',
        this.removeCommentThreadCallback
      );
      this.commentsRepositoryPlugin.off(
        'resolveCommentThread',
        this.resolveCommentThreadCallback
      );
      this.commentsRepositoryPlugin.off(
        'reopenCommentThread',
        this.reopenCommentThreadCallback
      );
    }
  }

  //#region Comments archive toggle

  handleTabClick(tab: TabType): void {
    if (tab === this.tab) {
      return;
    }

    this.tab = tab;
  }

  initCommentsArchive(): void {
    // Container for the resolved comment threads annotations.
    const commentsArchiveList = this.commentsArchiveListContainer.nativeElement;

    // First, handle the initial resolved comment threads.
    for (const annotationView of this.commentsArchiveUI.annotationViews) {
      commentsArchiveList.appendChild(annotationView.element);
    }

    // Handler to append new resolved thread inside the comments archive custom view.
    this.commentsArchiveUI.annotationViews.on(
      'add',
      this.commentsArchiveOnAddCallback
    );

    // Handler to remove the element when thread has been removed or reopened.
    this.commentsArchiveUI.annotationViews.on(
      'remove',
      this.commentsArchiveOnRemoveCallback
    );
  }

  commentsArchiveOnAddCallback = (_: any, annotationView: any) => {
    // Container for the resolved comment threads annotations.
    const commentsArchiveList = this.commentsArchiveListContainer.nativeElement;
    if (!commentsArchiveList.contains(annotationView.element)) {
      commentsArchiveList.appendChild(annotationView.element);
    }
  };

  commentsArchiveOnRemoveCallback = (_: any, annotationView: any) => {
    // Container for the resolved comment threads annotations.
    const commentsArchiveList = this.commentsArchiveListContainer.nativeElement;
    if (commentsArchiveList.contains(annotationView.element)) {
      commentsArchiveList.removeChild(annotationView.element);
    }
  };

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

  //#region Bulk resolve comments

  resolveComments(): void {
    if (!this.ckEditorPermissionService.canPerformOperationsOnComments) {
      this.toaster.error('You are not authorised to make this request!');
      return;
    }

    const suggestionIds = this.getSuggestionIds();
    const activeCommntThreads = this.commentsRepositoryPlugin
      .getCommentThreads()
      .filter(
        (commentThread) =>
          !commentThread.isResolved && !suggestionIds.includes(commentThread.id)
      );

    if (!activeCommntThreads.length) {
      return; // Return as there are no open comments to resolve.
    }

    this.apiCallsInProgress = true; // This will get updated to `false` after the response gets updated from text-multiline-component
    const channelId: string = '';
    this.reviewCommentsService
      .resolveThreads(this.diligenceId, this.responseId)
      .subscribe((response: any) => {
        for (const commentThread of activeCommntThreads) {
          // Mark the comment as resolved
          commentThread.resolve({ isFromAdapter: true });

          // Mark the comment as unlinked
          this.commentsRepositoryPlugin.updateCommentThread({
            channelId: channelId,
            threadId: commentThread.id,
            unlinkedAt: new Date(),
            isFromAdapter: true, // `isFromAdapter = true` stops execution of adapter methods
          });
        }

        // Save the response
        // `text-multiline-response` component will capture this event and update the
        // response accordingly in a single API call after removing all the comment markers
        this.ckEditorMessageService.sendMessage({
          source: 'ck-comments-panel',
          data: {
            eventType: 'bulkResolvedComment',
            textMultilineEditorId: this.question.uniqueQuestionId,
          },
        });
        this.checkForOpenComments();
      });
  }

  //#endregion

  //#region Init comment handlers

  initCommentHandlers(): void {
    this.commentsRepositoryPlugin.on(
      'addCommentThread',
      this.addCommentThreadCallback,
      { priority: 'low' }
    );

    this.commentsRepositoryPlugin.on(
      'removeCommentThread',
      this.removeCommentThreadCallback,
      { priority: 'low' }
    );

    this.commentsRepositoryPlugin.on(
      'resolveCommentThread',
      this.resolveCommentThreadCallback,
      { priority: 'low' }
    );

    this.commentsRepositoryPlugin.on(
      'reopenCommentThread',
      this.reopenCommentThreadCallback,
      { priority: 'low' }
    );
  }

  addCommentThreadCallback = (evt: any, { threadId }) => {
    this.checkForOpenComments();
  };

  removeCommentThreadCallback = (evt: any, { threadId }) => {
    this.checkForOpenComments();
  };

  resolveCommentThreadCallback = (evt: any, { threadId }) => {
    const thread = this.commentsRepositoryPlugin.getCommentThread(threadId);
    if (
      this.reviewCommentsService.isCommentThreadAddedWithoutSelectingText(
        thread.id
      )
    ) {
      thread.unlinkedAt = thread.resolvedAt ?? null;
    }

    thread.isReadOnly = true; // Mark it as readonly to remove the reply option.
    this.checkForOpenComments();
  };

  reopenCommentThreadCallback = (evt: any, { threadId }) => {
    this.checkForOpenComments();
  };

  checkForOpenComments(): void {
    const suggestionIds = this.getSuggestionIds();
    this.isAnyOpenCommentsAvailable = this.commentsRepositoryPlugin
      .getCommentThreads()
      .some(
        (thread) => !thread.isResolved && !suggestionIds.includes(thread.id)
      );
  }

  getSuggestionIds(): Array<string> {
    return this.trackChanges
      .getSuggestions({ skipNotAttached: true, toJSON: true })
      .map((suggestion) => suggestion.id);
  }

  //#endregion

  //#region Init remote comments that are resolved

  initResolvedRemoteComments(): void {
    if (!this.editor) {
      return;
    }

    this.reviewCommentsService
      .getThreads(this.diligenceId, this.responseId, true)
      .subscribe((commentThreadsData: Array<any>) => {
        for (const commentThread of commentThreadsData) {
          this.addCommentToCommentRepository(commentThread);
        }

        this.commentsRepositoryPlugin
          .getCommentThreads()
          .filter((thread) => thread.isResolved)
          .map((thread) => {
            thread.isReadOnly = true; // Mark it as readonly to remove the reply option.
            return thread;
          });

        this.initOutsideActiveComments();
        this.checkForOpenComments();
      });
  }

  addCommentToCommentRepository(commentThread: any): void {
    const thread = this.reviewCommentsService.getCKEditorFormattedThread(
      commentThread,
      this.utilsPlugin
    );

    if (!this.commentsRepositoryPlugin.hasCommentThread(thread.threadId)) {
      // Add annotation target to threads which are added without selecting
      // any text to display it in the archive panel.
      if (
        this.reviewCommentsService.isCommentThreadAddedWithoutSelectingText(
          thread.threadId
        )
      ) {
        thread.target = this.annotationTarget;
        thread.unlinkedAt = thread.resolvedAt || null;
      }

      this.commentsRepositoryPlugin.addCommentThread(thread);
    }
  }

  //#endregion

  //#region Add comment and side-panel state handler

  addComment(): void {
    if (!this.editor) {
      return;
    }

    this.editor.execute('addCommentThread');
    setTimeout(() => this.scrollToTheNewComment());
  }

  /**
   * Initilizes add comment event listener to
   * switch back to open comment threads tab, if required.
   */
  initAddCommentEventListener(): void {
    this.ckEditorMessageService.onMessageReceived
      .pipe(takeUntil(this._destroy$))
      .subscribe((message: CKEditorMessageData) => {
        if (
          message.source === 'editor-component' &&
          message.data &&
          message.data === 'addCommentThread'
        ) {
          const isCommentsArchiveOpen = this.tab === 'comments-archive';
          if (isCommentsArchiveOpen) {
            this.tab = 'comments';
            // Added delay, so that the side-panel will switch back
            // to open comments tab.
            // And it'll display the open comments smoothly first.
            setTimeout(() => {
              this.addComment();
            }, 500);
          } else {
            this.addComment();
          }
        }
      });
  }

  //#endregion

  //#region Comment without selecting text

  addExternalComment(): void {
    if (!this.ckEditorPermissionService.canPerformOperationsOnComments) {
      this.toaster.error('You are not authorised to make this request!');
      return;
    }

    this.handleTabClick('comments'); // Switch tab to open comments
    const threadId = `${this.question.id}:${new Date().getTime()}`;
    const channelId: string = '';

    // Added timeout because the newly created annotation was not
    // getting focused on creation.
    setTimeout(() => {
      this.commentsRepositoryPlugin.openNewCommentThread({
        channelId: channelId,
        threadId,
        target: this.annotationTarget,
        context: {
          type: 'text',
          value: 'General comment (no text selected)',
        },
        isResolvable: true,
      });

      setTimeout(() => this.scrollToTheNewComment());
    });
  }

  initOutsideActiveComments(): void {
    const textResponse = this.question.answer.attributes.textResponse || '';
    const regex = /<comment-start name="(?<threadId>[^"]*)"><\/comment-start>/g;
    const commentThreadsInResponse: Array<RegExpExecArray> = [];
    let match = null;
    while ((match = regex.exec(textResponse))) {
      commentThreadsInResponse.push(match);
    }

    const threadIds = commentThreadsInResponse
      .filter((thread) => thread.groups && thread.groups.threadId)
      .map((thread) => thread.groups.threadId.split(':')[0]);

    this.reviewCommentsService
      .getThreads(this.diligenceId, this.responseId, threadIds)
      .subscribe((commentThreadsData: any) => {
        for (const commentThread of commentThreadsData) {
          this.addCommentToCommentRepository(commentThread);
        }

        this.checkForOpenComments();
      });
  }

  //#endregion

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

  private scrollToTheNewComment(): void {
    setTimeout(() => {
      this.ckEditorUtilService.scrollToBottom(
        this.commentsContainer.nativeElement
      );
    });
  }
}
