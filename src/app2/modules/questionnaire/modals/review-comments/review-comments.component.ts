import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { ModalComponent } from 'src/app2/shared/components/modal/modal.component';
import { TinymceEditorComponent } from 'src/app2/shared/components/tinymce-editor/tinymce-editor.component';
import { responseStatus } from 'src/app2/shared/constants/constant';
import { ReviewCommentsService } from '../../service/review-comments.service';
import { Included, QuestionAttributeType } from '../../types/questions.type';

@Component({
  selector: 'review-comments',
  templateUrl: './review-comments.component.html',
  styleUrls: ['./review-comments.component.css'],
})
export class ReviewCommentsComponent implements OnInit {
  @Input() question: QuestionAttributeType;
  @Input() diligenceId: number;
  @Input() editable: boolean;
  firm_preferences: any;
  tinyMceInit: any;
  currentUser: any;
  unsupportedResponseTypes: string[];
  response: Included;
  responseType: string;
  showPreviousComments: boolean;
  loadingComments: boolean;
  editorText: string;
  comments: any[];
  responseStatus = responseStatus;
  validResponsesInSequence: Included[];
  responseIndex: number;
  sectionId: number;
  @ViewChild('editor') editor: TinymceEditorComponent;
  @ViewChild('modal') modal: ModalComponent;
  currentCommentIds: string[];

  constructor(
    private readonly store: Store,
    private readonly questionnaireService: QuestionnaireService,
    private readonly commentsService: ReviewCommentsService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    this.firm_preferences = this.store.selectSnapshot(
      (state) => state.user.firmPreference
    );
    this.initData();
  }

  initData() {
    this.response = { ...this.question.answer };
    this.responseType = this.response.attributes.response_type;
    this.sectionId = this.question.sectionID;
    this.unsupportedResponseTypes = [
      'Attachment',
      'ReturnTable',
      'aumTable',
      'Grid',
      'DynamicGrid',
    ];
    const sequences = this.store.selectSnapshot(
      (state) => state.questionnaire.sequenceSectionQuestionMap
    );
    this.validResponsesInSequence = JSON.parse(
      JSON.stringify(
        Object.values(
          sequences[this.question.sequenceID][this.question.sectionID]
        ).map((question: any) => question.answer)
      )
    );
    this.validResponsesInSequence = this.validResponsesInSequence.filter(
      (response: Included) =>
        response.id &&
        !response.attributes.is_NA &&
        ((this.editable &&
          response.attributes.response_status !==
            this.responseStatus.STARTED) ||
          !this.editable) &&
        !this.unsupportedResponseTypes.includes(
          response.attributes.response_type
        )
    );
    this.setInitialResponseIndex();

    if (
      this.response.attributes.response_with_notes_attributes === null &&
      ((this.responseType === 'TextMultiLine' && !this.editable) ||
        this.responseType !== 'TextMultiLine')
    ) {
      this.response.attributes.response_with_notes_attributes =
        this.response.attributes.responseDisplay;
    } else if (this.responseType === 'TextMultiLine' && this.editable) {
      this.response.attributes.response_with_notes_attributes =
        this.response.attributes.localTextResponse;
    }
    this.initTinymce();
    this.resetPreviousComments();
    this.togglePreviousComments();
  }

  setInitialResponseIndex() {
    if (this.validResponsesInSequence?.length) {
      const storeData = this.store.selectSnapshot(
        (state) => state.questionnaire.questions
      );
      this.validResponsesInSequence.map((response) => {
        const question =
          storeData[this.sectionId][response.attributes.questionID];
        response.attributes.order = question?.index ?? -1; // -1 for nested questions
      });
      this.validResponsesInSequence = this.validResponsesInSequence.filter(
        (response) => response.attributes.order !== -1 // exclude nested questions
      );
      this.validResponsesInSequence.sort(
        (a, b) => a.attributes.order - b.attributes.order
      );
      if (this.question.parentQuestionId) {
        const mainParentQuestionId = this.getMainParentQuestionId(
          this.question.parentQuestionId
        );
        const parentQuestion = storeData[this.sectionId][mainParentQuestionId];
        this.responseIndex = this.validResponsesInSequence?.findIndex(
          (response) => response.id === parentQuestion.answer.id
        );
      } else {
        this.responseIndex = this.validResponsesInSequence?.findIndex(
          (response) => response.id === this.response.id
        );
      }
    }
  }

