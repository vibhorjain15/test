import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, NgZone } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Select } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
import { InboundService } from 'src/app2/modules/inbound-management/inbound.service';
import { ImageDataService } from 'src/app2/services/ImageData/ImageDataService.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';
//import { UserState } from 'src/app2/store/states/user.state';
import { errorMessageMap } from '../../constants/constant';
import { InterpolatePipe } from '../../pipes/interpolate.pipe';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';
import { keywordConstants } from 'src/app2/shared/constants/constant';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { DvDatePipe } from '../../pipes/dv-date.pipe';

@Component({
  selector: 'app-inbound-add-edit',
  templateUrl: './inbound-add-edit.component.html',
  styleUrls: ['./inbound-add-edit.component.css'],
})
export class InboundAddEditComponent implements OnInit {
  @Input() editMode? = false;
  @Input() previousOpportunity?;
  opportunityForm: FormGroup;
  templates = [];
  teamMembers = [];
  emailTemplates = [];
  showError = false;
  @Select(UserState.getTeamMembersData) teamMembers$;
  @Select(UserState.getCurrentUserData) user;
  loading: any = false;
  btnloading: boolean;
  showSpinner = false;
  @Input() newData;
  today = new Date();
  visibilities = [];
  tinymceMentionsPlaceholderText = 'Add a description';
  uploading_image: boolean;
  resultBlob: any;
  tinyMceInit;
  init: any = {};
  entityList = [
    { name: 'Firm', value: keywordConstants.Firm },
    { name: 'Strategy', value: keywordConstants.Strategy },
    { name: 'Product', value: keywordConstants.Product },
  ];
  description: any;
  visibilityMap = {
    public: 1,
    private: 2,
  };
  constructor(
    private readonly inboundService: InboundService,
    private readonly toaster: ToastrService,
    private readonly customModalService: CustomModalService,
    private readonly http: HttpClient,
    private readonly TemplatesDataService: TemplatesDataService,
    private readonly interpolatePipe: InterpolatePipe,
    private readonly dvDatePipe: DvDatePipe,
    private readonly utilService: UtilsService,
    private readonly ImageService: ImageDataService,
    private readonly ngZone: NgZone,
    private readonly SweetAlert: SweetAlertService
  ) {}

  ngOnInit(): void {
    this.getTeamMembers();

    this.initTinyMc();

    this.loading = true;

    this.tinyMceInit = {
      menubar: false,
      // height: 500,
      branding: false,
      elementpath: false,
      // statusbar: false,
      plugins: 'link image table lists hr textcolor placeholder fullscreen',
      toolbar: `bold italic underline | alignleft aligncenter alignright alignjustify | superscript | forecolor backcolor | link dv_img_selector | table | bullist numlist | hr | undo redo | fullscreen`,
      placeholder: '',
    };
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
      placeholder: this.tinymceMentionsPlaceholderText,
    };
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

  getTeamMembers() {
    this.teamMembers$.pipe(take(2)).subscribe((teamMembers) => {
      if (teamMembers)
        this.teamMembers = teamMembers.map((teamMember) => ({
          ...teamMember,
          fullname: `${teamMember.firstName} ${teamMember.lastName}`,
        }));
      this.apis();
    });
  }

  apis() {
    combineLatest([
      this.teamMembers$,
      this.TemplatesDataService.getTemplates({ detail: false }),
      this.http.get(`EmailTemplateMessages`),
      this.http.get(`Inbound_configuration_visibility_types`),
      this.http.get('firm_preferences'),
    ]).subscribe((res: any) => {
      this.visibilities = res[3];
      this.teamMembers = res[0]?.map((teamMember) => {
        const teamMemberCopy = { ...teamMember };
        teamMemberCopy.fullName = `${teamMember.firstName} ${teamMember.lastName}`;
        return teamMemberCopy;
      });
      this.templates = res[1];
      this.emailTemplates = res[2];
      const itemTemp =
        this.templates.filter(
          (x) => x.id == this.previousOpportunity?.inbound.template_id
        ).length > 0
          ? this.previousOpportunity.inbound.template_id
          : null;

      const abc = this.teamMembers?.map((x) => x.id);
      const result = this.previousOpportunity?.contacts.filter((y) =>
        abc.includes(y.id)
      );
      this.opportunityForm = new FormGroup({
        nameControl: new FormControl(
          this.editMode ? this.previousOpportunity.name : '',
          [DvValidators.required]
        ),
        templateControl: new FormControl(this.editMode ? itemTemp : null, [
          Validators.required,
        ]),

        contactsControl: new FormControl(
          this.editMode
            ? result
              ? result.map((contact) => contact.id)
              : 0
            : [this.utilService.getCurrentUser()?.id],
          [Validators.required]
        ),
        emailTemplateControl: new FormControl(
          this.editMode
            ? this.previousOpportunity.inbound.email_template
            : res[4].default_email_template_message_id,
          [Validators.required]
        ),
        dueDateControl: new FormControl(
          this.editMode && this.previousOpportunity.due_date
            ? new Date(this.previousOpportunity.due_date)
            : null
        ),
        descriptionControl: new FormControl(
          this.editMode && this.previousOpportunity.inbound.description
            ? this.handleEditorTextChange(
                this.previousOpportunity.inbound.description
              )
            : ''
        ),
        visibilityControl: new FormControl(
          this.editMode ? this.previousOpportunity.inbound.visibility_type : 1,
          [Validators.required]
        ),
        entityTypeControl: new FormControl(
          this.editMode ? this.previousOpportunity.inbound.entity_type : null
        ),
      });
      this.loading = false;
    });
  }

