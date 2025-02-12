import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngxs/store';
import { UtilsService } from 'src/app2/services/utils.service';
import { ResponseType } from '../../../modules/questionnaire/constants/Response-type.constant';

@Component({
  selector: 'dv-qa-info-tab',
  templateUrl: './qa-info-tab.component.html',
  styleUrls: ['./qa-info-tab.component.css'],
})
export class QaInfoTab implements OnInit {
  @Input() firstName: string = '';
  @Input() index: number;
  @Input() lastName: string = '';
  @Input() note: string;
  @Input() lastEdited: string;
  @Input() userId: any;
  @Input() showNumber: boolean = true;
  @Input() noteType?: 'revision';
  @Input() showIcons: boolean = true;
  @Input() readOnly: boolean = false;
  currentUserData: any;
  @Input() customNoteButton: boolean;
  @Input() sourceInput;
  @Input() customClass = 'note-content';
  @Input() mainObj: any;
  @Input() isDeleted: boolean;
  @Output() onDeleteEvent: EventEmitter<any> = new EventEmitter();
  @Output() onEditMode: EventEmitter<any> = new EventEmitter();
  @Output() onEditNote: EventEmitter<any> = new EventEmitter();
  @Output() onCustomButtonClick: EventEmitter<any> = new EventEmitter();
  editMode: boolean = false;
  isEditable: boolean = false;
  editedNote: any;
  editButtonLoad: boolean;
  tinyMceInit = {
    placeholder:
      'Start typing to leave a note. To mention and notify a team member, type @',
    plugins: 'advcode link lists mentions',
    toolbar:
      'bold italic underline | \
       bullist numlist | link | dv_img_selector',
    toolbar_location: 'bottom',
  };
  responseType = ResponseType;
  constructor(
    private readonly store: Store,
    private readonly util: UtilsService
  ) {}

  ngOnInit(): void {
    this.currentUserData = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );

    this.isEditable = this.currentUserData.id == this.userId && !this.readOnly;
  }

  // when edit icon is clicked
  onEdit() {
    if (!this.isEditable || this.readOnly) return;
    this.editedNote = this.note;
    this.editMode = !this.editMode;
    this.editButtonLoad = false;
    this.onEditMode.emit(this.editMode);
  }

  onEditClose() {
    this.editedNote = this.note;
    this.editMode = false;
    this.editButtonLoad = false;
  }

  onDelete() {
    if (!this.isEditable || this.readOnly) return;
    this.onDeleteEvent.emit(this.index);
  }

  // when the edit button is clicked
  handleEdit() {
    let params = {
      note: this.editedNote,
      index: this.index,
      instance: this,
    };
    this.editButtonLoad = true;
    this.onEditNote.emit(params);
  }

  handleCustomButtonClick() {
    this.onCustomButtonClick.emit(this.index);
  }
  onEditChange(note) {
    let noteTemp = this.util.trimFormatting(note);
    if (noteTemp.length) this.editedNote = note;
    else this.editedNote = '';
  }
}
