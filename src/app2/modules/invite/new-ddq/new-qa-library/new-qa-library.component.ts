import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NewDdqService } from '../new-ddq.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DvValidators, noHtmlValidator } from 'src/app2/shared/validators/no-white-space.validator';
import {
  DiligenceTypeEnum,
  Regex,
  errorMessageMap,
  keywordConstants,
  requestSteps,
} from 'src/app2/shared/constants/constant';
import { RouterService } from 'src/app2/services/router.service';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { DatePipe } from '@angular/common';
import { TemplatesDataService } from 'src/app2/services/template-data.service';
import { TemplateService } from 'src/app2/apis/template/template.service';
import { EntityType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { UtilsService } from 'src/app2/services/utils.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'new-qa-library',
  templateUrl: './new-qa-library.component.html',
  styleUrls: ['./new-qa-library.component.css'],
})
export class NewQaLibraryComponent implements OnInit {
  @Input() entityTypes: any[];
  @Input() products: any[];
  @Input() strategies: any[];
  @Input() vehicles: any[];
  @Input() templates: any[];
  @Input() currentFirm: any;
  @Output() emitAddTemplateModal: EventEmitter<any> = new EventEmitter();

  ddqForm: FormGroup;
  responseDate = new Date();
  accepted = '.docx,.DOCX';
  asOfDate = new Date();
  maxAsOfDate;
  currentEntityList: any[] = [];
  submitLoader: boolean = false;
  keywordConstants = keywordConstants;
  requestSteps = requestSteps;
  errorMessageMap = errorMessageMap;
  constructor(
    private readonly newDdqService: NewDdqService,
    private readonly routerService: RouterService,
    private readonly toaster: ToastrService,
    private readonly TemplateDataService: TemplatesDataService,
    private readonly templateService: TemplateService,
    private datePipe: DatePipe,
    private readonly utils: UtilsService,
    private readonly customModalService: CustomModalService
  ) {
    this.openAddTemplateModal = this.openAddTemplateModal.bind(this);
  }

  ngOnInit(): void {
    this.formInit();
    const { entity_id, entity_type } = this.routerService.getState().params;
    if (entity_id && entity_type) {
      this.setEntity(entity_type);
      if (keywordConstants.Firm !== entity_type) this.setEntities(entity_id);
    }
    this.maxAsOfDate = moment().add(1, 'month').toDate();
  }

  formInit() {
    this.ddqForm = new FormGroup({
      entityType: new FormControl(null, [Validators.required]),
      entityId: new FormControl(null, [Validators.required]),
      addToMasterProject: new FormControl(true, []),
      name: new FormControl(null, [
        DvValidators.required,
        Validators.maxLength(320),
        Validators.pattern(Regex.avoidFirstSplCharacter),
        noHtmlValidator
      ]),
      as_of_date: new FormControl(new Date(), [Validators.required]),
      responseDate: new FormControl(this.responseDate, [Validators.required]),
      QaFile: new FormControl(null, [Validators.required]),
      reUseProjectAgain: new FormControl(false, []),
      templateId: new FormControl(null, [Validators.required]),
      is_firm_dd: new FormControl(null, []),
    });

    this.ddqForm.get('name').disable();
    this.ddqForm.get('as_of_date').disable();
    this.ddqForm.get('templateId').disable();
    this.ddqForm.updateValueAndValidity();
  }

  setEntity(entityName) {
    this.ddqForm.patchValue({
      entityType: entityName,
      entityId:
        entityName == keywordConstants.Firm ? this.currentFirm.id : null,
      questionnaire: null,
      is_firm_dd: entityName == keywordConstants.Firm,
    });

    if (entityName === keywordConstants.Product) {
      this.currentEntityList = this.products;
    } else if (entityName === keywordConstants.Strategy) {
      this.currentEntityList = this.strategies;
    } else if (entityName === keywordConstants.Vehicle) {
      this.currentEntityList = this.vehicles;
    } else {
      this.currentEntityList = null;
    }
  }

