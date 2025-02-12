import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';
import { MentionsFactoryService } from 'src/app2/services/mentions-factory.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
@Component({
  selector: 'app-dv-notes',
  templateUrl: './dv-notes.component.html',
  styleUrls: ['./dv-notes.component.css'],
})
export class DvNotesComponent implements OnInit, OnChanges {
  @Input() entityType;
  @Input() entityId;
  @Input() notesOptions;
  @Input() entityName;
  @Input() pageUrl;
  @Input() dateFilter;
  @Input() currentUser: any;
  @ViewChild('noteContainer', { static: true }) noteContainer: ElementRef<HTMLElement>;
  newNoteId: string;
  tinymceOptions;
  selected_action_type;
  note_id;
  notesList = [];
  loadingNotes;
  loadingNoteTypes = false;
  add_new_activity;
  note_types = [{ id: 1116, value: 'General' }];
  printOptions: { pageTitle: any };
  entityDisplayName: any;
  customDateFilter: any;
  maxAsOfDate: any;
  due_date: Date;
  action_types: { label: string; value: string; icon: string }[];
  tinymceEditor: any;
  tinymcePlugins =
    'preview lists hr link autolink image fullscreen paste placeholder table footnotes dv_img_selector';
  tinymceMentionsPlaceholderText =
    'Start typing to leave a note. To mention and notify a team member, type @';
  tinymceToolbarFull = `bold italic underline | alignleft aligncenter alignright alignjustify | superscript | forecolor backcolor | link dv_img_selector | table | bullist numlist | hr | undo redo | fullscreen | footnotes`;
  tinymceStatusbar = '';
  add_activities_form_new: any;
  saving_activity: boolean;
  uploading_image: boolean;
  resultBlob: any;
  filteredTeamMembers: any[];
  tinyMceInit;
  date: Date;
  init: any = {
    placeholder:
      'Start typing to leave a note. To mention and notify a team member, type @',
  };

  constructor(
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly MentionsFactory: MentionsFactoryService,
    private readonly SweetAlert: SweetAlertService,
    private readonly BaseDataService: BaseDataService,
    private datePipe: DatePipe,
    private readonly ImageService: ImageDataService,
    private readonly customModalService: CustomModalService,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit() {
    // this.initTinyMc();
    this.getNotesTypes();
    this.entityDisplayName = this.Utils.getDisplayEntityType(this.entityType)
      ? this.Utils.getDisplayEntityType(this.entityType)
      : this.entityType;
    this.customDateFilter = this.dateFilter;
    this.note_id = null;
    this.maxAsOfDate = this.Utils.getMaxAsOfDate();
    this.due_date = new Date();
    this.action_types = [
      {
        label: 'New Note',
        value: 'note',
        icon: 'notepad',
      },
    ];
    this.selected_action_type = this.action_types[0];
    this.initAddActivityForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes?.dateFilter?.currentValue !== changes?.dateFilter?.previousValue
    ) {
      this.customDateFilter = changes?.dateFilter?.currentValue;
      this.getNotes();
    }
  }

  getNotes() {
    this.loadingNotes = true;
    const params: any = {
      entity_type: this.entityType,
      entity_id: this.entityId,
    };
    if (this.customDateFilter) {
      params.start_date = this.customDateFilter.startDate;
      params.end_date = this.customDateFilter.endDate;
    }
    this.http.get(`notes`, { params }).subscribe((response: any) => {
      this.notesList = response;
      this.setNoteDropdownOptions();
      this.loadingNotes = false;
    });
  }

  setNoteDropdownOptions() {
    this.notesList.forEach((note) => {
      note.toggleDropdown = false;
      const options = [];
      if (note.type !== 'Email') {
        options.push({ key: 'edit_note', label: 'Edit Note' });
        options.push({ key: 'divider', label: 'Edit Note' });
      }
      options.push({
        key: note.type === 'Email' ? 'delete_email' : 'delete_note',
        label: `Delete ${note.type === 'Email' ? 'Email' : 'Note'}`,
      });
      note.options = options;
    });
  }

