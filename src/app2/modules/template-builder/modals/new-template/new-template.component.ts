import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { ToastrService } from 'ngx-toastr';
import {
  ValidationErrors,
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterService } from 'src/app2/services/router.service';
import * as moment from 'moment';
import { catchError, finalize, take } from 'rxjs/operators';
import { FileHandlerService } from 'src/app2/services/file-handler.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { TeamSelectionComponent } from 'src/app2/shared/modals/team-selection/team-selection.component';
import { TemplateDataService } from 'src/app2/services/templateData/template.service';
import { frequency } from '../../constants/frequency';
import {
  noHtmlValidator,
  noWhitespaceValidator,
} from 'src/app2/shared/validators/no-white-space.validator';
import { Select } from '@ngxs/store';
import { TemplateService } from 'src/app2/apis/template/template.service';
import {
  ERROR_CODES,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { UserState } from 'src/app2/store/user/user.state';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
@Component({
  selector: 'app-new-template',
  templateUrl: './new-template.component.html',
  styleUrls: ['./new-template.component.css'],
})
export class NewTemplateComponent implements OnInit {
  @Input() pendingrequest: any;
  @Input() source: any;
  @Input() templateOptions: any;
  @Input() template: any;
  isManager: any;
  isParserUpload: boolean;
  parserType: string;
  is_vendor: any;
  files: any;
  edit_mode: boolean;
  maxFileSize: any;
  FileHandlerFactory: any;
  current_firm: any;
  fromManagerRequest: boolean;
  @Input() isAngularJs = false;

  allowed_file_extensions_str: any;
  $scope: any;
  manage_template: any;
  templateId: any;
  optionType: any;
  requestSteps: any = {
    DOC_PARSER: 'document_parser',
    EXCEL_PARCER: 'excel_parser',
    TEMPLATE_BUILDER: 'template_editor',
    COMPLETE_REQUEST: 'complete_request',
  };
  entity_sub_type: any;
  frequencies: any = Object.values(frequency);
  strategies: any;
  currentEvent: any;
  manage_template_form: any;
  saving_template: boolean;
  $state: any;
  permissionError: boolean;
  ERROR_CODES = ERROR_CODES;
  keywordConstants = keywordConstants;
  baseUrl: string;
  Upload: any;
  documentParams: { template_id: any };
  loading: boolean;
  modalTitle: string;
  templateForm: FormGroup;
  permissions_enabled: any;
  userData: any;
  teams: any[];
  @ViewChild('permissions') teamSelectionComponent: TeamSelectionComponent;
  showTeamsToAdd: boolean = false;
  parserService: any;
  @Select(UserState.getCurrentUserData) user$;
  @Select(UserState.getSubscriptionLimitsData) subscriptionLimits$;
  templateNameList: any = [];

  constructor(
    // private templatesDataService: TemplateDataService,
    private Utils: UtilsService,
    private SweetAlert: SweetAlertService,
    private customModalService: CustomModalService,
    private readonly toaster: ToastrService,
    private routerService: RouterService,
    private fileHandlerFactory: FileHandlerService,
    private templateService: TemplateService,
    private newTemplateDataService: TemplatesDataService,
    private readonly oldTemplateDataService: TemplateDataService,
  ) {}

  ngOnInit() {
    this.loading = true;
    this.modalTitle = this.getModalTitle();
    this.initUForm();
    this.user$
      .pipe(
        take(1),
      )
      .subscribe((data) => {
        if (data) {
          this.userData = data;
          this.isManager = data.isManager;
          this.is_vendor = data.isVendorSubscription;
          this.current_firm = data.firmInfo;
          if (!this.Utils.isParserAngular()) {
            this.parserService = this.oldTemplateDataService;
          } else this.parserService = this.newTemplateDataService;
          this.permissions_enabled = data.firmInfo.hasPermissionEnabled;
          this.getEntities();
          this.initialize();
          this.initUForm();
          this.addUniqueNameValidator();
        }
      });
  }

  initialize() {
    this.subscriptionLimits$.pipe(take(2)).subscribe((limits) => {
      if (limits?.length) {
        this.entity_sub_type = this.Utils.getEntitySubType(limits[0]);
      }
    });
    this.frequencies = this.Utils.sortByAplha(this.frequencies, 'value');
    this.isParserUpload = false;
    this.parserType = '';
    this.files = [];
    this.edit_mode = false;

    this.maxFileSize = this.fileHandlerFactory.getMaxFileSize();

    this.fromManagerRequest = false;
    if (
      this.source &&
      this.source === 'InformationRequestFlow' &&
      this.isManager &&
      this.pendingrequest.type === 'investor_request'
    ) {
      this.fromManagerRequest = true;
    }
    if (this.template) {
      this.manage_template = {
        name: this.template.templateInfo.name,
        frequency_id: this.template.frequency_id,
        is_draft: this.template.templateInfo.is_draft,
      };
      this.templateId = this.template.templateInfo.id;
      this.edit_mode = true;
    } else {
      this.manage_template = { type: 'dd_new' };
    }

    if (this.templateOptions) {
      this.manage_template.type = this.templateOptions.templateType;
      this.manage_template.type_disabled = true;
      this.manage_template.name = this.templateOptions.templateName;
    }

    if (this.templateOptions && this.templateOptions.optionType) {
      this.optionType = this.templateOptions.optionType;
    } else {
      this.optionType = this.requestSteps['TEMPLATE_BUILDER'];
    }
    this.initUForm();

    this.loading = false;
  }

  initUForm() {
    this.templateForm = new FormGroup({
      manage_template_type: new FormControl(
        this.manage_template && this.manage_template.type
          ? this.manage_template.type
          : null,
        Validators.required
      ),
      manage_template_frequency_id: new FormControl(
        this.manage_template && this.manage_template.frequency_id
          ? this.manage_template.frequency_id
          : null
      ),
      manage_template_strategyID: new FormControl(
        this.manage_template && this.manage_template.strategyID
          ? this.manage_template.strategyID
          : null
      ),
      manage_template_name: new FormControl(
        this.manage_template && this.manage_template.name
          ? this.manage_template.name
          : '',
        [Validators.required, noWhitespaceValidator, noHtmlValidator]
      ),
    });
    if (this.source === 'InformationRequestFlow') {
      this.templateForm
        .get('manage_template_name')
        .setValidators([
          Validators.required,
          noWhitespaceValidator,
          this.validateChar,
          this.validateTemplateName,
          noHtmlValidator,
        ]);
    } else {
      this.templateForm
        .get('manage_template_name')
        .setValidators([
          Validators.required,
          noWhitespaceValidator,
          noHtmlValidator,
        ]);
    }
  }

  getEntities() {
    this.templateService
      .getFirmTeams(this.current_firm.id)
      .subscribe((response: any) => {
        this.teams = response;
      });

    if (this.is_vendor) {
      this.templateService
        .getVendors()
        .subscribe((vendorStrategies) => (this.strategies = vendorStrategies));
    } else {
      this.templateService
        .getStrategies()
        .subscribe((vendorStrategies) => (this.strategies = vendorStrategies));
    }
  }

  validateChar(control: AbstractControl) {
    if (
      (control.value && !/^[^+@=\\-]|^$/.test(control.value)) ||
      !control.value.trim()
    ) {
      return { invalidChar: true };
    }
    return null;
  }

  getModalTitle(): string {
    if (this.fromManagerRequest) return 'Create New Project';
    else return this.edit_mode ? 'Edit Template Info' : 'Create New Template';
  }

  validateTemplateName(control): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }

  uniqueNameValidator = (control): ValidationErrors | null => {
    const nameExists =
      this.templateNameList &&
      this.templateNameList.some((item) => {
        return (
          item.name?.toLowerCase()?.trim() ===
          (control.value?.toLowerCase() || '').trim()
        );
      });
    return nameExists ? { nameExists: true } : null;
  };

  addUniqueNameValidator() {
    this.newTemplateDataService.getTemplates({}).subscribe((res: any) => {
      res = res.map((template) => ({
        id: template.templateInfo.id,
        name: template.templateInfo.name,
      }));
      this.templateNameList = res;
      this.templateForm
        .get('manage_template_name')
        .addValidators(this.uniqueNameValidator);
      this.templateForm.get('manage_template_name').updateValueAndValidity();
    });
  }

  saveClickedElement(event: any) {
    return (this.currentEvent = event);
  }

  getFileExtension(file_name: {
    substring: (arg0: any, arg1: any) => any;
    lastIndexOf: (arg0: string) => number;
    length: any;
  }) {
    let fileExt =
      file_name.substring(file_name.lastIndexOf('.') + 1, file_name.length) ||
      file_name;
    fileExt = fileExt.toLowerCase();
    return fileExt;
  }

  handleError(error) {
    this.permissionError = error === 'Not valid';
  }

  submit(close) {
    this.saving_template = true;
    if (
      (this.optionType === this.requestSteps.DOC_PARSER ||
        this.optionType === this.requestSteps.EXCEL_PARCER) &&
      this.files.length === 0
    ) {
      this.toaster.error('Please select a file');
      this.loading = false;
      this.saving_template = false;
      return;
    }

    if (this.templateForm.valid) {
      this.manage_template.name = this.templateForm.get(
        'manage_template_name'
      ).value;
      this.manage_template.frequency_id = this.templateForm.get(
        'manage_template_frequency_id'
      ).value;
      this.manage_template.strategyID = this.templateForm.get(
        'manage_template_strategyID'
      ).value;
      this.manage_template.type = this.templateForm.get(
        'manage_template_type'
      ).value;
      this.manage_template.source = this.source;

      const selectedPermissions =
        this.teamSelectionComponent?.getSelectedPermissions();
      if (this.teamSelectionComponent && this.permissionError) {
        this.loading = false;
        this.saving_template = false;
        return;
      }
      if (selectedPermissions)
        this.manage_template.permissions = selectedPermissions;
      let fileExt: string;
      if (this.files && this.files.length) {
        this.isParserUpload = true;
        this.optionType = this.requestSteps.DOC_PARSER;
        fileExt = this.getFileExtension(this.files[0].name);
        if (fileExt === 'xlsx') {
          this.optionType = this.requestSteps.EXCEL_PARCER;
        }
      }

      if (this.optionType === this.requestSteps.DOC_PARSER) {
        if (fileExt !== 'pdf') {
          this.saving_template = true;
          this.parserType = 'Word';
          this.uploadParserFile(
            this.files,
            this.parserType,
            this.manage_template
          );
        } else {
          this.saving_template = true;
          this.parserType = 'Pdf';
          this.uploadParserFile(
            this.files,
            this.parserType,
            this.manage_template
          );
        }
        return;
      }
      if (this.optionType === this.requestSteps.EXCEL_PARCER) {
        this.saving_template = true;
        this.manage_template.source = this.source;
        this.parserType = 'Excel';
        this.uploadParserFile(
          this.files,
          this.parserType,
          this.manage_template
        );
        return;
      }

      this.saving_template = true;
      if (this.edit_mode) {
        return this.parserService
          .updateTemplate(this.templateId, this.manage_template)
          .pipe(
            finalize(() => {
              this.loading = false;
              return (this.saving_template = false);
            })
          )
          .subscribe((response: any) => {
            const message = 'Template info updated';
            this.toaster.success(message);
            close();
            return;
          });
      } else {
        return this.parserService
          .createNewTemplate(this.manage_template)
          .pipe(
            finalize(() => {
              this.loading = false;
              this.saving_template = false;
            }),
            catchError((error) => {
              this.saving_template = false;
              if (error.status === this.ERROR_CODES.CONFLICT) {
                this.loading = false;
                return this.SweetAlert.error({
                  title: error.data,
                  confirmButtonText: 'Okay',
                }).then((confirm: { value: boolean }) => {
                  if (confirm.value && confirm.value === true) {
                    return this.routerService.navigateWithParams(
                      'app.diligence.template.preview',
                      { templateId: this.templateId }
                    );
                  }
                });
              } else if (error.data) {
                this.loading = false;
                return this.toaster.error(error.data);
              }
            })
          )
          .subscribe(
            (response: any) => {
              if (this.source === 'InformationRequestFlow') {
                this.saveAndRedirectToTemplate(response, this.optionType);
              } else {
                close();
                return this.routerService.navigateWithParams(
                  'app.diligence.template.categories',
                  {
                    templateId: response.id,
                    add: true,
                  }
                );
              }
            },
            (e) => {
              this.loading = false;
            }
          );
      }
    }
    this.loading = false;
  }
  changeTemplateType(type: string) {
    if (
      this.manage_template &&
      this.manage_template.type &&
      type != this.manage_template.type
    ) {
      this.manage_template.type =
        this.manage_template.type == 'dd_new' ? 'dd_profile' : 'dd_new';
      return this.templateForm.patchValue({
        manage_template_type: this.manage_template.type,
      });
    }
  }

  async saveAndRedirectToTemplate(
    response: { template_id: any; id: any; doc_id: any },
    optionType: any
  ) {
    if (optionType === this.requestSteps.DOC_PARSER) {
      this.pendingrequest.template_id = response.template_id;
      this.pendingrequest.document_id = response.id;
    } else if (optionType === this.requestSteps.EXCEL_PARCER) {
      this.pendingrequest.template_id = response.template_id;
      this.pendingrequest.document_id = response.doc_id;
    } else {
      this.pendingrequest.template_id = response.id;
    }
    this.pendingrequest.latest_step = optionType;

    if (this.pendingrequest.is_firm_dd) {
      this.pendingrequest.entity_type = this.keywordConstants.Firm;
      this.pendingrequest.entity_id = this.current_firm.id;
    } else {
      this.pendingrequest.entity_type = this.keywordConstants.Product;
    }

    this.customModalService.close(); //this.uibModalInstance.close(response);
    if (optionType === this.requestSteps['TEMPLATE_BUILDER']) {
      return this.routerService.navigateWithParams(
        'app.diligence.template.categories',
        {
          templateId: response.id,
          add: true,
        }
      );
    } else {
      if (this.isParserUpload) {
        if (this.parserType === 'Excel') {
          return setTimeout(() => {
            return this.routerService.navigateWithParams(
              'app.diligence.excel_to_template',
              { doc_id: response.doc_id }
            );
          });
        } else {
          return setTimeout(() => {
            return this.routerService.navigateWithParams(
              'app.diligence.word_to_template',
              { doc_id: response.doc_id }
            );
          });
        }
      } else {
        return this.routerService.navigateWithParams(
          'app.diligence.document_upload.view_progress',
          {
            documentUploadId: response.id,
          }
        );
      }
    }
  }

  redirectToDocuments() {
    this.customModalService.close();
    return this.routerService.navigate('app.diligence.document_uploads');
  }

  uploadFiles(uploadedFiles: any, apiUrl: string) {
    let output;
    const params = {
      url: apiUrl,
      method: 'POST',
      file: uploadedFiles,
    };
    const payload = new FormData();
    let result;
    let fl = this.files[0];
    payload.append('file', fl);
    this.templateService.uploadTemplateFile(params.url, payload).subscribe(
      (response: any) => {
        this.toaster.success('Request successful, Please check your email');
        result = response;
      },
      (error) => {
        result = error;
      }
    );

    return result;
  }

  uploadParserFile(
    file: any,
    type: string,
    templateParams: { source: string }
  ) {
    const url = `excel_parser/upload?parserType=${type}&entity_type=${null}&entity_id=${null}&investor_id=${null}`;
    const payload = new FormData();
    let fl = this.files[0];
    payload.append('file', fl);
    this.templateService.uploadTemplateFile(url, payload).subscribe(
      (result: any) => {
        if (this.source && this.source === 'InformationRequestFlow') {
          templateParams.source = 'InformationRequestFlow';
        } else {
          this.parserService.setDiligenceParams({});
        }
        if (type === 'Excel') {
          this.parserService.setExcelParserData(result);
          this.parserService.setOriginalExcelFile([fl]);
        } else {
          this.parserService.setWordParserData(result);
          this.parserService.setOriginalWordFile([fl]);
        }
        this.parserService.setTemplateParams(templateParams);
        if (type === 'Excel') {
          this.routerService.navigateWithParams(
            'app.diligence.excel_to_template',
            { doc_id: result.doc_id, type: 'EP' }
          );
        } else {
          this.routerService.navigateWithParams(
            'app.diligence.word_to_template',
            { doc_id: result.doc_id, type: 'WP' }
          );
        }
        this.customModalService.close();
        this.saving_template = false;
      },
      (error) => {
        this.loading = false;
        return (this.saving_template = false);
      }
    );
  }

  documentUploadComplete(response: any) {
    if (response.length > 0) {
      this.files = response;
      if (this.source === 'InformationRequestFlow') {
        this.saveAndRedirectToTemplate(response[0], this.optionType);
      } else {
        this.routerService.navigateWithParams(
          'app.diligence.document_upload.view_progress',
          {
            documentUploadId: response[0].id,
          }
        );
      }
      const templateName = response[0].name + "_" + this.Utils.formatDatetimeForSuggestedName(moment());
      this.manage_template.name = templateName;
      this.templateForm.patchValue({
        manage_template_name: templateName,
      });
    }
  }

  changeOptionType(option: any) {
    return (this.optionType = option);
  }

  onFileUpload(response: any) {
    this.files = response;
    this.templateForm.patchValue({
      manage_template_name: this.files[0].name + "_" + this.Utils.formatDatetimeForSuggestedName(moment()),
    });
    this.templateForm.get('manage_template_name').updateValueAndValidity();
  }
}
