import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'dv-segment',
  templateUrl: './dv-segment.component.html',
  styleUrls: ['./dv-segment.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateSegmentComponent implements OnInit, OnChanges {
  @Input() title = '';
  @Input() isBulkAction = false;
  @Input() bulkActionTooltip = '';
  @Input() isMoveAction = false;
  @Input() isSearch = true;
  @Input() isAdd = true;
  @Input() isMoveClicked = false;
  @Input() background: 'dark' | 'default' = 'default';
  @Input() dvTooltip;
  @Input() actionIconsList? = [];
  @Input() actionButtonsList? = [];
  @Output() onSearchChange = new EventEmitter();
  @Output() onAddClick = new EventEmitter();
  @Output() onMoveClick = new EventEmitter();
  @Output() onSelectAllClick = new EventEmitter();
  @Output() onDropdownClick = new EventEmitter();
  @Output() handleIconClick = new EventEmitter();
  selectAllCheckBox: boolean;
  search = '';
  selectAllLabel = SelectAll;

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes?.isMoveClicked &&
      changes?.isMoveClicked.currentValue !==
        changes?.isMoveClicked.previousValue
    ) {
      this.selectAllLabel = SelectAll;
    }
  }

  isOpen = false;

  handleSearchOpenClick() {
    this.isOpen = true;
  }
  handleSearchCloseClick() {
    this.isOpen = false;
    this.search = '';
    this.handleSearchChange('');
  }

  handleSearchChange(data) {
    this.onSearchChange.emit(data);
  }

  handleAddClick() {
    this.onAddClick.emit();
  }

  handleMoveClick() {
    this.selectAllCheckBox = false;
    this.isMoveClicked = !this.isMoveClicked;
    this.onMoveClick.emit(this.isMoveClicked);
  }

  handleDropdownClick(data) {
    this.onDropdownClick.emit(data);
  }

  handleOnSelectAll() {
    this.handleIconClick.emit(`action-select-all`);
  }

  onIconClick(iconKey: string) {
    if (iconKey.startsWith(`cancel`)) {
      if (iconKey !== 'cancel-bulk-search') {
        this.selectAllCheckBox = false;
      }
      if (iconKey === 'action-select-all') {
        this.selectAllCheckBox = false;
      }
      this.search = '';
      this.handleSearchChange('');
    }
    this.handleIconClick.emit(iconKey);
  }
}

const SelectAll = 'Select All';
