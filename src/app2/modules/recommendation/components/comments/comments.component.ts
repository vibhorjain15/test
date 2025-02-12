import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { FollowUpType, IssueType } from 'src/app2/shared/constants/constant';
import { UserState } from 'src/app2/store/user/user.state';
import { UtilsService } from 'src/app2/services/utils.service';
@Component({
  selector: 'comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.css'],
})
export class CommentsComponent implements OnInit, OnChanges {
  @Input() issue: any;
  @Input() showDesc: boolean = false;
  @Input() showHeaderIcon: boolean = false;
  @Input() panelTitle: any;
  @Input() mentionsList: any[] = [];
  @Input() panelName: any;
  @Input() panelDesc: any;
  @Input() isReadOnly: boolean = false;
  @Input() comments: any[];
  @Input() followUpType: string;
  @Input() defaultPanelOpen: boolean = true;
  @Input() saveButtonLabel: string = 'Save';
  @Input() showRevisionOption: boolean = false;
  @Input() showRevisionHelpText: boolean = false;
  @Input() showRevisionNotAllowedHelpText: boolean = false;
  @Input() showInvestorSumissionHelpText: boolean = false;
  @Input() revisionOptionValue: boolean;
  @Input() responseRevisionInProgress: boolean;
  @Output() onSaveComment = new EventEmitter();
  @Output() onDeleteComment = new EventEmitter();
  @Output() onResolveComment = new EventEmitter();
  @Output() onUpdateComment = new EventEmitter();
  @Output() onSaveReply = new EventEmitter();
  @Output() onRecommendationClick = new EventEmitter();
  @Output() onCancelClick = new EventEmitter();
  @Output() onBulkResolveClick = new EventEmitter();
  @Input() tinyMcePlaceHolder: any;
  replies: any[] = [];
  tinyMceInit: any = {
    placeholder:
      'Start typing to add a comment. To mention and notify a team member, type @. Comments will be visible to all and an email will be sent to the assigned contact.',
    plugins: 'advcode link lists mentions paste image dv_img_selector',
    toolbar: 'bold italic underline | bullist numlist |  link dv_img_selector',
    toolbar_location: 'bottom',
  };
  noteText: string;
  editMode: boolean;
  editDataIndex: any;
  editText: any;
  replyDataIndex: any;
  replyMode: boolean;
  replyText: any;
  parent_comment_id: any;
  comment_id: any;
  parent_level_comments: any[] = [];
  ThreadParentComment: any;
  issueEntityType: any;
  @Select(UserState.getFirmPreferenceData) firmPref;
  firm_preferences: any;
  disableFollowup: any;
  hasUnresolvedFollowups: boolean;
  revisionHelpText: string;
  isManager: boolean;