  setEntities(selectedOption) {
    this.ddqForm.patchValue({
      is_firm_dd: false,
      entityId: +selectedOption,
    });
    const { entityId, is_firm_dd } = this.ddqForm.value;
    if (is_firm_dd || (!is_firm_dd && !entityId)) {
      this.ddqForm.patchValue({
        entityId: null,
      });
    }
  }

  toggleAddToMasterProject(value) {
    if (!value) {
      this.ddqForm.get('name').enable();
      this.ddqForm.get('as_of_date').enable();
    } else {
      this.ddqForm.get('name').disable();
      this.ddqForm.get('as_of_date').disable();
    }

    this.ddqForm.updateValueAndValidity();

    this.toggleReUseTemplate(false);
  }

  handleResponseDateChange(date) {
    this.ddqForm.patchValue({
      responseDate: moment(date).toDate(),
    });
  }

  handleFileUpload(file) {
    this.ddqForm.patchValue({
      QaFile: file,
    });
  }

  handleAsOfDate(date) {
    this.ddqForm.patchValue({
      as_of_date: date,
    });
  }

  openEntityAddModal() {
    this.newDdqService[
      'handleAdd' +
      this.utils.getDisplayEntityType(this.ddqForm.get('entityType').value)
    ]('', (entity) => {
      const entityName = this.ddqForm.get('entityType').value;
      if (entityName === keywordConstants.Strategy) {
        this.strategies = this.strategies.concat(entity);
        this.currentEntityList = this.strategies;
      } else if (entityName === keywordConstants.Vehicle) {
        this.vehicles = this.vehicles.concat(entity);
        this.currentEntityList = this.vehicles;
      } else if (entityName === keywordConstants.Product) {
        this.products = this.products.concat(entity);
        this.currentEntityList = this.products;
      }

      this.setEntities(entity[0]?.id ?? entity.id);
    });
  }

  getSuggestedProjectName() {
    const { entityId, is_firm_dd, entityType } = this.ddqForm.value;
    return this.newDdqService.getSuggestedProjectName(
      null,
      entityId,
      is_firm_dd,
      entityType,
      this.currentFirm.name
    );
  }

  setSuggestedProjectName() {
    this.ddqForm.patchValue({ name: this.getSuggestedProjectName() });
  }

  toggleReUseTemplate(value) {
    this.ddqForm.patchValue({
      reUseProjectAgain: value,
      templateId: null,
    });

    if (value) {
      this.ddqForm.get('QaFile').disable();
      this.ddqForm.get('templateId').enable();
    } else {
      this.ddqForm.get('QaFile').enable();
      this.ddqForm.get('templateId').disable();
    }

    this.ddqForm.updateValueAndValidity();
  }

  //Parser related changes
  handleImport() {
    const { entityId, entityType, QaFile, addToMasterProject } =
      this.ddqForm.value;
    if (!QaFile?.length) {
      this.toaster.error('Please select a file');
      return;
    }

    this.submitLoader = true;

    this.uploadWordFileQaFlow();
  }

