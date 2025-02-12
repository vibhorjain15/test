import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';

/*
this modal is used to display notes at the following places.
1. internal notes for a template
2. workflow notes
3. Notes in qa-bank page
2. document details page
*/
@Component({
  selector: 'add-notes',
  templateUrl: './add-notes.component.html',
  styleUrls: ['./add-notes.component.css'],
})
export class AddNotesComponent implements OnInit {
  @Input() entityId: number;
  @Input() entityType: string;
  @Input() title: string = 'Internal Notes';
  @Input() showInstructions: boolean = true;
  @Input() emptyStateMessage: string =
    'No internal notes found for this question.';
  @Input() notesPassed: boolean = false; // if you pass notes from the parent itself
  @Input() notes: any[] = [];
  @Input() additionalSaveParams: any;
  @Input() callbackOnAddingNote: any;
  @Input() childId: number;
  @Input() childType: string;
  @Input() saveButtonText = 'Save';
  loader: boolean = false;
  tinyMceInit = {
    placeholder:
      'Start typing to leave a note. To mention and notify a team member, type @',
    plugins: 'advcode link lists mentions',
    toolbar:
      'bold italic underline | \
      link bullist numlist |  code',
    toolbar_location: 'top',
  };
  newNoteText: string = '';
  loadingNotes: boolean = true;
  loadedNotes: any[] = [];
  pageSize: number = 5;

  constructor(
    private readonly toast: ToastrService,
    private readonly service: TemplateService,
    private readonly bsModalRef: BsModalRef,
    private readonly SweetAlert: SweetAlertService,
    private readonly utils: UtilsService
  ) {}

  ngOnInit(): void {
    if (this.notesPassed) {
      // if notes are passed from parent
      this.notesLoadedHandler();
    } else {
      let params: any = {
        entity_id: this.entityId,
        entity_type: this.entityType,
      };
      if (this.childId && this.childType)
        params = {
          ...params,
          child_entity_id: this.childId,
          child_entity_type: this.childType,
        };

      this.loadingNotes = true;
      this.service.getNotes(params).subscribe((note: any) => {
        this.notes = note;
        this.notesLoadedHandler();
      });
    }
  }

  notesLoadedHandler() {
    this.loadingNotes = false;
    this.loadMoreNotes();
  }

  handleEditorChange(note) {
    this.newNoteText = note;
  }

  onSaveNotes() {
    if (!this.newNoteText || !this.utils.trimFormatting(this.newNoteText)) {
      this.toast.error('Please enter some text to save as notes');
      return;
    }

    this.loader = true;
    let params = {
      as_of_date: new Date().toLocaleDateString(),
      type: 'General',
      text: this.newNoteText,
      entity_id: +this.entityId,
      entity_type: this.entityType,
    };
    if (this.additionalSaveParams) {
      params = { ...params, ...this.additionalSaveParams };
    }
    this.service
      .addNotes(params)
      .pipe(
        finalize(() => {
          this.loader = false;
        })
      )
      .subscribe(
        (res) => {
          this.loadedNotes.unshift(res);
          this.notes.unshift(res);
          this.loader = false;
          this.newNoteText = '';
          this.toast.success('Note added successfully');
          if (this.callbackOnAddingNote) {
            this.callbackOnAddingNote();
          }
        }
        // (error) => {
        //   this.toast.error('Some error occurred', error);
        // }
      );
  }

  handleDelete(index) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this note ?',
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.service
            .deleteNotes(this.notes[index].id)
            .pipe(finalize(() => resolve()))
            .subscribe((res) => {
              this.loadedNotes.splice(index, 1);
              this.notes.splice(index, 1);
              this.toast.success('Note deleted successfully');
            });
        });
      },
    });
  }

  handleEditNote(noteObj) {
    if (!noteObj.note) {
      this.handleDelete(noteObj.index);
      return;
    }
    let temp = JSON.parse(JSON.stringify(this.notes[noteObj.index]));
    this.loadedNotes[noteObj.index].saving = true;
    temp.text = noteObj.note;
    this.service.updateNotes(temp).subscribe(
      (res) => {
        this.notes[noteObj.index].text = noteObj.note;
        this.notes[noteObj.index].updated_at = new Date();
        this.loadedNotes[noteObj.index] = {
          ...this.loadedNotes[noteObj.index],
          saving: false,
          editMode: false,
          text: noteObj.note,
        };
        this.toast.success('Note edited successfully');
      },
      (err) => {
        this.loadedNotes[noteObj.index].saving = false;
      }
    );
  }

  cancel() {
    this.bsModalRef.hide();
  }

  loadMoreNotes() {
    if (this.loadedNotes.length < this.notes.length) {
      this.loadedNotes.push(
        ...this.notes.slice(
          this.loadedNotes.length,
          this.loadedNotes.length + this.pageSize
        )
      );
    }
  }
}
