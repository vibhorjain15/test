import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { TemplateState } from '../../store/template-builder.state';
import {
  GetTemplateInfo,
  SaveDescription,
  UpdateTemplate,
} from '../../store/template-builder.action';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-add-template-note-description',
  templateUrl: './add-template-note-description.component.html',
  styleUrls: ['./add-template-note-description.component.css'],
})
export class AddTemplateNoteDescriptionComponent implements OnInit {
  @Input() title = '';
  @Input() is_internal_notes = true;
  @Input() empty_notes_message = '';
  @Input() entity_type: string;
  @Input() entity_id: string;
  @Input() loaded_notes: any = [];
  loader: boolean = false;
  tinyMceInit = {
    placeholder:
      'Start typing to leave a note. To mention and notify a team member, type @',
    plugins: 'advcode link lists mentions',
    toolbar: 'bold italic underline | link bullist numlist |  code',
  };

  newNoteText: string = '';
  templateID: number;
  notes: any[] = [];
  loadingNotes: boolean = true;
  loadedNotes: any[] = [];
  pageSize: number = 5;

  @Select(TemplateState.getTemplateInfo) templateInfo: any;

  constructor(
    private readonly store: Store,
    private readonly toast: ToastrService,
    private readonly template: TemplateService,
    private readonly bsModalRef: BsModalRef,
    private readonly SweetAlert: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.setModalTitle();
    this.setEmptyStateMessage();
    this.loadingNotes = false;
    this.loadedNotes = this.loaded_notes;
    this.notes = JSON.parse(JSON.stringify(this.loaded_notes));
    this.templateInfo.pipe(take(1)).subscribe((template) => {
      this.templateID = template?.template?.templateInfo?.id;
    });
    if (!this.templateID) return;
    this.loadingNotes = true;
    this.template.getNotes(this.templateID).subscribe((note: any) => {
      this.notes = note;
      this.loadingNotes = false;
      this.loadMoreNotes();
    });
  }

  setModalTitle() {
    this.title = this.title || `Internal Notes`;
  }

  setEmptyStateMessage() {
    this.empty_notes_message =
      this.empty_notes_message || `No internal notes found for this question.`;
  }

  handleEditorChange(note) {
    this.newNoteText = note;
  }

  onSaveNotes(close) {
    if (!this.newNoteText) {
      this.toast.error('Please enter some text to save as notes');
      return;
    }

    this.loader = true;
    let obj;
    let params: any = {
      text: this.newNoteText,
      entity_id: this.entity_id || this.templateID,
      entity_type: this.entity_type || 'Template',
    };

    if (this.is_internal_notes) {
      params = {
        ...params,
        as_of_date: new Date().toLocaleDateString(),
        type: 'General',
      };
    }

    obj = this.template.addNotes(params);
    obj.subscribe(
      (res) => {
        this.loadedNotes.unshift(res);
        this.notes.unshift(res);
        this.loader = false;
        this.newNoteText = '';
        this.toast.success('Note added successfully');
      },
      (error) => {
        this.loader = false;
        this.toast.error('Some error occurred', error);
      }
    );
  }

  handleDelete(index) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this note ?',
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.template.deleteNotes(this.notes[index].id).subscribe(
            (res) => {
              this.loadedNotes.splice(index, 1);
              this.notes.splice(index, 1);
              this.toast.success('Note deleted successfully');
              swal.close();
            },
            (error) => {
              swal.close();
            }
          );
        });
      },
    }).then(() => {
      swal.close();
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
    this.template.updateNotes(temp).subscribe((res) => {
      this.notes[noteObj.index].text = noteObj.note;
      this.notes[noteObj.index].updated_at = new Date();
      this.loadedNotes[noteObj.index] = {
        ...this.loadedNotes[noteObj.index],
        saving: false,
        editMode: false,
        text: noteObj.note,
      };
      this.toast.success('Note edited successfully');
    });
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
