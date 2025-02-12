import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { errorMessageMap, Regex } from 'src/app2/shared/constants/constant';
import { DocumentDataService } from 'src/app2/services/document-data.service';
import { ColorTheme } from 'src/app2/shared/themes/color.themes';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'new-documents',
  templateUrl: './new-documents.component.html',
  styleUrls: ['./new-documents.component.css'],
})

/*
  Used as a direct modal in questionnaire page
  Used as a selector in entity documents page inside ManageDocumentsComponent modal
*/
export class NewDocumentsComponent implements OnInit {
  @Input() existingAttachments: any[];
  @Input() success: any;
  @Input() editMode: boolean = false;
  @Input() canSave: boolean = true;
  @Input() showHeader: boolean = true;
  @Input() showUploadDocumentOnEdit: boolean = false;
  @Input() allowMultiple: boolean = true;
  @Input() acceptedExtensions: string = '*';
  @Input() canModifyDocument: boolean = true;
  @Input() documentRequired: boolean = true;
  @Input() isFile: boolean = true;
  @Input() parentAttachmentHierarchyId = null;
  @Output() onSuccess = new EventEmitter<any>();
  documentsForm: FormGroup;
  documentTypes: any[];
  files: Blob[] = new Array<Blob>();
  uploadMultiple: boolean;
  maxDate: Date;
  errorMessageMap = errorMessageMap;
  currentUser: any;
  removedAttachments: any[] = [];
  loading: boolean;
  loadingData: boolean = true;
  minDate = new Date('01-01-1970');
  colorTheme = ColorTheme;
  maxAsOfDate = new Date();
  constructor(
    private readonly questionnaireService: QuestionnaireService,
    private readonly documentDataService: DocumentDataService,
    private datePipe: DatePipe,
    private readonly toaster: ToastrService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.currentUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
    this.initializeForm();
    this.getDocumentTypes();
    if (this.editMode && this.showUploadDocumentOnEdit) {
      this.files = JSON.parse(JSON.stringify(this.existingAttachments));
    }
    this.uploadMultiple = !this.isFile;
  }

  initializeForm() {
    this.documentsForm = new FormGroup({
      tags: new FormControl(
        [],
        this.currentUser.isManager ? Validators.required : null
      ),
      as_of_date: new FormControl(
        this.editMode ? new Date(this.existingAttachments[0].as_of_date) : null,
        Validators.required
      ),
    });
    this.toggleNameControl();
  }

  getDocumentTypes() {
    const documentTags = this.store.selectSnapshot(
      (state) => state.user.documentTags
    );
    this.documentTypes = [...documentTags];
    if (this.editMode) {
      this.questionnaireService
        .getDocumentTags(
          this.existingAttachments[0].attachment_id ??
            this.existingAttachments[0].id
        )
        .subscribe(
          (response: any[]) => {
            this.documentsForm
              .get('tags')
              .patchValue(
                this.documentTypes.filter((x) =>
                  response.some((y) => y.tag_id === x.id)
                )
              );
            this.loadingData = false;
          },
          (err) => {
            this.loadingData = false;
          }
        );
    } else {
      this.loadingData = false;
    }
  }

  onDateChange(date) {
    this.documentsForm.get('as_of_date').patchValue(date);
  }

  handleTagChange(selection: any[]) {
    this.documentsForm.get('tags').patchValue(selection);
  }

  toggleNameControl() {
    if (this.uploadMultiple) {
      // if multiple uploads then remove all validators
      this.documentsForm.get('name').setValidators([]);
    } else {
      this.documentsForm.addControl(
        'name',
        new FormControl(
          this.editMode || this.showUploadDocumentOnEdit
            ? this.existingAttachments[0].name
            : this.files?.length
            ? (this.files[0] as any).name
            : '',
          [Validators.required, Validators.pattern(Regex.validName)]
        )
      );
    }
  }

  handleFileUploaded(files) {
    if (!this.uploadMultiple) this.files = [];
    this.files.push(...files);
    this.setDocumentName();
  }

