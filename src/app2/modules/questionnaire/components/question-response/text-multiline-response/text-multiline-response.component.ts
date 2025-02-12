import {
  AfterViewInit,
  ApplicationRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { diligenceStatusConstant } from 'src/app2/shared/constants/constant';
import { ResponseType } from '../../../constants/Response-type.constant';
import { ReviewCommentsService } from '../../../service/review-comments.service';
import { QuestionAttributeType } from '../../../types/questions.type';
import { CacheUtil } from '../../../service/cache.service';
import { QuestionState } from '../../../store/questionnaire.state';
import { UtilsService } from 'src/app2/services/utils.service';
import { QuestionnaireStatusService } from '../../../service/status.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import {
  GetQuestionCount,
  UpdateActivePanelId,
} from '../../../store/questionnaire.action';
import { ToastrService } from 'ngx-toastr';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import {
  AddCommentData,
  CKEditorMessageData,
} from 'src/app2/shared/models/ckeditor.model';
import { CKEditorInstanceManagerService } from 'src/app2/services/ck-editor/ckeditor-instance-manager.service';
import { CKEditorUtilService } from 'src/app2/services/ck-editor/ckeditor-util.service';
import { DvEditorComponent } from 'src/app2/shared/components';
import { CKEditorMessageService } from 'src/app2/services/ck-editor/ckeditor-message.service';

