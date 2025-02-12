import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Select } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';
import { QuestionType } from 'src/app2/apis/template/types/question.type';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { ErrorStatusCode } from 'src/app2/shared/constants/constant';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'recommendation-description',
  templateUrl: './recommendation-description.component.html',
  styleUrls: ['./recommendation-description.component.css'],
})
export class RecommendationDescriptionComponent implements OnInit {
  @Input() question: QuestionType & { isSelected: false } & any;
  @Input() issue: any;
  @Output() onSuccess = new EventEmitter();
  @Output() onCancelComment = new EventEmitter();
  comments: any[];
  loading: boolean = false;
  @Select(UserState.getCurrentUserData) currentUser;
  currentUserData: any;
  constructor(
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly recommendationTrackerService: RecommendationTrackerService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.issue.isOpen = true;
    this.currentUser.pipe(take(2)).subscribe((data) => {
      if (data) {
        this.currentUserData = data;
        this.recommendationTrackerService
          .getComments({
            issue_id: this.issue.id,
          })
          .subscribe(
            (res: any) => {
              this.processComments(res);
              this.loading = false;
            },
            (err) => {
              if (
                !(
                  err &&
                  err.status &&
                  Object.values(ErrorStatusCode).includes(err.status)
                )
              ) {
                this.toaster.error(
                  'Something went wrong while loading comments!'
                );
              }
              this.loading = false;
            }
          );
      }
    });
  }

  processComments(comments) {
    this.comments = JSON.parse(JSON.stringify(comments));
    this.comments.map((comment) => {
      this.addIconsToComment(comment);
    });
  }

  addIconsToComment(comment) {
    comment.iconList = [
      {
        name: 'pencil',
        tooltip: 'Edit',
        align: 'right',
        isactive: comment.created_by_id == this.currentUserData.id,
      },
      {
        name: 'trashcan',
        tooltip: 'Delete',
        align: 'right',
        isactive: comment.created_by_id == this.currentUserData.id,
      },
      {
        name: 'reply',
        tooltip: 'Reply in thread',
        align: 'right',
        isactive: !comment.parent_issue_comment_id,
      },
    ];
    return comment;
  }

  HandleOnSaveComment(payload) {
    this.loading = true;
    this.recommendationTrackerService.createComment(payload).subscribe(
      (comment: any) => {
        this.onSuccess.emit({ type: 'add', count: 1 });
        comment = this.addIconsToComment(comment);
        this.comments.push(comment);
        this.loading = false;
      },
      (err) => {
        if (
          !(
            err &&
            err.status &&
            Object.values(ErrorStatusCode).includes(err.status)
          )
        ) {
          this.toaster.error('Comment not added. Something went wrong!');
        }
        this.loading = false;
      }
    );
  }

  HandleOnDeleteComment(payload) {
    this.SweetAlert.confirm({
      title: `Are you sure you want to delete this comment ?`,
      confirmButtonText: 'Yes, delete it!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: async () => {
        this.loading = true;
        this.recommendationTrackerService
          .deleteComment({ body: payload })
          .subscribe(
            (deletedComment: any) => {
              let nodeIndex;
              let commentCount;
              this.comments.forEach((comment, index) => {
                if (deletedComment.parent_issue_comment_id) {
                  if (comment.id == deletedComment.parent_issue_comment_id) {
                    comment.comment_count -= 1;
                  }
                }
                if (comment.id == deletedComment.id) {
                  nodeIndex = index;
                  commentCount = comment.comment_count + 1;
                }
              });
              this.comments.splice(nodeIndex, 1);
              this.SweetAlert.close();
              this.onSuccess.emit({ type: 'delete', count: commentCount });
              this.toaster.success('Comment deleted');
              this.loading = false;
            },
            (err) => {
              this.SweetAlert.close();
              if (
                !(
                  err &&
                  err.status &&
                  Object.values(ErrorStatusCode).includes(err.status)
                )
              ) {
                this.toaster.error(
                  'Comment not deleted. Something went wrong!'
                );
              }
              this.loading = false;
            }
          );
      },
    });
  }

  HandleOnUpdateComment(payload) {
    this.loading = true;
    this.recommendationTrackerService.updateComment(payload).subscribe(
      (updatedComment: any) => {
        updatedComment = this.addIconsToComment(updatedComment);
        this.comments.forEach((comment) => {
          if (comment.id == updatedComment.id) {
            comment.text = updatedComment.text;
            comment.updated_at = updatedComment.updated_at;
          }
        });
        this.toaster.success('Comment updated');
        this.loading = false;
      },
      (err) => {
        if (
          !(
            err &&
            err.status &&
            Object.values(ErrorStatusCode).includes(err.status)
          )
        ) {
          this.toaster.error('Comment not updated. Something went wrong!');
        }
        this.loading = false;
      }
    );
  }

  HandleOnSaveReply(payload) {
    this.loading = true;
    this.recommendationTrackerService.createComment(payload).subscribe(
      (repliedComment: any) => {
        this.onSuccess.emit({ type: 'add', count: 1 });
        repliedComment = this.addIconsToComment(repliedComment);
        this.comments.forEach((comment) => {
          if (comment.id == repliedComment.parent_issue_comment_id) {
            comment.comment_count += 1;
          }
        });
        this.comments.push(repliedComment);
        this.loading = false;
      },
      (err) => {
        this.loading = false;
        if (
          !(
            err &&
            err.status &&
            Object.values(ErrorStatusCode).includes(err.status)
          )
        ) {
          this.toaster.error('Comment not saved. Something went wrong!');
        }
      }
    );
  }
  handleOnCancelClick() {
    this.onCancelComment.emit();
  }
}
