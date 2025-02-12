import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';

@Component({
  selector: 'app-document-notes-sidebar',
  templateUrl: './document-notes-sidebar.component.html',
  styleUrls: ['./document-notes-sidebar.component.css'],
})
export class DocumentNotesSidebarComponent implements OnInit {
  tinyMceInit: { menubar: boolean; statusbar: boolean; toolbar: string };
  attachment_notes: any[];
  loading_attachment_notes: boolean;
  saving_notes: boolean;
  text: string;
  @Input() attachment: any;
  @Input() diligenceId: number;

  constructor(
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private readonly Utils: UtilsService
  ) {}

  ngOnInit(): void {
    this.tinyMceInit = {
      menubar: false,
      statusbar: false,
      toolbar: ' ',
    };
    this.getNotes();
  }

  getNotes() {
    this.loading_attachment_notes = true;
    this.http
      .get('notes', {
        params: {
          entity_id: this.attachment.entity_id,
          entity_type: 'Attachment',
        },
      })
      .subscribe((response: Array<any>) => {
        this.addNoteAttributes(response);
        this.attachment_notes = response;
        this.loading_attachment_notes = false;
      });
  }

  handleEditorTextChange(data) {
    this.text = data;
  }

  handleEditorTextChangeForExistingNotes(note, data) {
    note.text = data;
  }

  trackById(index: number, val: any): number {
    return val.id;
  }

  saveNotes() {
    if (!this.text) {
      return;
    }
    this.saving_notes = true;
    const notesParams = {
      entity_type: 'Attachment',
      entity_id: this.diligenceId,
      text: this.text,
      type: 'General',
    };
    this.http.post('notes', notesParams).subscribe(
      (response: any) => {
        this.attachment_notes.push(response);
        this.addNoteAttributes(this.attachment_notes);
        this.saving_notes = false;
        this.toaster.success('Your notes are added!');
        this.text = '';
      },
      (err) => (this.saving_notes = false)
    );
  }

  editNote(note) {
    note.editing = true;
  }

  updateNote(note) {
    if (note.text) {
      note.updating_note = true;
      this.http.put(`notes/${note.id}`, note).subscribe((response: any) => {
        note.original_text = note.text = response.text;
        note.updated_at = response.updated_at;
        note.editing = false;
        note.updating_note = false;
        const index = this.attachment_notes.find((x) => x.id == note.id);
        this.attachment_notes[index] = note;
      });
    }
  }

  cancel(note) {
    note.text = note.original_text;
    note.editing = false;
  }

  addNoteAttributes(response: any[]) {
    response.forEach((note) => {
      note.editing = false;
      note.updating_note = false;
      note.can_edit = note.created_by === this.Utils.getCurrentUser().id;
      note.original_text = note.text;
    });
  }

  deleteNote(note) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this note ?',
      confirmButtonText: 'Yes, delete it!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.http
            .delete(`notes/${note.id}`)
            .pipe(finalize(() => resolve()))
            .subscribe((response: any) => {
              const index = this.attachment_notes.find((x) => x.id == note.id);
              this.attachment_notes.splice(index, 1);
              this.toaster.success('Note deleted successfully!');
              resolve();
            });
        });
      },
    });
  }
}
