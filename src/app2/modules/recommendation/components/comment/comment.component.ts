import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UtilsService } from 'src/app2/services/utils.service';
type IconListType = {
  name: string;
  label: string;
  tooltip: string;
  isactive?: boolean;
  isDisabled?: boolean;
  isHighlighted?: boolean;
};
@Component({
  selector: 'comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.css'],
})
export class CommentComponent implements OnInit {
  @Input() comment: any;
  @Input() index: number;
  @Input() note: string;
  @Input() userId: any;
  @Input() showIndex: boolean = false;
  @Input() showIcons: boolean = true;
  @Input() customNoteButton: any = '';
  @Input() iconList: IconListType[] = [];
  @Input() spaceBelowComment: boolean = true;
  @Input() showCommentHeader: boolean = true;
  @Input() showReplyCount: boolean = true;

  @Output() onIconClick = new EventEmitter();

  lastEdited: any;
  topIcons = [];
  rightOptions = [];
  constructor(private util: UtilsService) {}
  handleIconClick(icon) {
    let iconWithIndexAndId = {
      icon: icon,
      index: this.index,
      commentText: this.note,
    };
    this.onIconClick.emit(iconWithIndexAndId);
  }
  ngOnInit(): void {
    this.userId = this.util.getCurrentUser().id;
    this.lastEdited = this.comment.updated_at
      ? this.comment.updated_at
      : this.comment.created_at;
    if (this.iconList) {
      this.iconList = this.iconList.filter((icon) => icon.isactive);
      this.iconList = this.iconList.map((icon: any) => {
        icon.key = icon.name;
        icon.label = icon.label ?? icon.tooltip;
        return icon;
      });
      this.topIcons = this.iconList.filter((icon: any) => icon.align == 'top');
      this.rightOptions = this.iconList.filter(
        (icon: any) => icon.align == 'right'
      );
    }
  }
  navigateToReplyThread() {
    let iconClicked = this.rightOptions.find((icon) => icon.name == 'reply');
    this.dropdownActionClick(iconClicked);
  }
  dropdownActionClick(icon) {
    let iconWithIndexAndId = {
      icon: icon,
      index: this.index,
      parent_comment_id: this.comment.parent_comment_id,
      comment_id: this.comment.id,
      commentText: this.note,
    };
    this.onIconClick.emit(iconWithIndexAndId);
  }
}
