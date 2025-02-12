import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CKEditorAddCommentIcon } from 'src/app2/shared/constants/icons';

@Component({
  selector: 'side-panel-wrapper',
  templateUrl: './side-panel-wrapper.component.html',
  styleUrls: ['./side-panel-wrapper.component.css'],
})
export class SidePanelWrapperComponent implements OnInit {
  @Input() title: string = '';
  @Input() firstButtonLabel: string = 'Add';
  @Input() secondButtonLabel: string = '';
  @Input() isLoading: boolean = false;
  @Input() isSecondaryLoading: boolean = false;
  @Input() isFirstButtonDisabled: boolean = false;
  @Input() isCancelButton: boolean = true;
  @Input() isFooter: boolean = true;
  @Input() backIcon = false;
  @Input() addIcon = false;
  @Input() listIcon = false;
  @Input() showCloseIcon = true;
  @Input() active = '';
  @Input() IconsListingRow = [];
  @Input() actionRowIcons = [];
  @Input() infoText;
  @Input() firstButtonTooltip = '';
  @Input() showSeparator: boolean = false;
  @Input() showAddComment: boolean = false;
  @Output() onFirstClick: EventEmitter<() => void> = new EventEmitter();
  @Output() onSecondClick: EventEmitter<() => void> = new EventEmitter();
  @Output() onCancelClick?: EventEmitter<() => void> = new EventEmitter();
  @Output() onBackClick?: EventEmitter<() => void> = new EventEmitter();
  @Output() onAddClick?: EventEmitter<() => void> = new EventEmitter();
  @Output() onListClick?: EventEmitter<() => void> = new EventEmitter();
  @Output() handleIconClick?: EventEmitter<string> = new EventEmitter();
  @Output() infoIconClick: EventEmitter<void> = new EventEmitter();
  @Output() onAddNewComment: EventEmitter<void> = new EventEmitter<void>();
  ckEditorAddCommentIcon = CKEditorAddCommentIcon;
  ngOnInit(): void {}

  handleCloseClick(event) {
    event.stopPropagation();
    this.onCancelClick.emit();
  }
  handleOnCancelClick(event) {
    event.stopPropagation();
    this.onCancelClick.emit();
  }
  handleOnClick() {
    this.onFirstClick.emit();
  }
  handleOnBackClick() {
    this.onBackClick.emit();
  }
  handleOnAddClick() {
    this.onAddClick.emit();
  }
  handleOnListClick() {
    this.onListClick.emit();
  }
  handleIconClickEvent(iconKey: string) {
    this.active = iconKey;
    if (
      iconKey.startsWith('cancel') ||
      iconKey == 'paste' ||
      iconKey == 'copy-action' ||
      iconKey == 'plus'
    ) {
      this.active = '';
    }
    this.handleIconClick.emit(iconKey);
  }
  onInfoIconClick() {
    this.infoIconClick.emit();
  }
  handleAddNewComment(): void {
    this.onAddNewComment.emit();
  }
}
