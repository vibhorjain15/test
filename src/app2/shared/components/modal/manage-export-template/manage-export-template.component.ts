import { Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { ManagePrefTemplates } from 'src/app2/services/export-preference/export-preference.type';
import { ToastrService } from 'ngx-toastr';
import { ExportPrefService } from 'src/app2/services/export-preference/export-preference.service';
@Component({
  selector: 'manage-export-template',
  templateUrl: './manage-export-template.component.html',
  styleUrls: ['./manage-export-template.component.css'],
})
export class ManageExportTemplateModal implements OnInit {
  @Input() template: ManagePrefTemplates;
  @Input() template_list: ManagePrefTemplates[];
  supportedImageExtensions = ['docx'];
  manageExportForm: FormGroup;
  edit_mode: boolean = false;
  files: any[] = [];
  loading: boolean = false;
  templateFileName: string;
  templateBlobFileName: string;

  constructor(
    private readonly toaster: ToastrService,
    private readonly ExportPrefService: ExportPrefService
  ) {}

  validName(data: string[]) {
    return (control: AbstractControl): { [key: string]: any } | null =>
      !data.includes(control.value)
        ? null
        : { notUnique: 'Template with the same name already exists' };
  }

  ngOnInit() {
    const data = this.template_list.map((val) => val.name);
    if (this.template) {
      this.edit_mode = true;
      this.templateFileName = this.template.name;
      data.splice(data.indexOf(this.template.name), 1);
      this.manageExportForm = new FormGroup({
        name: new FormControl(this.template.name, [
          Validators.required,
          this.validName(data),
        ]),
        isEdit: new FormControl(true),
      });
    } else {
      this.manageExportForm = new FormGroup({
        name: new FormControl(null, [
          Validators.required,
          this.validName(data),
        ]),
      });
    }
   }

  dropped(files: any) {
    const extention = files[0].name.split('.');
    if (
      this.supportedImageExtensions.includes(extention[extention.length - 1])
    ) {
      this.files = files;
      this.templateBlobFileName = this.files[0].name
      this.manageExportForm.get('name').setValue(this.templateBlobFileName);
    } else {
      this.toaster.error(
        'Selected file is not supported, please upload a docx file.'
      );
    }
  }

  openFileSelector() {}

  downloadTemplate() {
    this.loading = true;
    this.ExportPrefService.downloadTemplate(
      this.template.id,
      (url) => {
        var a = document.createElement('a');
        document.body.appendChild(a);
        a.href = url;
        a.target = '_blank';
        a.click();
        a.remove();
        this.loading = false;
      },
      () => {
        this.loading = false;
      }
    );
  }

  save(callback) {
    validateAllFormFields(this.manageExportForm);
    if (this.manageExportForm.valid) {
      this.loading = true;
      let { name } = this.manageExportForm.value;
      let params = new FormData();
      params.append('name', name);
      if (this.files.length > 0) {
        this.files.forEach((file: File) => {
          params.append('file', file, this.templateBlobFileName);
        });
      }

      if (this.edit_mode) {
        this.ExportPrefService.uploadTemplate(
          this.template.id,
          params,
          () => {
            this.loading = false;
            callback();
          },
          () => {
            this.loading = false;
          }
        );
      } else if (this.files.length > 0) {
        this.ExportPrefService.createTemplate(
          params,
          () => {
            this.loading = false;
            callback();
          },
          () => {
            this.loading = false;
          }
        );
      } else {
         this.toaster.error(
          'Please select a file.'
        );
        this.loading = false;
      }
    }
  }
}
