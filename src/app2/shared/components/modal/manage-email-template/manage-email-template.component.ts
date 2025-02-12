import { Component, Input, NgZone, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { validateAllFormFields } from 'src/app2/modules/firm-settings/tags-modal/tags-modal.util';
import { ManageEmailService } from 'src/app2/services/manage-email-template/manage-email-template.service';
import {
  IEmailTemplate,
  IEmailTemplateRequest,
  IFirmPref,
} from 'src/app2/services/manage-email-template/manage-email-template.types';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import {
  DvValidators,
  noHtmlValidator,
  noWhitespaceValidator,
} from 'src/app2/shared/validators/no-white-space.validator';

@Component({
  selector: 'manage-email-template',
  templateUrl: './manage-email-template.component.html',
})
export class ManageEmailTemplateModal implements OnInit {
  @Input() template: IEmailTemplate;
  @Input() isDefault: boolean;
  @Input() onSuccess: any;
  emailTemplateForm: FormGroup;
  loading: boolean = false;
  isEdit: boolean = false;
  firmPref: IFirmPref;
  tinyMceInit: any;
  tinymceOptions;
  resultBlob;
  uploading_image;
  tinymceEditor;
  constructor(
    private readonly ManageEmailService: ManageEmailService,
    private readonly customModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly ngZone: NgZone
  ) {}

  ngOnInit() {
    this.initTinyMCE();
    this.initEmailTemplateForm();
    this.ManageEmailService.getFirmPreference((firmPref) => {
      this.firmPref = { ...firmPref };
    });
  }

  initTinyMCE() {
    this.tinyMceInit = {
      placeholder: 'Please enter some text',
    };
  }

  initEmailTemplateForm() {
    if (this.template) this.isEdit = true;
    this.emailTemplateForm = new FormGroup({
      name: new FormControl(this.template?.name || null, [
        Validators.required,
        noWhitespaceValidator,
        noHtmlValidator,
      ]),
      content: new FormControl(this.template?.content || null, [
        Validators.required,
      ]),
      isDefaultTemplate: new FormControl(this.isDefault || false, []),
    });
  }

  handleEditChange(text) {
    this.emailTemplateForm.patchValue({
      content: text,
    });
    this.emailTemplateForm.get('content').markAsTouched({ onlySelf: true });
  }

  updatefirmPref(id: number) {
    this.firmPref.default_email_template_message_id = id;
    this.firmPref.customize_intro = true;
    this.ManageEmailService.updateFirmPref(
      this.firmPref,
      () => {
        this.loading = false;
      },
      () => {
        this.loading = false;
      }
    );
  }

  handleChange(data) {
    this.emailTemplateForm.patchValue({
      content: data,
    });
  }

  save(callback) {
    validateAllFormFields(this.emailTemplateForm);
    if (this.emailTemplateForm.valid) {
      this.loading = true;
      let { name, content, id, isDefaultTemplate } =
        this.emailTemplateForm.value;
      if (this.isEdit) {
        let params: IEmailTemplate = { ...this.template, name, content };
        this.ManageEmailService.updateEmailTemplate(
          params,
          () => {
            this.toaster.success('Template successfully updated');
            this.handleSuccess(params, true);
            if (isDefaultTemplate) {
              this.updatefirmPref(params.id);
              this.onSuccess(params, true);
            }
            else {
              this.loading = false,this.onSuccess(params,false);
            };
            callback();
          },
          () => {
            this.loading = false;
          },
          isDefaultTemplate
        );
        return;
      }

      let params: IEmailTemplateRequest = {
        name,
        content,
        id,
      };
      this.ManageEmailService.createEmailTemplate(
        params,
        (id) => {
          this.toaster.success('Template successfully created');
          if (isDefaultTemplate) {
            this.updatefirmPref(id);
            params.id = id;
            this.handleSuccess(params, true);
          } else {
            params.id = id;
            this.loading = false;
            this.handleSuccess(params, false);
          }
          callback();
        },
        () => {
          this.loading = false;
        },
        isDefaultTemplate
      );
    }
  }

  handleSuccess(params, isDefault) {
    if (this.onSuccess) {
      this.onSuccess(params, isDefault);
    }
  }
}