  getNotesTypes() {
    this.loadingNoteTypes = true;
    this.http.get(`touch_points`).subscribe((response: any) => {
      this.note_types = response;
      this.add_new_activity.type = 1116;
      this.loadingNoteTypes = false;
    });
  }

  setActionType(index) {
    this.selected_action_type = this.action_types[index];
    this.initAddActivityForm();
  }

  openQuestionnaireUploadModal(editor) {
    this.ngZone.run(() => {
      this.customModalService.invoke('questionnaire-upload-image', {
        initialState: {
          editor: editor,
        },
        class: 'modal-xl',
      });
    });
  }

  initTinyMc() {
    this.init = {
      statusbar: this.tinymceStatusbar,
      automatic_uploads: false,
      init_instance_callback: (editor) => {
        this.tinymceEditor = editor;
        editor.on('NodeChange', (e) => {
          const img = editor.dom.select('img');
          if (img) {
            img.forEach((image) => {
              if (!image.alt) {
                image.alt = 'dv note image';
              }
            });
          }
        });
      },
      images_upload_handler: (blobInfo, success, failure) => {
        this.uploadImages(blobInfo, success, failure);
      },
      render: (editor) => {
        this.openQuestionnaireUploadModal(editor);
      },
    };
    this.tinymceOptions = {
      init_instance_callback: (editor) => {
        this.tinymceEditor = editor;
      },
      images_upload_handler: (blobInfo, success, failure) => {
        this.uploadImages(blobInfo, success, failure);
      },
      skin_url: '/assets/stylesheets/tinymce/skins/tinymce-dv',
      browser_spellcheck: true,
      plugins: this.tinymcePlugins,
      placeholderTextContent: this.tinymceMentionsPlaceholderText,
      custom_undo_redo_levels: 10,
      toolbar: this.tinymceToolbarFull,
      paste_data_images: true,
      paste_filter_drop: false,
      menubar: false,
      height: this.notesOptions.height ? this.notesOptions.height : 250,
      statusbar: this.tinymceStatusbar,
      branding: false,
      resize: false,
      elementpath: false,
      image_dimensions: false,
      forced_root_block: '',
      hidden_btn_groups: [],
      table_toolbar: '',
      content_css: 'assets/stylesheets/tiny_mce_custom.css',
      render: (editor) => {
        this.customModalService.invoke('questionnaire-upload-image', {
          initialState: {
            editor: editor,
          },
          class: 'modal-xl',
        });
      },
      placeholder: this.tinymceMentionsPlaceholderText,
    };
  }

  editNote(note) {
    this.add_new_activity.text = note.text;
    this.add_new_activity.type = note.type_id;
    this.date = new Date(note.as_of_date);
    this.note_id = note.id;
    this.selected_action_type = this.action_types[0];
  }

  initAddActivityForm() {
    this.note_id = null;
    this.add_new_activity = {};
    this.add_new_activity.type = 1116;
    this.date = new Date();
    this.add_new_activity.assigned_to = this.currentUser.id;
    this.add_activities_form_new?.$setPristine();
    this.add_activities_form_new?.$setUntouched();
  }

  setDateValue(date) {
    this.date = date;
  }

  activityAdditionSuccessful(message) {
    this.saving_activity = false;
    this.toaster.success('', message);
    this.initAddActivityForm();
  }

  uploadImages(blobInfo, success, failure) {
    this.uploading_image = true;
    this.resultBlob = this.b64toBlob(blobInfo.base64());
    this.resultBlob.name = blobInfo.filename();
    const payload = new FormData();
    payload.append(
      'file',
      this.resultBlob,
      blobInfo.filename() + new Date().getTime() + '.png'
    );
    this.ImageService.uploadImageDirect(payload).subscribe(
      (response) => {
        success(response[0].blobUrl);
        this.uploading_image = false;
      },
      (error) => {
        this.uploading_image = false;
        failure(error);
      }
    );
  }

