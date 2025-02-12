import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { FileHandlerService } from 'src/app2/services/file-handler.service';
import { ModalService } from 'src/app2/services/modal.service';
import { RouterService } from 'src/app2/services/router.service';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';
import {
  keywordConstants,
  EntityType,
} from 'src/app2/shared/constants/constant';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-upload-qa-file',
  templateUrl: './upload-qa-file.component.html',
})
export class UploadQaFileComponent implements OnInit {
  files: any = [];
  params: any = {};
  edit_mode = false;
  maxFileSize = this.fileHandlerFactory.getMaxFileSize();
  firm_name: any;
  current_firm: any;
  allowed_file_extensions_str: any;
  entity_types: Array<any> = [];
  funds: any;
  vehicles: any;
  loading: boolean = true;
  global_hierarchy_option = null;
  strategies: any;
  firms: any;
  entityTypeValue = EntityType;
  uploadQAForm!: FormGroup;
  saving_template: boolean;

  @Select(UserState.getCurrentUserData) user$;

  isFreeSubscription: any;
  keywordConstants = keywordConstants;
  entityType = new FormControl('');
  constructor(
    private http: HttpClient,
    private utils: UtilsService,
    private TemplatesDataService: TemplatesDataService,
    private routerService: RouterService,
    private modalService: CustomModalService,
    private fileHandlerFactory: FileHandlerService,
    private formBuilder: FormBuilder,
    private toaster: ToastrService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initialize();
  }

  initForm() {
    this.uploadQAForm = this.formBuilder.group({
      entity_type: ['', Validators.required],
      entity_id: [''],
    });
  }

  initialize() {
    this.firm_name = this.utils.getCurrentUser().firmInfo.name;
    this.current_firm = this.utils.getCurrentFirm();
    const allowed_file_extensions = ['docx', 'DOCX'];

    this.allowed_file_extensions_str = allowed_file_extensions
      .map((ext: string) => '.' + ext)
      .join(',');

    this.entity_types = [
      { alias: 'My Firm', name: this.keywordConstants.MyFirm },
      { alias: 'Product', name: this.keywordConstants.Product },
      { alias: 'Strategy', name: this.keywordConstants.Strategy },
      { alias: 'Vehicle', name: this.keywordConstants.Vehicle },
    ];
    this.params.entity_type = this.entity_types[0];
    this.uploadQAForm.patchValue({
      entity_type: this.params.entity_type.name,
    });
    const promises = [];
    promises.push(this.getFirms());
    promises.push(this.getStrategies());
    promises.push(this.http.get('funds'));
    promises.push(this.http.get('vehicles'));

    forkJoin(promises).subscribe(
      ([firms, strategies, funds, vehicles]) => {
        this.firms = (firms as any).data;
        this.strategies = (strategies as any).data;
        this.funds = funds;
        this.vehicles = vehicles;
        this.loading = false;
      },
      (e) => {
        this.loading = false;
      }
    );
  }

  getStrategies() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
      search_for: this.global_hierarchy_option,
    };
    return this.http.post(`service/dvapi_service/product_search`, params);
  }

  getFirms() {
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
    };
    return this.http.post('service/dvapi_service/firm_search', params);
  }

  getEntityTypeNumber(type: any) {
    let value = this.entityTypeValue.Firm;
    if (type === this.keywordConstants.Firm) {
      value = this.entityTypeValue.Firm;
    } else if (type === this.keywordConstants.Product) {
      value = this.entityTypeValue.Product;
    } else if (type === this.keywordConstants.Vehicle) {
      value = this.entityTypeValue.Vehicle;
    } else if (type === this.keywordConstants.Strategy) {
      value = this.entityTypeValue.Strategy;
    }
    return value;
  }

  submit() {
    if (this.files.length === 0) {
      this.toaster.error('Please select a file');
      return;
    }
    if (
      !this.uploadQAForm.get('entity_id').value &&
      this.params.entity_type.name !== this.keywordConstants.MyFirm
    ) {
      this.toaster.error(`Please select a ${this.params.entity_type.alias}`);
      return;
    }
    if (this.uploadQAForm.valid) {
      this.saving_template = true;
      this.params.selected_entity_type = this.getEntityTypeNumber(
        this.params.entity_type.name
      );
      this.params.selected_entity_id =
        this.params.entity_type.name === this.keywordConstants.MyFirm
          ? this.current_firm.id
          : this.params.entity_id;
      this.uploadWordFile(this.files, this.params);
    }
  }

  uploadWordFile(files: any, templateParams: any) {
    const payload = new FormData();
    let fl = this.files[0];
    payload.append('file', fl);

    const ogFile = files;
    this.http.post(`/excel_parser/upload?parserType=Word&entity_type=${templateParams.entity_type.name}&entity_id=${templateParams.selected_entity_id}&investor_id=${null}`, payload).subscribe(
      (result: any) => {
        this.TemplatesDataService.setWordParserData(result);
        this.TemplatesDataService.setOriginalWordFile([files]);
        if (templateParams) {
          this.TemplatesDataService.setTemplateParams(templateParams);
        } else {
          this.TemplatesDataService.setTemplateParams({ name: ogFile[0].name });
        }

        result.file = ogFile;
        this.routerService.navigateWithParams(
          `app.diligence.word_to_template`,
          {
            doc_id: result.doc_id,
            type: 'QA',
          }
        );
        this.close(result);
      },
      (error: any) => {
        this.saving_template = false;
        this.loading = false;
      }
    );
  }

  close(result: any) {
    this.modalService.closeAllActiveModals();
  }

  documentUploadComplete(response: Array<File>) {
    if (response.length > 0) {
      this.files = response;
      this.params.name = response[0].name + moment().format();
    }
  }

  handleConditionChange(entity: string) {
    this.params.entity_type = this.entity_types.find((e) => e.name === entity);
    if (entity == keywordConstants.MyFirm) {
      this.uploadQAForm.get('entity_id').setErrors(null);
      this.uploadQAForm.get('entity_id').setValidators(null);
      this.uploadQAForm.updateValueAndValidity();
    } else {
      this.uploadQAForm.get('entity_id').setValue(null);
      this.uploadQAForm.get('entity_id').setErrors([Validators.required]);
    }
  }
}
