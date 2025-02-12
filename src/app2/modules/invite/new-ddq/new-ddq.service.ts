import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TemplateService } from 'src/app2/apis/template/template.service';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BaseDataService } from 'src/app2/services/base-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  keywordConstants,
  requestSteps,
} from 'src/app2/shared/constants/constant';
import { ModalService } from 'src/app2/services/modal.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
@Injectable({
  providedIn: 'root',
})
export class NewDdqService {
  private investors: any;
  private strategies: any;
  private products: any;
  private vehicles: any;
  private template: any;
  private destroyTimer: any;
  parserService: any;
  constructor(
    private http: HttpClient,
    private Utils: UtilsService,
    private toaster: ToastrService,
    private datePipe: DatePipe,
    private readonly router: RouterService,
    private readonly BaseDataService: BaseDataService,
    private readonly templateService: TemplateService,
    private readonly ModalFactory: ModalService,
    private readonly customModalService: CustomModalService
  ) {}

  getTemplates(params) {
    if (this.template) return of(this.template);
    return this.http
      .get('templates', { params: params })
      .pipe(tap((data: any) => (this.template = data)));
  }

  getInvestors() {
    if (this.investors) return of(this.investors);
    return this.http
      .get('firms/monitor', { params: { recordsPerPage: 9999999 } })
      .pipe(tap((data: any[]) => (this.investors = data)));
  }

  getProducts(params) {
    if (this.products) return of(this.products);
    return this.http
      .post('service/dvapi_service/fund_search', params)
      .pipe(tap((data: any[]) => (this.products = data)));
  }

  getVehicles(params) {
    if (this.vehicles) return of(this.vehicles);
    return this.http
      .post('service/dvapi_service/vehicle_search', params)
      .pipe(tap((data: any[]) => (this.vehicles = data)));
  }

  getStrategies(params) {
    if (this.strategies) return of(this.strategies);
    return this.http
      .post('service/dvapi_service/product_search', params)
      .pipe(tap((data: any[]) => (this.strategies = data)));
  }

  // Cancel the destruction of data if returned to the page before 2 seconds
  cancelDestroyData() {
    clearTimeout(this.destroyTimer);
  }

  setTemplateService(templateService) {
    this.parserService = templateService;
  }

  //Function to automatically destroy the data after 2 seconds of component being destroyed
  destroyData() {
    this.destroyTimer = setTimeout(() => {
      this.investors = null;
      this.template = null;
      this.strategies = null;
      this.vehicles = null;
      this.products = null;
    }, 2000);
  }

  getSuggestedProjectName(
    investorId,
    entityId,
    is_firm_dd,
    entityType,
    currentFirm
  ) {
    let entityName: string, investorName: string;
    if (investorId && investorId !== '') {
      const investor = this.investors.find((investor: { id: any }) => {
        return investor.id === investorId;
      });
      if (investor) {
        investorName = investor.name + '_';
      } else {
        investorName = '';
      }
    } else {
      investorName = '';
    }

    if (is_firm_dd) {
      entityName = currentFirm + '_';
    } else if (entityId && entityId !== '') {
      let entity;
      if (entityType === keywordConstants.Strategy)
        entity = this.strategies.data.find((strat: { id: any }) => {
          return strat.id === entityId;
        });
      else if (entityType === keywordConstants.Vehicle)
        entity = this.vehicles.data.find((vehicle: { id: any }) => {
          return vehicle.id === entityId;
        });
      else if (entityType === keywordConstants.Product)
        entity = this.products.data.find((fund: { id: any }) => {
          return fund.id === entityId;
        });
      if (entity) {
        entityName = entity.name + '_';
      } else {
        entityName = '';
      }
    } else {
      entityName = '';
    }
    const dateInfo = this.Utils.formatDatetimeForSuggestedName(moment());

    return `${investorName}${entityName}${dateInfo}`;
  }

  createDiligence(
    templateId,
    investorId,
    entityId,
    name,
    is_firm_dd,
    entityType,
    due_at,
    as_of_date,
    currentFirm,
    diligenceType,
    successCallBack,
    failureCallBack
  ) {
    let entity_id: any, entity_type: string;
    let toastInstance: any = this.toaster.info(
      'Processing Request...',
      'Please wait while the request is being processed.',
      { timeOut: 2000 }
    );

    if (is_firm_dd) {
      entity_type = 'Firm';
      entity_id = currentFirm.id;
    } else {
      entity_type = entityType;
      entity_id = entityId;
    }

    const params: any = {
      diligence_type: diligenceType,
      entities: [
        {
          id: entity_id,
          entity_type: entity_type,
          template_id: templateId,
        },
      ],
      name: name,
      due_at: due_at,
      as_of_date: this.datePipe.transform(as_of_date, 'MM-dd-yyyy'),
      is_internal: true,
    };

    if (investorId) {
      params.investor_id = investorId;
    }

    const pageUrl = this.generatePageUrl(entityType, entityId, currentFirm);
    const headers = new HttpHeaders().set('page-url', pageUrl);
    this.http.post('v2/diligences', params, { headers: headers }).subscribe(
      (response: any) => {
        this.updateRequestandRedirect(response);
        successCallBack();
      },
      (error: { status: any }) => {
        this.toaster.clear(toastInstance);
        const avoid_error_display_statuses =
          this.BaseDataService.getAvoidErrorDisplayStatusList();
        if (!Array.from(avoid_error_display_statuses).includes(error.status)) {
          this.toaster.error('Something went wrong. Please try again.');
        }

        failureCallBack();
      }
    );
  }