@Component({
  selector: 'text-multiline-response',
  templateUrl: './text-multiline-response.component.html',
  styleUrls: ['./text-multiline-response.component.css'],
})
export class TextMultilineResponseComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() placeholder;
  @Input() value = '';
  @Input() isNotApplicable: boolean = false;
  @Input() isReadOnly: boolean = false;
  @Input() question: QuestionAttributeType;
  @Input() isTrackChange = false;
  @Input() showComments: boolean = false;
  @Input() id: string;
  @Output() onValueChange = new EventEmitter();
  @Output() onTrackChange = new EventEmitter();
  @Output() onReviewCommentFocused = new EventEmitter<void>();
  @Output() onAddReviewComment: EventEmitter<AddCommentData> =
    new EventEmitter<AddCommentData>();

  @ViewChild('editor') editor: DvEditorComponent;

  @Select(QuestionState.getResponseTypeFromPanel) getResponseTypeFromPanel;
  private _destroy$: Subject<void> = new Subject<void>();
  tinyMceInit: any = {
    placeholder: 'Accepts multiline / paragraph text',
  };
  ckEditorInitConfig: any = {
    placeholder: 'Accepts multiline / paragraph text',
  };
  currentUser: CurrentUserModel;
  firm_preferences: any;
  diligenceId: number;
  currentCommentIds: string[];
  onlyTextValue = 0;
  getResponseTypeFromPanelSub;
  isSidePanel = false;
  generating: boolean;
  lastThreadId: string;
  diligence: DiligenceType | any;
  isTinymceEditor = true;
  isTemplateBuilderPage = false;
  isLite = true;
  commentEnabled: boolean = false;
  reviewCommentDisabled: boolean;
  isTrackChangeEnabled: boolean = false; // Deals with default behavior of track change button on editor init
  constructor(
    private readonly store: Store,
    private readonly commentsService: ReviewCommentsService,
    private readonly questionnaire: QuestionnaireService,
    private cache: CacheUtil,
    private util: UtilsService,
    private readonly status: QuestionnaireStatusService,
    private readonly panel: SidePanelService,
    private readonly toaster: ToastrService,
    private readonly appRef: ApplicationRef,
    private readonly ckEditorUtilService: CKEditorUtilService,
    private readonly ckEditorMessageService: CKEditorMessageService,
    private readonly ckeditorInstanceManagerService: CKEditorInstanceManagerService
  ) {
    this.getUpdatedResponse = this.getUpdatedResponse.bind(this);
  }
  ngOnInit(): void {
    this.commentEnabled = this.showComments;
    if (!(this.id in this.commentsService.questionIdMultitextMap))
      this.commentsService.questionIdMultitextMap[this.id] = true;
    this.currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    this.firm_preferences = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
    this.diligenceId = this.store.selectSnapshot(
      (state) => state.questionnaire.diligenceId
    );

    this.isTemplateBuilderPage = this.status.isTemplateBuilderModule(
      this.question
    );
    if (!this.isTemplateBuilderPage) {
      this.diligence = this.store.selectSnapshot(
        (state) => state.questionnaire.diligence
      );
      this.isTinymceEditor = this.diligence.editor_version === 1;
    } else this.isTinymceEditor = false; // Always show ckeditor for template preview

    // Update footnote.
    this.updateFootnote();

    if (this.placeholder) {
      this.tinyMceInit.placeholder = this.placeholder;
      this.ckEditorInitConfig.placeholder = this.placeholder;
    }
    this.tinyMceInit.readonly = this.isReadOnly;
    this.ckEditorInitConfig.readonly = this.isReadOnly;
    this.configTrackAndCommentPlugins();

    // In evaluation make sure that original response is not getting edited while adding comments to the response
    if (
      !this.isTemplateBuilderPage &&
      this.diligence.status === diligenceStatusConstant.Evaluation
    ) {
      if (!this.question.answer.attributes.response_with_notes_attributes)
        this.question.answer.attributes.response_with_notes_attributes =
          this.value;
      this.value =
        this.question.answer.attributes.response_with_notes_attributes;
    }

    this.getResponseTypeFromPanelSub = this.getResponseTypeFromPanel.subscribe(
      (state) => {
        if (
          state &&
          state.response_type == ResponseType.TextMultiLine &&
          state.questionID == this.question.id
        ) {
          setTimeout(() => {
            this.isSidePanel = true;
            if (!this.isTinymceEditor) {
              // If editor is not initialized, then manually trigger the handle change method.
              if (!this.editor?.activeEditorInstance?.editor) {
                this.handleChange(state.textResponse);
              }

              this.isSidePanel = false;
            } else {
              // Adding a setTimeout cause above setContent is async operation
              this.value = state.textResponse;
              setTimeout(() => {
                this.getWordCount();
                this?.editor?.handleChange(this.value);
              });
            }
          });
        }
      }
    );

    // Bulk resolve CKEditor comments
    this.ckEditorMessageService.onMessageReceived
      .pipe(takeUntil(this._destroy$))
      .subscribe((message: CKEditorMessageData) => {
        if (
          message.source === 'ck-comments-panel' &&
          message.data &&
          message.data.eventType === 'bulkResolvedComment' &&
          message.data.textMultilineEditorId === this.question.uniqueQuestionId
        ) {
          const value = this.editor.getResponseWithoutCommentsTag();
          this.handleAddOnlyCommentAndTrackChanges(
            value,
            message.data.eventType,
            {}
          );
        }
      });

    this.getWordCount();
  }

  ngAfterViewInit(): void {
    // Waiting for editor to initialize
    let retry = 0;
    let maxRetry = 10;
    let interval = setInterval(() => {
      if (
        this.isTinymceEditor &&
        (this?.editor?.activeEditorInstance.editor?.plugins?.wordcount?.body.getWordCount() ||
          retry > maxRetry)
      ) {
        setTimeout(() => {
          if (this.question?.answer.attributes.localis_validation_required) {
            this.value = this.value?.replace(' tox-comment--active', '');
            this.getWordCount();
            this.emitEvent();
          }
          this.commentsService.questionIdMultitextMap[this.id] = false;
          clearInterval(interval);
        }, 100);
      }
      retry++;
    }, 1000);
  }

  handleReviewCommentFocused(): void {
    if (this.onlyTextValue > this.question.response_word_limit) return;
    this.onReviewCommentFocused.emit();
  }

  updateFootnote(): void {
    if (
      this.diligence &&
      this.diligence.editor_version === 2 &&
      this.ckEditorUtilService.doesResponseContainsTinyMceFootnote(this.value)
    ) {
      this.value = this.ckEditorUtilService.convertTinyMceFootnoteToCKEditor(
        this.value
      );
      this.question.answer.attributes.textResponse = this.value;
    } else if (
      this.diligence &&
      this.diligence.editor_version === 1 &&
      this.ckEditorUtilService.doesResponseContainsCKEditorFootnote(this.value)
    ) {
      this.value = this.ckEditorUtilService.convertCKEditorFootnoteToTinyMce(
        this.value
      );
      this.question.answer.attributes.textResponse = this.value;
    }
  }

  configTrackAndCommentPlugins() {
    this.isTrackChangeEnabled =
      this.firm_preferences.enable_track_changes ||
      (this.question.answer.attributes.textResponse &&
        ((this.isTinymceEditor &&
          this.question.answer.attributes.textResponse.indexOf(
            '<span class="ice'
          ) > -1) ||
          (!this.isTinymceEditor &&
            this.util.checkForTrackChanges(
              this.question.answer.attributes.textResponse
            ))));

    if (this.isTrackChange) {
      const trackChangesConfig = {
        dvTrackChanges: {
          getSuggestion: (data: any) => {
            return this.commentsService
              .getSuggestion(data, this.diligenceId, this.question.answer.id)
              .toPromise();
          },

          addSuggestion: (data: any) => {
            return this.commentsService
              .addSuggestion(data, this.diligenceId, this.question.answer.id)
              .pipe(
                tap((response) => {
                  if (response.created_at) {
                    const value = this.editor.getResponseWithoutCommentsTag();
                    this.handleAddOnlyCommentAndTrackChanges(
                      value,
                      'add',
                      data,
                      true
                    );
                  }
                })
              )
              .toPromise();
          },

          updateSuggestion: (data: any) => {
            return this.commentsService
              .updateSuggestion(data, this.diligenceId, this.question.answer.id)
              .pipe(
                tap((response) => {
                  if (response.created_at) {
                    const value = this.editor.getResponseWithoutCommentsTag();
                    this.handleAddOnlyCommentAndTrackChanges(
                      value,
                      'remove',
                      data,
                      true
                    );
                  }
                })
              )
              .toPromise();
          },
        },
      };

      this.ckEditorInitConfig = {
        ...this.ckEditorInitConfig,
        ...trackChangesConfig,
      };
    } else {
      delete this.ckEditorInitConfig?.dvTrackChanges;
    }
    if (this.commentEnabled) {
      this.ckEditorInitConfig.readonly = this.isReadOnly;
      const tinyMceConfig = {
        tinycomments_mode: 'callback',
        tinycomments_create: (req, done, fail) =>
          this.addCommentHandler(req, done, fail),
        tinycomments_reply: (req, done, fail) =>
          this.addCommentHandler(req, done, fail, true),
        tinycomments_edit_comment: (req, done, fail) =>
          this.editCommentHandler(req, done, fail),
        tinycomments_delete: (req, done, fail) =>
          this.deleteCommentHandler(req, done, fail, true),
        tinycomments_delete_all: (req, done, fail) => {},
        tinycomments_delete_comment: (req, done, fail) =>
          this.deleteCommentHandler(req, done, fail),
        tinycomments_lookup: (req, done, fail) =>
          this.lookupCommentsHandler(req, done, fail),
        tinycomments_resolve: (req, done, fail) =>
          this.resolveCommentHandler(req, done, fail),
      };
      const ckEditorConfig = {
        dvComments: {
          addComment: (data: any) => {
            return this.commentsService
              .addComment(data, this.diligenceId, this.question.answer.id)
              .toPromise();
          },

          updateComment: (data: any) => {
            return this.commentsService
              .updateComment(data, this.diligenceId, this.question.answer.id)
              .toPromise();
          },

          removeComment: (data: any) => {
            return this.commentsService
              .deleteComment(data, this.diligenceId, this.question.answer.id)
              .toPromise();
          },

          addCommentThread: (data: any) => {
            this.showSidePanelLoader();
            return this.commentsService
              .addThread(data, this.diligenceId, this.question.answer.id)
              .pipe(
                tap((response) => {
                  if (
                    this.commentsService.isCommentThreadAddedWithoutSelectingText(
                      response.thread_id
                    )
                  ) {
                    this.store.dispatch(new GetQuestionCount());
                    this.updateUnresolvedCommentsCount('add');
                    this.hideSidePanelLoader();
                    return;
                  }

                  if (response.created_at) {
                    const value = this.editor.getResponseWithoutCommentsTag();
                    this.handleAddOnlyCommentAndTrackChanges(
                      value,
                      'add',
                      data
                    );
                  }
                })
              )
              .toPromise();
          },

          getCommentThread: (data: any) => {
            return this.commentsService
              .getThread(data, this.diligenceId, this.question.answer.id)
              .toPromise();
          },

          updateCommentThread: (data: any) => {
            this.showSidePanelLoader();
            return this.commentsService
              .updateThread(data, this.diligenceId, this.question.answer.id)
              .pipe(
                tap((data) => {
                  if (
                    data.unlinked_at &&
                    this.lastThreadId !== data.thread_id
                  ) {
                    const value = this.editor.getResponseWithoutCommentsTag();
                    this.handleAddOnlyCommentAndTrackChanges(
                      value,
                      'remove',
                      data
                    );
                  } else if (data.created_at) {
                    const value = this.editor.getResponseWithoutCommentsTag();
                    this.handleAddOnlyCommentAndTrackChanges(
                      value,
                      'add',
                      data
                    );
                  }
                })
              )
              .toPromise();
          },

          resolveCommentThread: (data: any) => {
            this.showSidePanelLoader();
            return this.commentsService
              .resolveThread(data, this.diligenceId, this.question.answer.id)
              .pipe(
                tap((data) => {
                  if (
                    data.resolved_at &&
                    this.commentsService.isCommentThreadAddedWithoutSelectingText(
                      data.thread_id
                    )
                  ) {
                    this.store.dispatch(new GetQuestionCount());
                    this.updateUnresolvedCommentsCount('delete');
                    this.hideSidePanelLoader();
                    return;
                  }

                  if (
                    data.resolved_at &&
                    this.lastThreadId !== data.thread_id
                  ) {
                    const value = this.editor.getResponseWithoutCommentsTag();
                    this.handleAddOnlyCommentAndTrackChanges(
                      value,
                      'remove',
                      data
                    );
                  }
                })
              )
              .toPromise();
          },

          reopenCommentThread: (data: any) => {
            return this.commentsService
              .reopenThread(data, this.diligenceId, this.question.answer.id)
              .toPromise();
          },

          removeCommentThread: (data: any) => {
            this.showSidePanelLoader();
            return this.commentsService
              .deleteThread(data, this.diligenceId, this.question.answer.id)
              .pipe(
                tap((data) => {
                  if (
                    this.commentsService.isCommentThreadAddedWithoutSelectingText(
                      data.thread_id
                    )
                  ) {
                    this.store.dispatch(new GetQuestionCount());
                    this.updateUnresolvedCommentsCount('delete');
                    this.hideSidePanelLoader();
                    return;
                  }

                  if (data.thread_id) {
                    const value = this.editor.getResponseWithoutCommentsTag();
                    this.handleAddOnlyCommentAndTrackChanges(
                      value,
                      'remove',
                      data
                    );
                  }
                })
              )
              .toPromise();
          },
        },
      };
      this.tinyMceInit = { ...this.tinyMceInit, ...tinyMceConfig };
      this.ckEditorInitConfig = {
        ...this.ckEditorInitConfig,
        ...ckEditorConfig,
      };
      this.currentCommentIds = this.getInitialCommentIds();
    }
  }

  handleAddReviewComment(value: AddCommentData): void {
    this.onAddReviewComment.emit(value);
  }

  updateTextResponse(data = null) {
    this.question.answer.attributes.textResponse = data
      ? data
      : (window as any).tinymce
          .get(this.editor?.activeEditorInstance?.editor?.id)
          ?.getContent()
          .replace(' tox-comment--active', '');
    this.commentsService.questionIdMultitextMap[this.id] = false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes &&
      this.util.checkIfValidAndSameOrNotSame(
        changes?.isNotApplicable?.previousValue,
        changes?.isNotApplicable?.currentValue,
        false
      ) &&
      !changes?.isNotApplicable?.currentValue
    ) {
      this.handleChange(this.value, true);
    }
  }

  handleChange(data, errorCheck = false, fromEditor = false) {
    // for template builder page
    if (this.isTemplateBuilderPage) return;

    // For CKEditor Questionnaire
    if (!this.isTinymceEditor) {
      const { value, onlyComments } =
        fromEditor && this.commentEnabled
          ? data
          : { value: data, onlyComments: undefined };
      this.value = value;
      this.getWordCount();

      // When user adds any comments, simply return from here.
      // CKEditor "Add comment thread callback" will handle this.
      if (fromEditor && this.commentEnabled && onlyComments) {
        const draftData = this.store.selectSnapshot(
          (store) => store.questionnaire.draftData
        );
        const id = `${this.question.sequenceID}-${this.question.sectionID}-${this.question.id}`;

        //  make sure to emit when user has already edited some changes otherwise comment change will not get saved when user clicks on save from save bar
        if (draftData && id in draftData) {
          this.emitEvent();
        }

        return;
      }

      this.emitEvent();
      return;
    }

    if (
      this.isTrackChange &&
      this.commentsService.questionIdMultitextMap[this.id]
    ) {
      if (
        !this.question.answer.attributes.textResponse.includes(
          '<span class="ice'
        )
      ) {
        this.updateTextResponse(data);
      }
      return;
    } else if (
      !this.isSidePanel &&
      this.commentsService.questionIdMultitextMap[this.id]
    ) {
      if (this.question.answer.attributes.textResponse && data) {
        this.updateTextResponse(data);
        return;
      }
      this.commentsService.questionIdMultitextMap[this.id] = false;
    }
    // this.onlyTextValue =
    //   this?.editor?.editor?.plugins?.wordcount?.body.getWordCount();
    if (
      !this.isSidePanel &&
      data?.replace(' tox-comment--active', '') ===
        this.value?.replace(' tox-comment--active', '') &&
      !errorCheck
    ) {
      // ignore this keyword if it is the only change in the text
      if (this.commentEnabled) {
        // check if there are changes in the comments
        // if yes, bulk resolve comments without updating the response
        const commentIds = this.editor?.activeEditorInstance?.getCommentIds();
        if (commentIds?.length !== this.currentCommentIds?.length) {
          this.currentCommentIds = commentIds;
          this.bulkResolveComments();
        }
      }
      return;
    }
    this.isSidePanel = false;
    this.value = data?.replace(' tox-comment--active', '') || '';
    this.question.answer.attributes.response_with_notes_attributes =
      this.value.replace(' tox-comment--active', '');
    if (this.commentEnabled) {
      try {
        this.saveResponseAndBulkResolveComments(data);
      } catch (e) {}
    }
    this.getWordCount();
    this.emitEvent();
  }

  //This is for Ckeditor only to handle comments/trackchanges only changes
  handleAddOnlyCommentAndTrackChanges(
    data,
    type: 'add' | 'remove' | 'bulkResolvedComment',
    commentData,
    trackChanges = false
  ) {
    this.question.answer.attributes.localTextResponse = data;
    this.question.answer.attributes.currentResponse = data;
    this.question.answer.attributes.responseDisplay = data;
    if (type == 'remove' && !trackChanges) {
      this.lastThreadId = commentData.thread_id;
    }
    this.value = data;
    this.saveResponseAfterCommentCkEditor(data, trackChanges);
  }

  emitEvent() {
    this.onValueChange.emit({
      value: this.value,
      error:
        this.question.response_word_limit &&
        this.question.response_word_limit < this.onlyTextValue,
    });
    const { sequenceID, sectionID, id } = this.question;
    const uniqueId = `${sequenceID}-${sectionID}-${id}`;
    if (!this.isTinymceEditor) {
      const suggestionIds: Array<string> =
        this.editor.activeEditorInstance.getTrackChangesIds();
      this.cache.updateSuggestionIds(uniqueId, suggestionIds);
    }
  }

  handleTrackChange(flite) {
    this.updateTextResponse();
    this.onTrackChange.emit(flite);
  }
  addCommentHandler(req, done, fail, isReply = false) {
    const selectedText = this.editor?.activeEditorInstance?.getSelectedText();
    return this.commentsService.addCommentHandler(
      req,
      done,
      fail,
      selectedText,
      this.diligenceId,
      this.question.answer.id,
      isReply,
      this.editor?.activeEditorInstance?.getCommentIds(),
      this.question.sectionID,
      this.question.id,
      this.question.parentQuestionId,
      this.value,
      ResponseType.TextMultiLine,
      true,
      this.question
    );
  }

  editCommentHandler(req, done, fail) {
    const selectedText = this.editor?.activeEditorInstance?.getSelectedText();
    return this.commentsService.editCommentHandler(
      req,
      done,
      fail,
      selectedText,
      this.diligenceId,
      this.question.answer.id,
      this.currentUser.id
    );
  }

  resolveCommentHandler(req, done, fail) {
    return this.commentsService.resolveCommentHandler(
      req,
      done,
      fail,
      this.diligenceId,
      this.question.answer.id
    );
  }

  deleteCommentHandler(req, done, fail, isConversation = false) {
    return this.commentsService.deleteCommentHandler(
      req,
      done,
      fail,
      isConversation,
      this.diligenceId,
      this.question.answer.id,
      this.editor?.activeEditorInstance?.getCommentIds(),
      this.question.sectionID,
      this.question.id,
      this.question.parentQuestionId,
      this.value,
      ResponseType.TextMultiLine,
      true,
      this.question
    );
  }

  lookupCommentsHandler(req, done, fail) {
    return this.commentsService.lookupCommentsHandler(
      req,
      done,
      fail,
      this.diligenceId,
      this.question.answer.id
    );
  }

  getInitialCommentIds() {
    const commentIds: string[] = [];
    if (!this.value) {
      return commentIds;
    }
    const element = document.createElement('p');
    element.innerHTML = this.value;
    element.querySelectorAll('[data-mce-annotation-uid]').forEach((element) => {
      commentIds.push(element.attributes['data-mce-annotation-uid'].nodeValue);
    });
    return commentIds;
  }

  saveResponseAndBulkResolveComments(data) {
    const commentIds = this.editor?.activeEditorInstance?.getCommentIds();
    if (
      this.question.answer.id &&
      commentIds?.length !== this.currentCommentIds?.length
    ) {
      const params = {
        duediligence_id: this.diligenceId,
        SectionID: this.question.answer.attributes.sectionId,
        questionID: this.question.id,
        response: { ...this.question.answer.attributes },
      };
      delete params.response.responseDisplay;
      params.response.textResponse = data;
      params.response.responseTimeStamp = new Date();
      this.questionnaire
        .updateQuestionResponse(params)
        .subscribe((response: any) => {
          this.currentCommentIds = commentIds;
          this.bulkResolveComments();
        });
    }
  }

  saveResponseAfterCommentCkEditor(data, trackChanges) {
    // Dont change the actual response if the project is in evaluation mode
    if (this.diligence.status === diligenceStatusConstant.Evaluation) {
      this.questionnaire
        .responseNoteAttribute(this.diligenceId, this.question.answer.id, {
          response_with_notes_attributes: data,
        })
        .subscribe((response: any) => {
          // When in evaluation we shouldt allow real response to be changed
          this.value = data;
          this.question.answer.attributes.response_with_notes_attributes = data;
          let obj = this.question.icons.rightIcons.find(
            (value) => value.key === 'ck-comments'
          );
          obj &&
            (obj.count = response.response_unresolved_comments_counts ?? 0);
          this.question.answer.attributes.response_unresolved_comments_counts =
            response.response_unresolved_comments_counts ?? 0;
          this.question.icons.rightIcons = JSON.parse(
            JSON.stringify(this.question.icons.rightIcons)
          );

          this.store.dispatch(new GetQuestionCount());
          this.hideSidePanelLoader();
        });
      return;
    }

    const params = {
      duediligence_id: this.diligenceId,
      SectionID: this.question.answer.attributes.sectionId,
      questionID: this.question.id,
      response: { ...this.question.answer.attributes },
    };
    delete params.response.responseDisplay;
    params.response.textResponse = data;
    params.response.responseTimeStamp = new Date();

    this.questionnaire
      .updateQuestionResponse(params)
      .subscribe((response: any) => {
        this.store.dispatch([new GetQuestionCount()]);
        this.hideSidePanelLoader();

        if (!trackChanges) {
          let obj = this.question.icons.rightIcons.find(
            (value) => value.key === 'ck-comments'
          );
          obj &&
            (obj.count = response.response_unresolved_comments_counts ?? 0);
          this.question.answer.attributes.response_unresolved_comments_counts =
            response.response_unresolved_comments_counts ?? 0;

          this.question.icons.rightIcons = JSON.parse(
            JSON.stringify(this.question.icons.rightIcons)
          );
        }

        this.question.icons.leftIcons = this.status.addLeftIcons(this.question);
        this.question.answer.attributes.textResponse = data;
      });
  }

  handleAiButton(input) {
    if (this.generating || !this.getUpdatedResponse().selectedText) {
      if (!this.value)
        this.toaster
          .info('Please add a response')
          .onShown.subscribe(() => this.appRef.tick()); // Had to manually and generate change event as toaster was not showing up properly
      return;
    }
    this.store.dispatch(
      new UpdateActivePanelId(
        `questionnaire-AI${Math.random()}-${this.question.id}`
      )
    );

    this.panel.invoke('ai-panel', {
      selectedPrompt: input,
      selectedResponse: this.getUpdatedResponse,
      question: this.question,
      onClose: () => {
        this.generating = false;
      },
      onInit: () => {},
      onAction: (action) => {
        const editor = this.ckeditorInstanceManagerService.getEditorInstance(
          this.id
        );
        let selectedText = this.editor.activeEditorInstance.getSelectedText();

        if (selectedText) {
          if (action.type === 'replace')
            this.editor.insertContent(action.value);
          else if (action.type === 'insertBelow')
            this.editor.insertContent(selectedText + ' ' + action.value);
        } else {
          if (action.type === 'replace') this.editor.setContent(action.value);
          else if (action.type === 'insertBelow')
            this.editor.setContent(this.value + ' ' + action.value);
        }
      },
      onGenerating: (generating) => (this.generating = generating),
    });
  }

  getUpdatedResponse() {
    let selectedText = this.editor.activeEditorInstance.getSelectedText()
      ? this.editor.activeEditorInstance.getSelectedText()
      : this.value;

    return {
      selectedText,
      customSelection:
        this.editor.activeEditorInstance.getSelectedText() ?? false,
    };
  }

  bulkResolveComments() {
    this.currentCommentIds &&
      !!this.currentCommentIds.length &&
      this.commentsService.bulkResolveCommentsAndUpdateValues(
        this.currentCommentIds,
        this.diligenceId,
        this.question.answer.id,
        this.question.sectionID,
        this.question.id,
        this.question.parentQuestionId,
        this.value,
        ResponseType.TextMultiLine,
        true,
        this.question
      );
  }

  updateEditorInstance() {
    this.status.handleUpdateActiveQuestion(this.question);
  }

  getWordCount() {
    this.onlyTextValue = this.util.tinymceGetWordCount(
      this.util.stripCommentsAndTrackChanges(this.value)
    );

    // Code to handle to prevent auto save when response word count exceeds word limit
    if (
      (this.isTrackChange || this.showComments) &&
      this.question.response_word_limit &&
      !this.isTinymceEditor
    ) {
      if (
        this.onlyTextValue > this.question.response_word_limit &&
        !this.reviewCommentDisabled
      ) {
        this.panel.close();
        this.reviewCommentDisabled = true;
        this.editor?.ckeditorInstance?.toggleReviewCommentsTrackChanges(true);
      } else if (
        this.onlyTextValue < this.question.response_word_limit &&
        (this.reviewCommentDisabled === true ||
          this.reviewCommentDisabled === undefined)
      ) {
        // Go to this if statement when word count is less than word limit and enable all track changes/review comments
        this.reviewCommentDisabled = false;
        this.editor?.ckeditorInstance?.toggleReviewCommentsTrackChanges(false);
      } else if (this.onlyTextValue === this.question.response_word_limit) {
        // If for the first time editor is loaded and word count is equal to word limit then it will be disabled
        this.reviewCommentDisabled = true;
      }
    }
  }
  ngOnDestroy(): void {
    this.getResponseTypeFromPanelSub?.unsubscribe();
    this._destroy$.next();
    this._destroy$.complete();
  }

  updateUnresolvedCommentsCount(operationType: 'add' | 'delete'): void {
    const ckCommentsIcon = this.question.icons.rightIcons.find(
      (value: any) => value.key === 'ck-comments'
    );

    if (operationType === 'add') {
      this.question.answer.attributes.response_unresolved_comments_counts += 1;
      ckCommentsIcon && (ckCommentsIcon.count += 1);
    } else if (operationType === 'delete') {
      this.question.answer.attributes.response_unresolved_comments_counts -= 1;
      ckCommentsIcon && (ckCommentsIcon.count -= 1);
    }

    this.question.icons.rightIcons = JSON.parse(
      JSON.stringify(this.question.icons.rightIcons)
    );
  }

  showSidePanelLoader(): void {
    this.ckEditorMessageService.sendMessage({
      source: 'text-multiline-response',
      data: 'showLoader',
    });
  }

  hideSidePanelLoader(): void {
    this.ckEditorMessageService.sendMessage({
      source: 'text-multiline-response',
      data: 'responseUpdated',
    });
  }
}