  b64toBlob(b64Data, contentType?, sliceSize?) {
    let blob,
      byteArray,
      byteArrays,
      byteCharacters,
      byteNumbers,
      i,
      offset,
      slice;
    if (!contentType) {
      contentType = '';
    }
    if (!sliceSize) {
      sliceSize = 512;
    }
    byteCharacters = atob(b64Data);
    byteArrays = [];
    offset = 0;
    while (offset < byteCharacters.length) {
      slice = byteCharacters.slice(offset, offset + sliceSize);
      byteNumbers = new Array(slice.length);
      i = 0;
      while (i < slice.length) {
        byteNumbers[i] = slice.charCodeAt(i);
        i++;
      }
      byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
      offset += sliceSize;
    }
    blob = new Blob(byteArrays, {
      type: contentType,
    });
    return blob;
  }

  addActivity() {
    this.add_new_activity.entity_id = this.entityId;
    this.add_new_activity.entity_type = this.entityType;
    this.add_new_activity.as_of_date = this.datePipe.transform(
      this.date,
      'd-MMMM-yyyy'
    );
    let apiObj: any = {};
    apiObj = JSON.parse(JSON.stringify(this.add_new_activity));
    apiObj.text = this.add_new_activity.text;
    if (!apiObj.text) {
      this.toaster.error('Please add note text');
      return;
    }
    apiObj.mentions = this.Utils.getMentionsIds(this.add_new_activity.text);
    this.saving_activity = true;
    if (this.selected_action_type.value === 'note') {
      if (this.note_id) {
        this.http.put(`notes/${this.note_id}`, apiObj).subscribe(
          (response: any) => {
            this.notesList = this.notesList.map((val) => {
              val.toggleDropDown = false;
              if (val.id === this.note_id) {
                return response;
              }
              return val;
            });
            this.notesList = this.Utils.sortByDescTime(
              this.notesList,
              'updated_at'
            );
            this.setNoteDropdownOptions();
            this.activityAdditionSuccessful('Your notes are updated!');
            this.saving_activity = false;
          },
          (error) => {
            this.saving_activity = false;
          }
        );
      } else {
        this.http.post(`notes`, apiObj).subscribe(
          (response: any) => {
            const message = 'Your notes are added!';
            this.activityAdditionSuccessful(message);
            this.notesList.unshift(response);
            this.setNoteDropdownOptions();
            this.saving_activity = false;
            this.newNoteId = `note_id_${response.id}`;
            this.scrollNoteContainerToTop();
          },
          (error) => {
            this.saving_activity = false;
          }
        );
      }
    }
  }

  scrollNoteContainerToTop(): void {
    this.noteContainer.nativeElement.scrollTop = 0;
  }

  filterTeamMembers(term) {
    this.filteredTeamMembers = this.MentionsFactory.getFilteredMembers(term);
  }

  getDisplayName(user) {
    this.tinymceEditor.insertContent('');
    this.MentionsFactory.getDisplayName(user, true);
  }

  deleteNoteFromUI(index) {
    this.notesList.splice(index, 1);
    this.toaster.success('', 'Deletion successful', { timeOut: 5000 });
  }

  deleteNote(note, index) {
    const noteType = note.type === 'Email' ? 'Email' : 'Note';
    this.SweetAlert.confirm({
      title: 'Are you sure you want to delete this ' + noteType + '?',
      confirmButtonText: 'Yes, Please!',
      showLoaderOnConfirm: true,
      focusCancel: true,
      preConfirm: () => {
        if (note.type === 'Email') {
          this.BaseDataService.deleteEmail(note.id).subscribe(() => {
            this.deleteNoteFromUI(index);
          });
        } else {
          this.BaseDataService.deleteNote(note.id).subscribe(() => {
            this.deleteNoteFromUI(index);
          });
        }
      },
    });
  }

  openAttachmentModal(id) {}

  trackByIndex(index: number, element): number {
    return index;
  }

  printSection() {
    const el = document.getElementById('notes-print-section');
    const body = document.getElementsByTagName('BODY')[0];
    body.classList.add('print-initiated');
    el.classList.add('print-section');
    window.print();
    setTimeout(() => body.classList.remove('print-initiated'));
  }

  handleEditChange(data) {
    this.add_new_activity.text = data;
  }

  noteDropdownClick(dvDropdownEvent, note, optionIndex) {
    dvDropdownEvent.key === 'edit_note'
      ? this.editNote(note)
      : this.deleteNote(note, optionIndex);
  }
}
