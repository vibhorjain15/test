import {
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { SidePanelService } from 'src/app2/services/side-panel.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import * as moment from 'moment';
import { QaInfoTab } from '../../components/qa-info-tab/qa-info-tab.component';

@Component({
  selector: 'internal-notes',
  templateUrl: './internal-notes.component.html',
  styleUrls: ['./internal-notes.component.css'],
})
export class InternalNotesComponent implements OnInit {
  @Input() question;
  @Input() type: 'Question' | 'Section' = 'Question';
  @Input() onSuccess;
  @Input() readOnly: boolean = false;
  @Input() notes: any; // if notes list is directly passed to the component
  @Input() entity_id: number; // diligence.id for diligence case
  @Input() child_entity_id: number; // get from data from question data
  @Input() child_entity_type: string;
  @ViewChildren('notes')
  noteCmp: QueryList<QaInfoTab>;
  entity_type: string = 'Duediligence'; // static for questionnaire/qabank
  noteText: string;
  loading: boolean = false;
  editMode: boolean;
  buttonLoader: boolean = false;
  tinyMceInit = {
    plugins: 'advcode link lists mentions',
    toolbar:
      'bold italic underline | \
       bullist numlist | link | dv_img_selector',
    toolbar_location: 'bottom',
    placeholder:
      'Start typing to leave a note. To mention and notify a team member, type @',
  };

  constructor(
    readonly panel: SidePanelService,
    readonly util: UtilsService,
    private readonly questionnaire: QuestionnaireService,
    private readonly toaster: ToastrService,
    private SweetAlert: SweetAlertService
  ) {}
  ngOnInit(): void {
    this.loading = true;

    if (!this.notes) {
      this.questionnaire
        .getQuestionInternalNotes(
          this.child_entity_id,
          this.child_entity_type,
          this.entity_id,
          this.entity_type
        )
        .subscribe(
          (notes: any) => {
            this.loading = false;
            if (notes) this.notes = notes.reverse();
          },
          (error) => (this.loading = false)
        );
    } else {
      this.loading = false;
    }
  }

  handleNoteEdit(note) {
    let noteTemp = this.util.trimFormatting(note);
    if (noteTemp.length) this.noteText = note;
    else this.noteText = '';
  }
  onCancel() {
    this.panel.close();
  }
  saveNote(close) {
    this.buttonLoader = true;
    let params = {
      child_entity_id: this.child_entity_id,
      Child_entity_type: this.child_entity_type,
      entity_id: this.entity_id,
      entity_type: this.entity_type,
      text: this.noteText,
      type: 'General',
    };
    this.questionnaire.postNotes(params).subscribe(
      (res) => {
        this.notes.push(res);
        this.toaster.success('Note was added');
        this.noteText = '';
        this.buttonLoader = false;
        this.onSuccess('add');
      },
      (error) => (this.buttonLoader = false)
    );
  }

  handleDelete(index) {
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete the note?',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        this.questionnaire.deleteInternalNotes(this.notes[index]).subscribe(
          (res) => {
            this.notes.splice(index, 1);
            this.toaster.success('Note deleted successfully');
            this.onSuccess('delete');
          },
          (error) => (this.buttonLoader = false)
        );
      },
    });
  }

  handleEditMode(mode, index) {
    this.noteCmp.toArray().forEach((note, ind) => {
      if (index !== ind) note.onEditClose();
    });
    this.editMode = mode;
  }

  handleEditNote(noteObj) {
    let temp = JSON.parse(JSON.stringify(this.notes[noteObj.index]));
    temp.text = noteObj.note;
    temp.updated_at = moment.utc();
    this.questionnaire.editInternalNotes(temp).subscribe(
      (res) => {
        noteObj.instance.onEdit();
        this.notes.splice(noteObj.index, 1);
        this.notes.push(temp);
        this.toaster.success('Note successfully edited');
      },
      (err) => (noteObj.instance.editButtonLoad = false)
    );
  }
}