  generatePageUrl(entityType, entityId, currentFirm) {
    let pageUrl = '';
    if (entityType === keywordConstants.Firm) {
      pageUrl = `app/firms/${currentFirm.id}/new_ddq`;
    } else if (entityType === keywordConstants.Strategy) {
      const stratIndex = this.strategies.data.findIndex(
        (strategy: { id: any }) => {
          return strategy.id === entityId;
        }
      );
      const firmId = this.strategies.data[stratIndex].firm_id;
      pageUrl = `app/firms/${firmId}/strategies/${entityId}/new_ddq`;
    } else if (entityType === keywordConstants.Vehicle) {
      const vehicleIndex = this.vehicles.data.findIndex(
        (vehicle: { id: any }) => {
          return vehicle.id === entityId;
        }
      );
      const firmId = this.vehicles.data[vehicleIndex].firm_id;
      const fundId = this.vehicles.data[vehicleIndex].fund_id;
      pageUrl = `app/firms/${firmId}/funds/${fundId}/vehicles/${entityId}/new_ddq`;
    } else if (entityType === keywordConstants.Products) {
      const fundIndex = this.products.data.findIndex((fund: { id: any }) => {
        return fund.id === entityId;
      });
      const firmId = this.products.data[fundIndex].parentFirm.id;
      pageUrl = `app/firms/${firmId}/funds/${entityId}/new_ddq`;
    }
    return pageUrl;
  }

  updateRequestandRedirect(response: { id: any }) {
    this.successHandler(response);
  }

  successHandler(response: { id: any }) {
    this.toaster.success('Your project is successfully created');
    return this.router.navigateWithParams(
      'app.diligence.project.questionnaire',
      {
        diligenceId: response.id,
      }
    );
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

  getParserParams(files: any, name, sourceType, source, templateType) {
    let fileExt: string;
    let optionType;
    let parserType;
    let templateParams = {
      source: source,
      sourceType: sourceType,
      name: name,
      type: templateType,
    };
    if (files && files.length) {
      optionType = requestSteps.DOC_PARSER;
      fileExt = this.getFileExtension(files[0].name);
      if (fileExt === 'xlsx') {
        optionType = requestSteps.EXCEL_PARCER;
      }
    }

    if (optionType === requestSteps.DOC_PARSER) {
      if (fileExt !== 'pdf') {
        parserType = 'Word';
      } else {
        parserType = 'Pdf';
      }
    } else if (optionType === requestSteps.EXCEL_PARCER) {
      parserType = 'Excel';
    }

    return { parserType, templateParams };
  }

  uploadParserFileNewProjectFlow(
    file: any,
    type: string,
    templateParams: { source: string },
    entityType,
    entityId,
    currentFirm,
    name,
    as_of_date,
    due_date,
    templateId,
    investorId,
    diligenceType,
    successCallBack,
    errCallBack
  ) {
    const url = `excel_parser/upload?parserType=${type}&entity_type=${entityType}&entity_id=${entityId}&investor_id=${investorId}`;
    
    const payload = new FormData();
    let fl = file[0];
    payload.append('file', fl); 
    this.templateService.uploadTemplateFile(url, payload).subscribe(
      (result: any) => {
        const localParams: any = {};
        successCallBack();
        localParams.apiParams = {
          entity_type: entityType,
          entity_id: entityId,
          name: name,
          templateId: templateId,
          duediligence_type: diligenceType,
          as_of_date: as_of_date,
          due_at: due_date,
          investor_id: investorId,
        };
        localParams.pageUrl = this.generatePageUrl(
          entityType,
          entityId,
          currentFirm
        );
        this.parserService.setDiligenceParams(localParams);
        if (type === 'Excel') {
          this.parserService.setExcelParserData(result);
          this.parserService.setOriginalExcelFile([fl]);
        } else {
          this.parserService.setWordParserData(result);
          this.parserService.setOriginalWordFile([fl]);
        }
        this.parserService.setTemplateParams(templateParams);
        if (type === 'Excel') {
          this.router.navigateWithParams('app.diligence.excel_to_template', {
            doc_id: result.doc_id,
            type: 'EP',
          });
        } else {
          this.router.navigateWithParams('app.diligence.word_to_template', {
            doc_id: result.doc_id,
            type: 'WP',
          });
        }
      },
      (error) => {
        errCallBack();
      }
    );
  }

  handleAddInvestor(name, success) {
    return this.customModalService.invoke('manage-firm', {
      initialState: {
        isDDqCloseModel: true,
        response: (response: {}) => {
          this.investors.results = this.investors.results.concat(response);
          success(response);
        },
        class: 'gray modal-lg',
      },
    });
  }

  handleAddProduct(name, success) {
    return this.customModalService.invoke('manage-fund', {
      initialState: {
        isDDqCloseModel: true,
        response: (response: {}) => {
          this.products.data = this.products.data.concat(response);
          success(response);
        },
      },
      class: 'gray modal-lg',
    });
  }

  handleAddStrategy(name, success) {
    return this.customModalService.invoke('manage-fund', {
      initialState: {
        fund_type: 'strategy',
        isDDqCloseModel: true,
        response: (response: {}) => {
          this.strategies.data = this.strategies.data.concat(response);
          success(response);
        },
      },
      class: 'gray modal-lg',
    });
  }

  handleAddVehicle(name, success) {
    return this.customModalService.invoke('manage-vehicle', {
      initialState: {
        isDDqCloseModel: true,
        response: (response: {}) => {
          this.vehicles.data = this.vehicles.data.concat(response);
          success(response);
        },
      },
      class: 'gray modal-lg',
    });
  }
}