  initTinymce() {
    this.tinyMceInit = {
      plugins: '',
      automatic_uploads: false,
      toolbar: '',
      contextmenu: false,
      object_resizing: false,
      tinycomments_mode: 'callback',
      min_height: 500,
      max_height: 1000,
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
    this.editorText = this.response.attributes.response_with_notes_attributes;
  }

  isTrackingEnabled() {
    return (
      this.responseType == 'TextMultiLine' &&
      (this.firm_preferences.enable_track_changes ||
        (this.response.attributes.localTextResponse &&
          this.response.attributes.localTextResponse.indexOf(
            '<span class="ice'
          ) > -1))
    );
  }

  handleEditorChange(data) {
    if (
      data?.replace(' tox-comment--active', '') ===
      this.editorText?.replace(' tox-comment--active', '')
    ) {
      // ignore this keyword if it is the only change in the text
      // check if there are changes in the comments
      // if yes, bulk resolve comments without updating the response
      const commentIds = this.editor.getCommentIds();
      if (commentIds.length !== this.currentCommentIds?.length) {
        this.currentCommentIds = commentIds;
        // this.bulkResolveComments();
      }
      return;
    }
    // Added because trackchanges are removing the space in br causing draft panel to open on reload
    this.editorText = data;
    this.currentCommentIds = this.editor.getCommentIds();
    this.save();
  }

  togglePreviousComments() {
    this.showPreviousComments = !this.showPreviousComments;
    if (this.showPreviousComments) {
      this.getAllComments();
    }
  }

  resetPreviousComments() {
    this.showPreviousComments = false;
    this.comments = [];
  }

  previousComment() {
    if (this.responseIndex > 0) {
      this.responseIndex--;
      this.handleCommentIndexChange();
    }
  }

  nextComment() {
    if (this.responseIndex < this.validResponsesInSequence.length - 1) {
      this.responseIndex++;
      this.handleCommentIndexChange();
    }
  }

  handleCommentIndexChange() {
    this.response = JSON.parse(
      JSON.stringify(this.validResponsesInSequence[this.responseIndex])
    );
    const allQuestions = this.store.selectSnapshot(
      (state) => state.questionnaire.questions
    );
    this.question =
      allQuestions[this.sectionId][this.response.attributes.questionID];
    this.response = JSON.parse(JSON.stringify(this.question.answer));
    if (this.response.attributes.response_with_notes_attributes === null) {
      this.response.attributes.response_with_notes_attributes =
        this.response.attributes.responseDisplay;
    }
    this.initTinymce();
    this.resetPreviousComments();
    this.togglePreviousComments();
  }

  getAllComments() {
    if(!this.response.id) return
    this.loadingComments = true;
    const params = {
      is_selected_text_removed: true,
      is_resolved: true,
      include_internal_notes: true,
    };
    this.questionnaireService
      .getReviewComments(this.diligenceId, this.response.id, params)
      .subscribe((response: any[]) => {
        const commentsMap = {};
        response.forEach((comment: any) => {
          if (comment.parent_id === null || !commentsMap[comment.parent_id]) {
            comment.threads = [{ ...comment }];
            commentsMap[comment.id] = comment;
          } else commentsMap[comment.parent_id].threads.push(comment);
        });
        this.comments = Object.values(commentsMap);
        this.loadingComments = false;
      });
  }

  addCommentHandler(req, done, fail, isReply = false) {
    const selectedText = this.editor.getSelectedText();
    return this.commentsService.addCommentHandler(
      req,
      done,
      fail,
      selectedText,
      this.diligenceId,
      this.response.id,
      isReply,
      this.editor.getCommentIds(),
      this.sectionId,
      this.question.id,
      this.question.parentQuestionId,
      this.editorText,
      this.responseType,
      this.editable,
      this.question,
      () => this?.editor?.editor.fire('change')
    );
  }

  editCommentHandler(req, done, fail) {
    const selectedText = this.editor.getSelectedText();
    return this.commentsService.editCommentHandler(
      req,
      done,
      fail,
      selectedText,
      this.diligenceId,
      this.response.id,
      this.currentUser.id
    );
  }

  resolveCommentHandler(req, done, fail) {
    const response = this.commentsService.resolveCommentHandler(
      req,
      done,
      fail,
      this.diligenceId,
      this.response.id,
      () => {
        this.getAllComments();
        this?.editor?.editor.fire('change');
      }
    );
    return response;
  }

  lookupCommentsHandler(req, done, fail) {
    return this.commentsService.lookupCommentsHandler(
      req,
      done,
      fail,
      this.diligenceId,
      this.response.id
    );
  }

  deleteCommentHandler(req, done, fail, isConversation = false) {
    return this.commentsService.deleteCommentHandler(
      req,
      done,
      fail,
      isConversation,
      this.diligenceId,
      this.response.id,
      this.editor.getCommentIds(),
      this.sectionId,
      this.question.id,
      this.question.parentQuestionId,
      this.editorText,
      this.responseType,
      this.editable,
      this.question,
      () => this?.editor?.editor.fire('change')
    );
  }

  save() {
    if (this.responseType === 'TextMultiLine' && this.editable) {
      const params = {
        duediligence_id: this.diligenceId,
        SectionID: this.response.attributes.sectionId,
        questionID: this.question.id,
        response: { ...this.response.attributes },
      };
      delete params.response.responseDisplay;
      params.response.textResponse = this.editorText;
      params.response.responseTimeStamp = new Date();
      this.questionnaireService
        .updateQuestionResponse(params)
        .subscribe((response: any) => {
          this.bulkResolveComments();
        });
    } else {
      const params = {
        response_with_notes_attributes: this.editorText,
      };
      this.questionnaireService
        .responseNoteAttribute(this.diligenceId, this.response.id, params)
        .subscribe(() => {
          this.bulkResolveComments();
        });
    }
  }

  bulkResolveComments() {
    this.commentsService.bulkResolveCommentsAndUpdateValues(
      this.currentCommentIds,
      this.diligenceId,
      this.response.id,
      this.sectionId,
      this.question.id,
      this.question.parentQuestionId,
      this.editorText,
      this.responseType,
      this.editable,
      this.question
    );
  }

  closeModal() {
    this.modal.closeModal();
  }

  getMainParentQuestionId(parentQuestionId) {
    const nestedQuestionMap = this.store.selectSnapshot(
      (state) => state.questionnaire.nestedQuestionMap
    );
    let mainParentQuestionId = +parentQuestionId;
    while (nestedQuestionMap[mainParentQuestionId]) {
      mainParentQuestionId = nestedQuestionMap[mainParentQuestionId];
    }
    return mainParentQuestionId;
  }
}
