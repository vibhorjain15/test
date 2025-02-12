import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { take } from 'rxjs/operators';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { CacheUtil } from '../../questionnaire/service/cache.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-project-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.css'],
})
export class ProjectNotesComponent implements OnInit {
  diligenceId: number;
  diligence: any;
  note_count: number;
  grouped_notes: any;
  configObj = {
    plugins: 'advcode link lists mentions',
    toolbar:
      'bold italic underline | \
       bullist numlist | link  dv_img_selector',
    toolbar_location: 'bottom',
  };
  @Select(UserState.getCurrentUserData) user;
  current_user: any;
  changeMade: boolean = false;
  PopupNote;
  constructor(
    private readonly http: HttpClient,
    private readonly Utils: UtilsService,
    private readonly projectSummaryService: ProjectSummaryService,
    private readonly SweetAlert: SweetAlertService,
    private readonly toaster: ToastrService,
    private routerService: RouterService,
    private cache: CacheUtil,
    private routeState: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.routerService.createListener((url, extras) => {
      if (this.changeMade) {
        this.SweetAlert.confirm({
          title: 'You have unsaved on this page',
          text: 'All your unsaved will be lost if you leave this page',
          cancelButtonText: 'Do Not Save',
          confirmButtonText: 'Save & Exit',
          customClass: 'danger-on-cancel',
          showCloseButton: true,
          reverseButtons: false,
          showLoaderOnConfirm: true,
          focusCancel: true,
          preConfirm: () => {
            this.updateNote(this.PopupNote);
            this.clearCacheBeforeRouting();
            this.routerService.navigateAngular(url, extras);
          },
        }).then((alert) => {
          if (alert.dismiss && alert.dismiss == 'cancel') {
            this.clearCacheBeforeRouting();
            this.SweetAlert.close();
            this.routerService.navigateAngular(url, extras);
          }
        });
        return true;
      } else {
        this.clearCacheBeforeRouting();
        this.routerService.navigateAngular(url, extras);
      }
      return null;
    });

    this.diligenceId = parseInt(
      this.routerService.getState().params.diligenceId
    );

    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.current_user = data;
        this.getCurrentDiligence();
        this.getNotes();
      }
    });
  }

  getCurrentDiligence() {
    this.projectSummaryService
      .getCurrentDiligence(this.diligenceId, this.current_user)
      .subscribe((diligence: any) => {
        this.diligence = diligence;
      });
  }

  handleEditorTextChange(note, data) {
    note.text = data;
    this.PopupNote = note;
    this.changeMade = true;
  }

  editNote(note) {
    note.editing = true;
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
              let id = note.question_id ?? note.section_id;
              const index = this.grouped_notes
                .find((x) => x.question_id == id)
                .notes.findIndex((x) => x.id === note.id);
              this.grouped_notes
                .find((x) => x.question_id == id)
                .notes.splice(index, 1);
              if (
                !this.grouped_notes.find((x) => x.question_id == id).notes
                  .length
              ) {
                const index = this.grouped_notes.findIndex(
                  (x) => x.question_id == id
                );
                this.grouped_notes.splice(index, 1);
              }
              this.note_count--;
              this.toaster.success('Note deleted successfully!');
              resolve();
            });
        });
      },
    });
  }

  updateNote(note) {
    if (note.text) {
      note.updating_note = true;
      this.http.put(`notes/${note.id}`, note).subscribe((response: any) => {
        note.original_text = note.text = response.text;
        note.updated_at = response.updated_at;
        note.editing = false;
        this.toaster.success('Note edited successfully');
        note.updating_note = false;
        this.changeMade = false;
      });
    }
  }

  cancel(note) {
    note.text = note.original_text;
    note.editing = false;
  }

  getNotes() {
    this.http
      .get('notes', {
        params: { entity_type: 'Duediligence', entity_id: this.diligenceId },
      })
      .subscribe((response: Array<any>) => {
        this.addNoteAttributes(response);
        let questionNotes = response.filter((note) => note.question_id);
        let subcatNotes = response.filter((note) => !note.question_id);
        this.note_count = response.length;
        const grouped_notes_question = this.Utils.groupByArray(
          questionNotes,
          'question_id'
        );
        const grouped_notes_subsection = this.Utils.groupByArray(
          subcatNotes,
          'section_id'
        );
        this.grouped_notes = new Array<any>();
        this.addGroupedNotes(grouped_notes_subsection);
        this.addGroupedNotes(grouped_notes_question);
      });
  }

  addGroupedNotes(noteGroup) {
    Object.keys(noteGroup).forEach((key) => {
      const arr = noteGroup[key];
      const obj = {
        question_id: arr[0].question_id ?? arr[0].section_id,
        notes: arr,
      };
      this.grouped_notes.push(obj);
    });
  }

  addNoteAttributes(response: any[]) {
    response.forEach((note) => {
      note.editing = false;
      note.updating_note = false;
      note.can_edit = note.created_by === this.Utils.getCurrentUser().id;
      note.original_text = note.text;
    });
  }

  handleQuestionRedirect(group) {
    this.routerService.navigateToRelativeRoute(
      `/questionnaire/category/${group.notes[0].parent_section_id}/question/${group.notes[0].question_id}`,
      this.routeState,
      {
        queryParams: {
          panel: 'notes',
        },
        fragment: `child_section_${group.notes[0].section_id}`,
      }
    );
  }

  handleSubCatClick(group) {
    this.routerService.navigateToRelativeRoute(
      `questionnaire/category/${group.notes[0].parent_section_id}`,
      this.routeState,
      {
        queryParams: {
          panel: 'notes',
        },
        fragment: `child_section_${group.notes[0].section_id}`,
      }
    );
  }

  handleCatClick(group) {
    this.routerService.navigateToRelativeRoute(
      `questionnaire/category/${group.notes[0].parent_section_id}`,
      this.routeState
    );
  }

  redirectToSummary() {
    this.routerService.navigateToRelativeRoute('summary', this.routeState);
  }

  clearCacheBeforeRouting() {
    this.routerService.destroyListener();
    this.cache.clearCache();
  }

  ngOnDestroy(): void {
    this.routerService.destroyListener();
    this.cache.clearCache();
  }
}
