import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { MentionsFactoryService } from 'src/app2/services/mentions-factory.service';
import { keywordConstants } from '../../constants/constant';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from 'src/app2/services/utils.service';
import { EventEmitter } from '@angular/core';
import { Output } from '@angular/core';
declare var $: any;
@Component({
  selector: 'dv-note-side-bar',
  templateUrl: './dv-note-side-bar.component.html',
})
export class DvNoteSideBarComponent implements OnInit {
  @Input() displaySidebarPanel: boolean;
  @Input() sidebarTitle: boolean;
  @Input() params: string;
  @Output() onClose = new EventEmitter<any>();

  loadingNotes: boolean = true;
  questionNotes: any;
  new_note: any = {};
  pageUrl: string;
  saving_notes: boolean;

  constructor(
    private readonly toaster: ToastrService,
    private readonly MentionsFactory: MentionsFactoryService,
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private Utils: UtilsService
  ) {
    this.new_note = {
      text: '',
      mentions: null,
    };
  }

  ngOnInit(): void {
    this.getNotes();
  }

  getNotes() {
    this.loadingNotes = true;
    this.http.get(`notes?${$.param(this.params)}`).subscribe(
      (response: any) => {
        this.questionNotes = response;
        this.questionNotes = this.questionNotes.map((val) => {
          val.editing = false;
          val.updating_note = false;
          return val;
        });
        this.loadingNotes = false;
      },
      () => {
        this.loadingNotes = false;
      }
    );
  }

  handleEditorTextChange(data) {
    this.new_note.text = data;
  }

  handleEditorTextUpdate(data, note) {
    note.text = data;
  }

  closeSidebarPanel() {
    let scope_has_unsaved_changes = false;
    this.onClose.emit({});
    let editNotes = this.questionNotes.filter((val) => val.editing);
    if (this.new_note?.text || editNotes.length > 0) {
      scope_has_unsaved_changes = true;
      if (scope_has_unsaved_changes) {
        this.SweetAlert.confirm({
          title: 'You have unsaved changes on this page',
          text: 'All your unsaved changes will be lost if you leave this page',
          cancelButtonText: 'Do Not Save',
          confirmButtonText: 'Save & Exit',
          showLoaderOnConfirm: true,
          showCloseButton: true,
          focusCancel: false,
          preConfirm: () => {
            if (this.new_note.text) {
              this.saveNotes();
            } else {
              editNotes.map((val) => {
                this.updateNote(val);
              });
            }
            this.displaySidebarPanel = false;
          },
        }).then((isConfirm: { dismiss: string }) => {
          if (isConfirm.dismiss && isConfirm.dismiss === 'cancel') {
            this.displaySidebarPanel = false;
          }
        });
      } else {
        this.displaySidebarPanel = false;
      }
    } else {
      this.displaySidebarPanel = false;
    }
  }

  updateNote(note) {
    if (!note.text) {
      return;
    }

    let mentions = null;
    if (note.text.length > 0) {
      const mentioned_members_ids = this.MentionsFactory.getMentionedIds(
        note.text,
        true
      );
      if (mentioned_members_ids.length > 0) {
        mentions = mentioned_members_ids;
      }
    }
    note.updating_note = true;
    const notesParams = {
      ...note,
      mentions,
    };
    this.http.put('notes/' + note.id, notesParams).subscribe(
      (res: any) => {
        note.text = res.text;
        note.mentions = res.mentions;
        note.updating_note = false;
        note.editing = false;
      },
      (error) => {
        note.updating_note = false;
      }
    );
  }

  deleteNote(note) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this note ?',
      confirmButtonText: 'Yes, delete it!',
      focusCancel: true,
    }).then((isConfirm: { value: boolean }) => {
      if (isConfirm.value && isConfirm.value === true) {
        this.http.delete('notes/ ' + note.id).subscribe(
          (res) => {
            this.questionNotes = this.questionNotes.filter(
              (val) => val.id != note.id
            );
          },
          (error) => {}
        );
      }
    });
  }

  saveNotes() {
    if (!this.new_note?.text) {
      return;
    }
    this.saving_notes = true;
    const notesParams = {
      entity_id: this.params['entity_id'],
      entity_type: this.params['entity_type'],
      text: this.new_note.text,
    };
    this.http.post(`notes`, notesParams).subscribe(
      (response: any) => {
        const message = 'Your notes are added!';
        response.editing = false;
        response.updating_note = false;

        this.questionNotes.unshift(response);
        this.toaster.success('', message);
        this.saving_notes = false;
        this.resetForm();
      },
      (error) => {
        this.saving_notes = false;
      }
    );
  }

  generatePageUrl(questions) {
    let pageUrl = '';
    questions.forEach((question: any, index: number) => {
      pageUrl += this.generateEntityUrl(question);
      if (index !== questions.length - 1) {
        pageUrl += ',';
      }
    });
    return pageUrl;
  }

  generateEntityUrl(entity) {
    if (
      entity?.entity_id &&
      entity.associated_entity_type.toLowerCase() ===
        keywordConstants.Firm.toLowerCase()
    ) {
      return `app/firms/${entity.entity_id}/question_detail`;
    } else if (
      entity?.entity_id &&
      entity.associated_entity_type.toLowerCase() ===
        keywordConstants.Product.toLowerCase()
    ) {
      return `app/funds/${entity.entity_id}/question_detail`;
    }
    return '';
  }

  resetForm() {
    this.new_note = {
      text: '',
      mentions: null,
    };
  }

  editNote(note) {
    note.editing = true;
    note['old-text'] = note.text;
  }
  editCancel(note) {
    note.editing = false;
    note.text = note['old-text'];
  }

  canEditNote(note: { created_by: any }) {
    return note.created_by === this.Utils.getCurrentUser().id;
  }
}