  deleteFile(index) {
    const deletedFile: any = this.files.splice(index, 1);
    if (deletedFile[0].name === this.documentsForm.value.name) {
      // removing file name if file name is same as deleted document file name
      this.documentsForm.get('name').setValue('');
      this.documentsForm.get('name').markAsUntouched();
    }
    this.setDocumentName();
  }

  async submit(modalCallback) {
    if (!this.documentsForm.valid) {
      this.documentsForm.markAllAsTouched();
      return;
    }
    if (!this.editMode && !this.files.length) {
      this.toaster.error('Please select a file');
      return;
    }
    if (!this.editMode && !this.uploadMultiple && this.files.length > 1) {
      this.toaster.error(
        'Please select only one file or enable multiple upload'
      );
      return;
    }
    this.loading = true;
    let resObservable: Observable<any>;
    if (this.editMode) {
      resObservable = this.updateAttachment();
    } else {
      if (this.canSave) resObservable = await this.saveAttachments();
      else {
        this.success(
          this.files.map((file: any) => ({
            id: `${Math.random()}`,
            file_name: this.uploadMultiple
              ? file.name
              : this.documentsForm.value.name,
            name: this.uploadMultiple
              ? file.name
              : this.documentsForm.value.name,
          })),
          this.removedAttachments
        );
        modalCallback();
        this.loading = false;
      }
    }
    resObservable?.pipe(finalize(() => (this.loading = false)))?.subscribe(
      (response) => {
        if (this.success) {
          // questionnaire page
          this.success([].concat(...response), this.removedAttachments);
          modalCallback();
        } else {
          // entity documents page
          this.onSuccess.emit(response.map((x) => x[0].id));
        }
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  updateAttachment() {
    const payload = this.getPayload();
    if (this.showUploadDocumentOnEdit) {
      this.files.forEach((file: any, index: number) => {
        payload.append(`file[${index}]`, file);
      });
    }
    payload.append('name', this.documentsForm.value.name);
    return this.questionnaireService.updateAttachment(
      this.existingAttachments[0].attachment_id ??
        this.existingAttachments[0].id,
      payload
    );
  }

  async saveAttachments() {
    const observables = [];
    let folders: any = [];
    if (!this.isFile) {
      let paths = this.files.map((file: any) => file.relativePath);
      folders = await this.documentDataService
        .createFolders({
          paths,
          base_attachment_hierarchy_id: this.parentAttachmentHierarchyId,
        })
        .toPromise();
    }
    this.files.forEach((file: any, index: number) => {
      const payload = this.getPayload();
      payload.append(`file[${index}]`, file);
      // assigning file name from form if uploadedMultiple and file length is only one
      payload.append(
        'name',
        this.uploadMultiple && this.files.length !== 1
          ? file.name
          : this.documentsForm.value.name
      );
      if (!this.isFile) {
        let folderPath = file.relativePath.split('/').slice(0, -1).join('/');
        let parentAttachmentHierarchyId =
          this.parentAttachmentHierarchyId ?? null;
        if (folderPath) {
          parentAttachmentHierarchyId =
            folders.find((folder) => folder.path == folderPath)?.id ?? null;
        }
        payload.append(
          'parent_attachment_hierarchy_id',
          parentAttachmentHierarchyId?.toString() ?? null
        );
      } else {
        payload.append(
          'parent_attachment_hierarchy_id',
          this.parentAttachmentHierarchyId?.toString() ?? null
        );
      }
      observables.push(
        this.documentDataService.saveAttachmentWithFolder(payload)
      );
    });
    return forkJoin(observables);
  }

  getPayload() {
    const tags = JSON.stringify(this.documentsForm.value.tags.map((x) => x.id));
    const date = this.datePipe.transform(
      this.documentsForm.value.as_of_date,
      'MM-dd-yyyy'
    );
    const payload = new FormData();
    payload.append('tags', tags);
    payload.append('as_of_date', date);
    return payload;
  }

  /**
   * Setting up file name if not present in form value
   */
  setDocumentName() {
    const existingFile: any = this.files[0];
    const fileNameControl = this.documentsForm.get('name');
    if (existingFile && !fileNameControl.value)
      fileNameControl.setValue(existingFile.name);
    fileNameControl.setValidators([DvValidators.required]);
  }
}