  // This parser flow is used to parser and upload only library QUESTIONS/ANSWER using parser flow (can be to master template or a new template and project)
  uploadWordFileQaFlow() {
    const { entityId, entityType, QaFile, addToMasterProject, name } =
      this.ddqForm.value;
    let templateParams = {
      entity_id: entityId,
      entity_type_name: entityType,
      entity_type: EntityType[entityType],
      selected_entity_type: EntityType[entityType],
      selected_entity_id: entityId,
      name: 'General',
      responseDateStamp: this.datePipe.transform(
        this.ddqForm.get('responseDate').value,
        'MM-dd-yyyy'
      ),
      is_new_project: !addToMasterProject,
      type: DiligenceTypeEnum.dd_profile,
    };
    let url = `excel_parser/upload?parserType=Word&entity_type=${entityType}&entity_id=${entityId}&investor_id=${null}`;
    const payload = new FormData();
    let fl = QaFile[0];
    payload.append('file', fl);
    this.templateService.uploadTemplateFile(url, payload).subscribe(
      (response: any) => {
        this.TemplateDataService.setWordParserData(response);
        this.TemplateDataService.setOriginalWordFile(QaFile);
        if (!addToMasterProject) {
          this.TemplateDataService.setDiligenceParams({
            apiParams: {
              entity_type_name: entityType,
              entity_type: EntityType[entityType],
              entity_id: entityId,
              name: name,
              as_of_date: this.datePipe.transform(
                this.ddqForm.get('as_of_date').value,
                'MM-dd-yyyy'
              ),
            },
          });
        }

        if (!addToMasterProject && templateParams) {
          templateParams.name = name;
        }

        if (templateParams)
          this.TemplateDataService.setTemplateParams(templateParams);
        else
          this.TemplateDataService.setTemplateParams({
            name: QaFile[0].name,
            is_new_project: !addToMasterProject,
          });

        response.file = QaFile;

        this.routerService.navigateWithParams(
          'app.diligence.word_to_template',
          {
            doc_id: response.doc_id,
            type: 'QA',
          }
        );
        this.submitLoader = false;
      },
      (err) => (this.submitLoader = false)
    );
  }

  // This parser flow is to create new library project using parser flow
  uploadParserFileNormalFlow(QaFile) {
    const { templateId, entityId, entityType, name, as_of_date, is_firm_dd } =
      this.ddqForm.value;
    let parserParams = this.newDdqService.getParserParams(
      QaFile,
      this.ddqForm.get('name').value,
      null,
      'InformationRequestFlow',
      DiligenceTypeEnum.dd_profile
    );

    this.newDdqService.uploadParserFileNewProjectFlow(
      QaFile,
      parserParams.parserType,
      parserParams.templateParams,
      entityType,
      entityId,
      this.currentFirm,
      name,
      as_of_date,
      null,
      templateId,
      null,
      DiligenceTypeEnum.dd_profile,
      () => {
        this.submitLoader = false;
      },
      () => {
        this.submitLoader = false;
      }
    );
  }

  startPopulate() {
    const { templateId, entityId, entityType, name, as_of_date, is_firm_dd } =
      this.ddqForm.value;
    this.newDdqService.createDiligence(
      templateId,
      null,
      entityId,
      name,
      is_firm_dd,
      entityType,
      null,
      as_of_date,
      this.currentFirm,
      DiligenceTypeEnum.dd_profile,
      () => {
        this.submitLoader = false;
      },
      () => {
        this.submitLoader = false;
      }
    );
  }

  openAddTemplateModal(templateName: string, type = requestSteps.TEMPLATE_BUILDER) {
    const { entityId, entityType, name, as_of_date } =
      this.ddqForm.value;

    if (!entityId || !entityType) {
      this.ddqForm.markAllAsTouched();
      this.toaster.error('Please select an entity');
      return;
    }

    if (!name) {
      this.ddqForm.markAllAsTouched();
      this.toaster.error('Please enter the project name');
      return;
    }

    let optionType: any, templateType: string;
    templateType = DiligenceTypeEnum.dd_profile;
    if (type) {
      optionType = type;
    }

    const localParams: any = {};
    localParams.apiParams = {
      entity_type: entityType,
      entity_id: entityId,
      name: name,
      as_of_date: as_of_date,
      duediligence_type: templateType,
    };

    localParams.pageUrl = this.newDdqService.generatePageUrl(
      entityType,
      entityId,
      this.currentFirm
    );

    this.TemplateDataService.setDiligenceParams(localParams);
    this.customModalService.invoke('new-template', {
      initialState: {
        pendingrequest: localParams,
        templateOptions: {
          templateType,
          optionType,
          templateName: typeof templateName == 'string' ? templateName : null,
        },
        source: 'InformationRequestFlow',
      },
    });
    return;
  }

  submit() {
    if (!this.ddqForm.valid) return;
    this.submitLoader = true;
    if (this.ddqForm.get('reUseProjectAgain').value) this.startPopulate();
    else this.handleImport();
  }

  handleGoBack() {
    window.history.back();
  }
}
