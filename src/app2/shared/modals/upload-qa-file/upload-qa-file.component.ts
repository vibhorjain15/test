import { Component, OnInit } from '@angular/core';
import {
  baseUrl,
  entity_types_manager,
  keywordConstants,
} from '../../constants/constant';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-upload-qa-file',
  templateUrl: './upload-qa-file.component.html',
  styleUrls: ['./upload-qa-file.component.css'],
})
export class UploadQaFileComponent implements OnInit {
  uploading: boolean;
  loading: boolean;
  entity_types = entity_types_manager;
  selectedEntityObj = entity_types_manager[0];
  firms;
  strategies;
  funds;
  vehicles;
  EntityConstants = keywordConstants;
  currUser;
  entity_id;
  files: any[];
  selected_entity_type;
  selected_entity_id;
  baseUrl = baseUrl;
  accepted = ['.docx,.DOCX'];
  constructor(
    private http: HttpClient,
    private store: Store,
    private toaster: ToastrService,
    // private templatesDataService: TemplateDataService,
    private readonly newTemplateDataService: TemplatesDataService,
    private router: RouterService,
    private readonly templateService: TemplateService,
    private readonly modal: CustomModalService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.init();
    this.currUser = this.store.selectSnapshot(
      (state) => state.user.currentUser
    );
  }

  handleEntityChange(entity) {
    this.selectedEntityObj = entity;
    this.entity_id = null;
  }

  init() {
    let obj = [];

    obj.push(
      this.getFirms(),
      this.getStrategies(),
      this.getFunds(),
      this.getVehicle()
    );

    forkJoin(obj).subscribe((res) => (this.loading = false));
  }

  getFirms() {
    let params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
    };

    return this.http
      .post('service/dvapi_service/firm_search', params)
      .pipe(tap((response: any) => (this.firms = response.data)));
  }

  getStrategies() {
    let params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
    };
    return this.http
      .post('service/dvapi_service/product_search', params)
      .pipe(tap((response: any) => (this.strategies = response.data)));
  }

  getFunds() {
    return this.http
      .get('funds')
      .pipe(tap((response) => (this.funds = response)));
  }

  getVehicle() {
    return this.http
      .get('vehicles')
      .pipe(tap((response) => (this.vehicles = response)));
  }

  handleImport() {
    if (!this.files?.length) {
      this.toaster.error('Please select a file');
      return;
    }
    if (
      !this.entity_id &&
      this.selectedEntityObj.value != keywordConstants.MyFirm
    ) {
      this.toaster.error(`Please select a ${this.selectedEntityObj.name}`);
      return;
    }

    // @saving_template = true
    this.uploading = true;
    this.selected_entity_type =
      this.EntityConstants[this.selectedEntityObj.value];
    this.selected_entity_id =
      this.selectedEntityObj.value == keywordConstants.MyFirm
        ? this.currUser.firmInfo.id
        : this.entity_id;
    this.uploadWordFile();
  }

  handleFileUpload(file) {
    this.files = file;
  }

  uploadFiles(apiUrl, files) {
    const payload = new FormData();
    payload.append('file', files);

    return this.http.post(apiUrl, payload);
  }

  uploadWordFile() {
    let templateParams = {
      entity_id: this.entity_id,
      entity_type: this.selected_entity_type,
      selected_entity_type: this.selected_entity_type,
      selected_entity_id: this.selected_entity_id,
    };
    //
    // let fl = this.files[0];

    // this.uploadFiles(url, fl).subscribe(
    //   (response: any) => {
    //     this.newTemplateDataService.setWordParcerData(response);
    //     this.newTemplateDataService.setOriginalWordFile(this.files);

    //     if (templateParams)
    //       this.newTemplateDataService.setTemplateParams(templateParams);
    //     else
    //       this.newTemplateDataService.setTemplateParams({
    //         name: this.files[0].name,
    //       });

    //     response.file = this.files;

    //     this.router.navigateWithParams('app.diligence.word_to_template', {
    //       doc_id: response.doc_id,
    //       type: 'QA',
    //     });
    //     this.uploading = false;
    //   },
    //   (err) => (this.uploading = false)
    // );
    let url = `excel_parser/upload?parserType=Word&entity_type=${this.selected_entity_type}&entity_id=${this.selected_entity_id}&investor_id=${null}`;
    const payload = new FormData();
    let fl = this.files[0];
    payload.append('file', fl);
    this.templateService.uploadTemplateFile(url, payload).subscribe(
      (response: any) => {
        this.newTemplateDataService.setWordParserData(response);
        this.newTemplateDataService.setOriginalWordFile(this.files);

        if (templateParams)
          this.newTemplateDataService.setTemplateParams(templateParams);
        else
          this.newTemplateDataService.setTemplateParams({
            name: this.files[0].name,
          });

        response.file = this.files;

        this.router.navigateWithParams('app.diligence.word_to_template', {
          doc_id: response.doc_id,
          type: 'QA',
        });
        this.modal.close();
        this.uploading = false;
      },
      (err) => (this.uploading = false)
    );

    // ogFile = file
    // promise.then (result) =>
    //   @TemplatesDataService.setWordParcerData(result.data)
    //   @TemplatesDataService.setOriginalWordFile(file)
    //   if templateParams
    //     @TemplatesDataService.setTemplateParams(templateParams)
    //   else
    //     @TemplatesDataService.setTemplateParams({name: ogFile[0].name})

    //   result.file = ogFile
    //   @$timeout =>
    //     @$state.go 'app.diligence.word_to_template' , {doc_id: result.data.doc_id,  type: "QA"}
    //     @close(result)
    // , (reason) =>
    //   @saving_template = false
  }
}
