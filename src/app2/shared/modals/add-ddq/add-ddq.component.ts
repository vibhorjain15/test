import { DatePipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Component,
  Input,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { finalize, map } from 'rxjs/operators';
import { DueDiligenceDataService } from 'src/app2/services/due-diligence-data.service';
import { FundDataService } from 'src/app2/services/fund-data.service';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  DiligenceTypeEnum,
  errorMessageMap,
  hierarchyConstants,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';
import {
  DvValidators,
  noHtmlValidator,
} from '../../validators/no-white-space.validator';
@Component({
  selector: 'add-ddq',
  templateUrl: './add-ddq.component.html',
  styleUrls: ['./add-ddq.component.css'],
})
export class AddDdqModal implements OnInit {
  @ViewChildren(DatePickerComponent) calendars: QueryList<DatePickerComponent>;
  global_hierarchy_option: any;
  current_firm: any;
  minDate: Date;
  maxDate: Date;
  maxAsOfDate: Date;
  suggested_due_date_diff: number;
  is_manager: boolean;
  is_investor: boolean;
  diligence_type: any;
  source: any;
  showInvestorSelection: boolean;
  @Input() request: any;
  internalOnly: boolean;
  modalTitle: any;
  funds: any;
  strategies: any;
  firms: any;
  vehicles: any;
  templates: any;
  keywordConstants = keywordConstants;
  ddqForm: FormGroup;
  hierarchyConstants = hierarchyConstants;
  is_firm_dd: boolean = false;
  loading: boolean = true;
  @Input() entity_id: number;
  @Input() entity_type: string;
  @Input() entity_name: string;
  @Input() type: string;
  errorMessageMap = errorMessageMap;
  @Select(UserState.getCurrentUserData) user;
  isSubmitting = false;
  isTemplateLoaded = false;
  isFirst = true;
  firms_loading = false;
  entityTypes: any[];
  constructor(
    private readonly Utils: UtilsService,
    private readonly fundDataService: FundDataService,
    private readonly dueDiligenceDataService: DueDiligenceDataService,
    private http: HttpClient,
    private datePipe: DatePipe,
    private toaster: ToastrService,
    private router: RouterService,
  ) {}

  ngOnInit(): void {
    this.global_hierarchy_option = this.hierarchyConstants.Strategy;
    this.minDate = new Date();
    this.maxDate = new Date();
    this.maxAsOfDate = this.Utils.getMaxAsOfDateDiligence();
    this.suggested_due_date_diff = 45;
    this.createForm();
    this.user.pipe(take(2)).subscribe((data) => {
      if (data) {
        this.current_firm = data.firmInfo;
        this.is_manager = data.isManager;
        this.is_investor = data.isInvestor;
        this.getData();
        this.entityTypes = this.getEntityTypes();
        if (
          !(
            this.is_manager &&
            this.diligence_type != 'dd_profile' &&
            this.showInvestorSelection
          )
        ) {
          this.ddqForm.get('investor_id').setValidators([]);
          this.ddqForm.get('investor_id').updateValueAndValidity();
        }
        if (this.diligence_type === DiligenceTypeEnum.dd_profile) {
          this.ddqForm.get('due_at').setValidators([]);
          this.ddqForm.get('due_at').updateValueAndValidity();
          this.ddqForm.patchValue({
            due_at: null,
          });
        }
      }
    });
  }

  getData() {
    if (this.entity_type) {
      this.setEntityType(this.entity_type);
    } else {
      this.setEntityType('Fund');
    }

    if (this.type) {
      this.diligence_type = this.type;
    } else {
      this.diligence_type = 'dd_new';
    }

    if (
      this.source &&
      (this.source === 'investor_request' || this.source === 'template')
    ) {
      this.showInvestorSelection = true;
    } else {
      this.showInvestorSelection = false;
    }

    if (
      (this.request && this.request.investor_id) ||
      this.source === 'template'
    ) {
      this.internalOnly = true;
      this.onInternalCheckboxChanged();
    }
    this.modalTitle = this.getModalTitle();
    if (this.request && this.request.type) {
      this.setDDType(this.request.type);
    }
    this.getTemplates();
    this.getFirms();
  }

  createForm() {
    this.ddqForm = new FormGroup({
      investor_id: new FormControl(
        this.request && this.request.investor_id
          ? this.request.investor_id
          : null,
        Validators.required
      ),
      template_id: new FormControl(null, Validators.required),
      entity_id: new FormControl(
        this.request && this.request.entity_id
          ? this.request.entity_id
          : this.entity_id,
        Validators.required
      ),
      name: new FormControl(
        this.request && this.request.name ? this.request.name : '',
        [DvValidators.required, noHtmlValidator]
      ),
      due_at: new FormControl(
        this.request && this.request.due_at
          ? this.request.due_at
          : moment().add(this.suggested_due_date_diff, 'days').toDate(),
        Validators.required
      ),
      as_of_date: new FormControl(
        this.request && this.request.as_of_date
          ? this.request.as_of_date
          : new Date(),
        Validators.required
      ),
    });
  }

  getModalTitle() {
    if (this.is_manager) {
      if (this.diligence_type === 'dd_profile') {
        return 'New Q/A Library Content';
      } else if (this.showInvestorSelection) {
        return 'New Investor Request';
      } else {
        return 'New Standard DDQ';
      }
    } else if (this.is_investor) {
      if (this.diligence_type === 'dd_profile') {
        return 'New Internal Profile';
      } else {
        return 'New Internal DDQ';
      }
    }
  }

  onInternalCheckboxChanged() {
    if (this.internalOnly) {
      this.ddqForm.patchValue({
        investor_id: null,
      });
      this.ddqForm.get('investor_id').markAsUntouched({ onlySelf: true });
      this.ddqForm.get('investor_id').disable();
      this.ddqForm.get('investor_id').clearValidators();
    } else {
      this.ddqForm.get('investor_id').enable();
      this.ddqForm.get('investor_id').setValidators(Validators.required);
    }
    this.ddqForm.get('investor_id').updateValueAndValidity();
  }

  onFirmLevelCheckboxChanged() {
    if (this.is_firm_dd) {
      this.ddqForm.get('entity_id').disable();
      this.ddqForm.get('entity_id').clearValidators();
    } else {
      this.ddqForm.get('entity_id').enable();
      this.ddqForm.get('entity_id').setValidators(Validators.required);
    }
    this.ddqForm.get('entity_id').updateValueAndValidity();
  }

  setDDType(type: string) {
    if (type === 'Shareable_request') {
      this.diligence_type = 'dd_new';
    } else if (type === 'preapproved_request') {
      this.diligence_type = 'dd_profile';
    }
  }

  getFunds() {
    if (this.funds) return;
    this.fundDataService
      .getFunds()
      .pipe(map((x: any) => x.data))
      .subscribe((response: any) => {
        this.funds = response;

        this.loading = false;
      });
  }

  getAllStrategies() {
    if (this.strategies) return;
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      include_ratings: true,
      is_active: true,
      filters: {},
      search_for: this.global_hierarchy_option,
    };
    this.http
      .post('service/dvapi_service/product_search', params)
      .subscribe((response: any) => {
        this.strategies = response.data;
        this.loading = false;
      });
  }

  getAllVehicles() {
    if (this.vehicles) return;
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      is_active: true,
      filters: {},
    };
    this.http
      .post('service/dvapi_service/vehicle_search', params)
      .subscribe((response: any) => {
        this.vehicles = response.data;
        this.loading = false;
      });
  }

  getFirms() {
    if (this.firms) return;
    const params = {
      include_contacts: false,
      include_custom_fields: false,
      include_dates: true,
      include_ratings: true,
      is_active: true,
      filters: {},
    };
    this.firms_loading = true;
    this.http.post('service/dvapi_service/firm_search', params).subscribe(
      (response: any) => {
        this.firms = response.data;
        this.loading = false;
        this.firms_loading = false;
      },
      (e) => {
        this.firms_loading = false;
      }
    );
  }

  getTemplates() {
    const params = {
      detail: false,
      is_new_information_request: true,
    };
    this.http.get('templates', { params: params }).subscribe(
      (response: any) => {
        this.isTemplateLoaded = true;
        this.templates = response;
        if (this.request && this.request.template_id) {
          this.ddqForm.patchValue({
            template_id: this.request.template_id,
          });
        }
        this.filterTemplates();
      },
      (e) => (this.isTemplateLoaded = true)
    );
  }

  filterTemplates() {
    if (this.diligence_type === 'dd_profile') {
      this.templates = this.templates.filter((x) => x.type === 'dd_profile');
    } else {
      this.templates = this.templates.filter((x) => x.type !== 'dd_profile');
    }
  }

  setDateValue(date: Date, controlName: string) {
    this.ddqForm.get(controlName).patchValue(date);
    if (this.diligence_type !== DiligenceTypeEnum.dd_profile)
      this.validateDueDate();
  }

  validateDueDate() {
    if (
      moment(this.ddqForm.get('due_at').value).isSameOrAfter(
        this.ddqForm.get('as_of_date').value,
        'day'
      )
    ) {
      this.ddqForm.get('due_at').setErrors({ inValidDueDate: null });
      this.ddqForm.get('due_at').updateValueAndValidity();
    } else {
      this.ddqForm.get('due_at').setErrors({ inValidDueDate: true });
    }
  }

  getEntityTypes() {
    return [
      {
        name: keywordConstants.Product,
        label: this.Utils.getDisplayEntityType(keywordConstants.Product),
        icon: 'fund',
        size: '1x',
      },
      {
        name: keywordConstants.Strategy,
        label: this.Utils.getDisplayEntityType(keywordConstants.Strategy),
        icon: 'strategy',
        size: '1x',
      },
      {
        name: keywordConstants.Vehicle,
        label: this.Utils.getDisplayEntityType(keywordConstants.Vehicle),
        icon: 'vehicle-car',
        size: '1x',
      },
      {
        name: keywordConstants.Firm,
        label: this.is_manager
          ? `My ${this.Utils.getDisplayEntityType(keywordConstants.Firm)}`
          : this.Utils.getDisplayEntityType(keywordConstants.Firm),
        icon: 'institution',
        size: '1x',
      },
    ];
  }

  setEntityType(entity_type: string) {
    this.entity_type = entity_type;

    if (!this.isFirst) {
      this.ddqForm.controls.entity_id.setValue(null);
      this.ddqForm.controls.entity_id.markAsUntouched();
    }
    if (!this.is_investor) {
      this.is_firm_dd =
        entity_type.toLowerCase() === this.keywordConstants.Firm.toLowerCase();
      this.onFirmLevelCheckboxChanged();
    }

    this.isFirst = false;
    if (
      entity_type.toLowerCase() === this.keywordConstants.Product.toLowerCase()
    ) {
      this.getFunds();
    } else if (
      entity_type.toLowerCase() === this.keywordConstants.Firm.toLowerCase()
    ) {
      this.getFirms();
    } else if (
      entity_type.toLowerCase() === this.keywordConstants.Strategy.toLowerCase()
    ) {
      this.getAllStrategies();
    } else if (
      entity_type.toLowerCase() === this.keywordConstants.Vehicle.toLowerCase()
    ) {
      this.getAllVehicles();
    }
  }

  generatePageUrl(entity_type: any) {
    let pageUrl = '';
    if (
      entity_type.toLowerCase() === this.keywordConstants.Firm.toLowerCase()
    ) {
      pageUrl = `app/firms/${this.entity_id}/new_ddq`;
    } else if (
      entity_type.toLowerCase() === this.keywordConstants.Product.toLowerCase()
    ) {
      const fundIndex = this.funds.findIndex(
        (fund) => fund.id === this.entity_id
      );
      const firmId = this.funds[fundIndex].parent_id;
      pageUrl = `app/firms/${firmId}/funds/${this.entity_id}/new_ddq`;
    } else if (
      entity_type.toLowerCase() === this.keywordConstants.Vehicle.toLowerCase()
    ) {
      const firmId = this.vehicles.find(
        (vehicle) => vehicle.id === this.entity_id
      )?.parent_id;
      pageUrl = `app/firms/${firmId}/vehicles/${this.entity_id}/new_ddq`;
    } else if (
      entity_type.toLowerCase() === this.keywordConstants.Strategy.toLowerCase()
    ) {
      const firmId = this.strategies.find(
        (strategy) => strategy.id === this.entity_id
      )?.parent_id;
      pageUrl = `app/firms/${firmId}/strategies/${this.entity_id}/new_ddq`;
    }
    return pageUrl;
  }

  submit(modalCallback) {
    this.ddqForm.markAllAsTouched();
    this.calendars?.forEach((x) => x?.close());
    if (!this.ddqForm.valid) {
      return;
    } else {
      this.loading = true;
      this.isSubmitting = true;
      this.entity_id = this.ddqForm.get('entity_id').value;
      const formObj = this.ddqForm.value;

      if (this.is_firm_dd) {
        this.entity_type = 'Firm';
        formObj.entity_id = this.current_firm.id;
        this.entity_id = this.current_firm.id;
      }

      const params: any = {
        diligence_type: this.diligence_type,
        entities: [
          {
            id: this.entity_id,
            entity_type: this.entity_type,
            template_id: formObj.template_id,
          },
        ],
        name: formObj.name,
        due_at: this.datePipe.transform(formObj.due_at, 'MM-dd-yyyy'),
        as_of_date: this.datePipe.transform(formObj.as_of_date, 'MM-dd-yyyy'),
        is_internal: true,
      };

      if (!this.internalOnly && formObj.investor_id) {
        params.investor_id = formObj.investor_id;
      }

      const pageUrl = this.generatePageUrl(this.entity_type);
      const headers = new HttpHeaders().set('page-url', pageUrl);

      this.http
        .post('v2/diligences', params, { headers: headers })
        .pipe(
          finalize(() => {
            this.loading = false;
            this.isSubmitting = false;
          })
        )
        .subscribe(
          (response: any) => {
            this.updateRequestAndRedirect(response);
            modalCallback();
          },
          (e) => {
            this.loading = false;
            this.isSubmitting = false;
          }
        );
    }
  }

  updateRequestAndRedirect(response: any) {
    if (this.request && this.request.id) {
      this.request.duediligence_id = response.id;
      this.dueDiligenceDataService
        .saveRequest(this.request)
        .subscribe((res: any) => {
          this.successHandler(response);
        });
    } else {
      this.successHandler(response);
    }
  }

  successHandler(response: { id: any }) {
    this.toaster.success('Your project is successfully created');
    this.router.navigateWithParams('app.diligence.project.questionnaire', {
      diligenceId: response.id,
    });
  }
}