  handleEditorTextChange(data) {
    this.description = data;
  }
  saving_opportunity = false;
  submit(proceed) {
    this.opportunityForm.markAllAsTouched();
    if (this.opportunityForm.invalid) {
      this.showError = true;
      return;
    }

    this.btnloading = true;
    // this.saving_opportunity = true;
    this.showSpinner = true;
    this.showError = false;
    const config: any = {
      type: this.editMode ? 'edit' : 'insert',
      name: this.opportunityForm.value.nameControl,
      template_id: this.opportunityForm.value.templateControl,
      email_template_id: this.opportunityForm.value.emailTemplateControl,
      entity_type: this.opportunityForm.value.entityTypeControl,
      contacts: this.opportunityForm.value.contactsControl,
      due_date: this.opportunityForm.value.dueDateControl
        ? this.utilService.formatDatetime(
            this.opportunityForm.value.dueDateControl
          )
        : '',
      description: this.description,
      visibility_type: this.opportunityForm.value.visibilityControl,
    };
    if (this.editMode) {
      config.config_id = this.previousOpportunity.id;
    }
    this.inboundService.addInboundConfig(config).subscribe(
      (res: any) => {
        if (this.editMode) {
          this.toaster.success('Successfully Updated the link with new edits');
          proceed();
        } else {
          this.toaster.success(
            'You can copy the links from the manage opportunities',
            'Successfully created a new opportunity'
          );
        }
        if (proceed && !this.editMode) {
          this.openModal(res.data[0].redirect_url);
        } else {
          if (this.editMode) {
            this.newData({
              name: res.data[0].name,
              contacts: res.data[0].contacts,
              template_name: res.data[0].template_name,
              email_template: res.data[0].email_template_name,
              due_date: res.data[0].due_date
                ? this.dvDatePipe.transform(res.data[0].due_date, [
                    'isLocaleDate',
                  ])
                : '',
              inbound: res.data[0],
            });
            this.btnloading = false;
          }
        }
        this.opportunityForm.reset();
        this.handleEditorTextChange('');
        this.showSpinner = false;
      },
      (error) => {
        this.btnloading = false;
        if (this.editMode) {
          this.toaster.error('Failed to update opportunity');
        } else {
          this.toaster.error('Failed to create opportunity');
        }
        this.showSpinner = false;
      }
    );
  }

  addNewTemplate() {
    this.customModalService.invoke('new-template');
  }

  addEmailTemplate() {
    this.customModalService.invoke('manage-email-template', {
      initialState: {
        onSuccess: (response, isDefault) => {
          this.emailTemplates.push(response);
          if (isDefault) {
            this.opportunityForm
              .get('emailTemplateControl')
              .setValue(response.id);
          }
        },
      },
      class: 'modal-lg',
    });
  }

  openModal(link) {
    this.customModalService.invoke('inbound-create-confirm', {
      initialState: { link },
      class: 'modal-dialog-centered',
    });
  }

  getErrorMessage(controlName: string, fieldName?: string): string {
    const control = this.opportunityForm.get(controlName);
    const hasError =
      control &&
      (control?.touched || this.showError) &&
      control?.invalid &&
      control?.errors;
    if (hasError && control.errors.required) {
      return this.interpolatePipe.transform(
        errorMessageMap?.required,
        fieldName
      );
    }
    return '';
  }

  setDateValue(date) {
    this.opportunityForm.get('dueDateControl').setValue(date);
  }

  onFirstClick(event) {
    const visibilityControl = this.opportunityForm.get('visibilityControl');
    // checking if user touched control and set to public
    if (
      visibilityControl.touched &&
      visibilityControl.value === this.visibilityMap.public &&
      visibilityControl.value !==
        this.previousOpportunity.inbound.visibility_type
    ) {
      return this.publicSettingAlert(event);
    }
    this.submit(event);
  }

  publicSettingAlert($event = null) {
    this.opportunityForm.markAllAsTouched();
    if (this.opportunityForm.invalid) {
      this.showError = true;
      return;
    }
    if (
      this.opportunityForm.get('visibilityControl').value ===
      this.visibilityMap.private
    ) {
      return this.submit($event ?? true);
    }
    this.SweetAlert.confirm({
      text: `You have made this a public opportunity. All responders using DiligenceVault will be able to view and submit, and will receive information about the opportunity in weekly Monday emails.`,
      confirmButtonText: 'Okay',
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          swal.close();
          this.submit($event ?? true);
        });
      },
    });
  }
}