  constructor(
    private readonly utils: UtilsService,
    private readonly store: Store
  ) {}
  ngOnInit(): void {
    const user = this.store.selectSnapshot((state) => state.user.currentUser);
    this.isManager = user.isManager;
    this.comments = this.comments.sort(
      (b, a) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (this.panelName == 'follow-up') {
      this.hasUnresolvedFollowups =
        this.comments.some((x) => !x.resolved_by) &&
        this.followUpType === FollowUpType.Question;
    }
    if (this.tinyMcePlaceHolder) {
      this.tinyMceInit.placeholder = this.tinyMcePlaceHolder;
    }
    this.firmPref.pipe(take(2)).subscribe((pref) => {
      if (pref) {
        this.firm_preferences = JSON.parse(JSON.stringify(pref));
      }
    });
    if (this.issue && this.issue?.entity_type) {
      for (const type in IssueType) {
        if (this.issue.entity_type == IssueType[type]) {
          this.issueEntityType = type;
        }
      }
    }
    this.parent_level_comments = this.comments.filter(
      (comment) => !comment.parent_issue_comment_id
    );
    this.replies = this.comments.filter((comment) => {
      return comment.parent_issue_comment_id == this.parent_comment_id;
    });
    this.tinyMceInit = {
      ...this.tinyMceInit,
    };
    this.disableFollowup =
      this.panelName == 'follow-up'
        ? this.firm_preferences?.disable_response_followups
        : false;
    this.revisionHelpText =
      'You must re-submit this response to the requestor. Click ';
    this.revisionHelpText += `<span class="dvi dvi-check help-text-submit-icon"></span> icon once completed.`;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes &&
      changes.comments &&
      changes.comments.currentValue != changes.comments.previousValue
    ) {
      this.comments = JSON.parse(JSON.stringify(changes.comments.currentValue));
      this.ngOnInit();
    }
  }
  handleDeleteClick(event, data) {
    event.stopPropagation();
  }
  handleEditClick(event, data) {
    event.stopPropagation();
  }
  handleMoreInfoClick(event, data) {
    event.stopPropagation();
    data.isOpen = !data.isOpen;
  }
  handleNoteEdit(note) {
    const noteTemp = this.utils.trimFormatting(note);
    if (noteTemp.length) this.noteText = note;
    else this.noteText = '';
  }
  handleSaveNote() {
    if (this.noteText) {
      let temp: any = {
        text: this.noteText,
        parent_comment_id: null,
        issue_id: this.issue.id,
      };
      if (this.showRevisionOption) {
        temp.allow_response_revision = this.revisionOptionValue;
      }
      this.onSaveComment.emit(temp);
      this.noteText = '';
    }
  }
  handleIconClick(data) {
    this.comment_id = data.comment_id;
    if (data.icon.name == 'pencil') {
      this.editMode = true;
      this.editDataIndex = this.comments.findIndex((c) => {
        return c.id == data.comment_id;
      });
      this.editText = this.comments[this.editDataIndex].text;
    }

    if (data.icon.name == 'trashcan') {
      let params = {
        comment_id: data.comment_id,
        issue_id: this.issue.id,
      };
      this.onDeleteComment.emit(params);
    }

    if (data.icon.name == 'reply') {
      this.replyMode = true;
      this.parent_comment_id = data.comment_id;
      this.replies = this.comments.filter((c) => {
        return c.parent_issue_comment_id == this.parent_comment_id;
      });
      this.ThreadParentComment = {
        ...this.comments.find((c) => c.id == data.comment_id),
      };
    }

    if (data.icon.name == 'resolve') {
      let params = {
        comment_id: data.comment_id,
        issue_id: this.issue.id,
      };
      this.onResolveComment.emit(params);
    }
    if (data.icon.name == 'add-recommendation') {
      let params = {
        comment_id: data.comment_id,
        issue_id: this.issue.id,
        commentText: data.commentText,
      };
      this.onRecommendationClick.emit(params);
    }
  }

  handleEditSave() {
    if (this.editText) {
      let temp = {
        text: this.editText,
        comment_id: this.comment_id,
        issue_id: this.issue.id,
      };
      this.onUpdateComment.emit(temp);
      this.editText = '';
      this.editMode = false;
    }
  }
  handleEditText(note) {
    const noteTemp = this.utils.trimFormatting(note);
    if (noteTemp.length) this.editText = note;
    else this.editText = '';
  }
  handleSaveReply() {
    if (this.replyText) {
      let reply: any = {
        text: this.replyText,
        parent_comment_id: this.parent_comment_id,
        issue_id: this.issue.id,
      };
      if (this.showRevisionOption) {
        reply.allow_response_revision = this.revisionOptionValue;
      }
      this.onSaveReply.emit(reply);
      this.replyText = '';
    }
  }
  handleReplyEdit(note) {
    const noteTemp = this.utils.trimFormatting(note);
    if (noteTemp.length) this.replyText = note;
    else this.replyText = '';
  }
  handleOnCancelClick() {
    this.onCancelClick.emit();
  }

  handleBulkResolve() {
    this.onBulkResolveClick.emit();
  }
}
