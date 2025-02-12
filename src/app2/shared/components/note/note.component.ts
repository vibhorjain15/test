import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngxs/store';

@Component({
  selector: 'note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css'],
})
export class NoteComponent implements OnInit {
  @Input() firstName: string;
  @Input() index: number;
  @Input() lastName: string;
  @Input() note: string;
  @Input() lastEdited: string;
  @Input() userId: any;
  @Input() showNumber: boolean = true;
  @Input() showIcons: boolean = true;
  @Input() readOnly: boolean = false;
  currentUserData: any;
  @Input() customNoteButton: boolean;
  @Output() onDeleteEvent: EventEmitter<any> = new EventEmitter();
  @Output() onEditMode: EventEmitter<any> = new EventEmitter();
  @Output() onEditNote: EventEmitter<any> = new EventEmitter();
  @Output() onCustomButtonClick: EventEmitter<any> = new EventEmitter();
  @Input() editMode: boolean;
  @Input() isSaving: boolean = false;
  isEditable: boolean = true;
  editedNote: any;
  tinyMceInit = {
    placeholder:
      'Start typing to leave a note. To mention and notify a team member, type @',
    plugins: 'advcode link lists mentions',
    toolbar: 'bold italic underline | \
      link bullist numlist |  code',
    toolbar_location: 'top',
  };
  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    this.currentUserData = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    this.isEditable = this.currentUserData.id == this.userId;
  }

  // when edit icon is clicked
  onEdit() {
    if (!this.isEditable || this.readOnly) return;
    this.editedNote = this.note;
    this.editMode = !this.editMode;
    this.onEditMode.emit(this.editMode);
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
    };
    this.onEditNote.emit(params);
  }

  handleCustomButtonClick() {
    this.onCustomButtonClick.emit(this.index);
  }
  onEditChange(note) {
    this.editedNote = note;
  }
}
