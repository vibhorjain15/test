import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterService } from './../../../services/router.service';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  errorMessageMap,
  keywordConstants,
} from 'src/app2/shared/constants/constant';
import { InterpolatePipe } from 'src/app2/shared/pipes/interpolate.pipe';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-review-request',
  templateUrl: './review-request.component.html',
  styleUrls: ['./review-request.component.css'],
})
export class ReviewRequestComponent implements OnInit {
  opportunityForm: FormGroup;
  showSpinner = false;
  loading = false;
  opportunities = [];
  fund_list = [];
  vehicle_list = [];
  strategy_list = [];
  investor_id;
  hide_private = true;
  showError = false;
  isSelectedOpportunity = false;
  redirectId;
  defaultOpportunity;
  entityText = '';
  entityPlaceholder = '';
  today = new Date();
  maxAsOfDate = moment().add(1, 'month').toDate();
  logoLink = '';
  investor_name = '';
  descriptionContent = '';
  defaultEnatitytype = '';
  entityOption = [
    { label: 'My Firm', value: keywordConstants.Firm },
    { label: 'Strategy', value: keywordConstants.Strategy },
    { label: 'Product', value: keywordConstants.Product },
  ];
  keywordConstants: any = keywordConstants;
  showMore: boolean = false;
  @Select(UserState.getCurrentUserData) user;
  currentUser: any;
  dueDateError;
  constructor(
    private readonly routerService: RouterService,
    private readonly http: HttpClient,
    private readonly interpolatePipe: InterpolatePipe,
    private readonly toaster: ToastrService,
    private readonly CustomModalFactory: CustomModalService,
    private readonly datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.currentUser = data;
        }
      });
    this.investor_id = +this.routerService.getState().params.investorId;
    this.redirectId = this.routerService.getState().params.redirectId;
    this.showSpinner = true;
    if (!this.investor_id) {
      this.hide_private = false;
      this.http
        .post(`service/dvapi_service/inbound`, { redirect_id: this.redirectId })
        .subscribe((res: any) => {
          this.investor_id = res.investor_details.id;
          this.logoLink = res.investor_details.firm_logo;
          this.investor_name = res.investor_details.name;
          this.defaultEnatitytype = res.inbound_details.entity_type;
          // if (res.inbound_details.entity_type !== 'Firm') {
          //   this.entityText = `Associated ${
          //     res.inbound_details.entity_type == 'Fund'
          //       ? 'Product'
          //       : res.inbound_details.entity_type
          //   }`;
          //   this.entityPlaceholder = `-- Select Associated ${
          //     res.inbound_details.entity_type == 'Fund'
          //       ? 'Product'
          //       : res.inbound_details.entity_type
          //   } --`;
          // }
          if (
            moment(res.inbound_details.due_date).isBefore(
              moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            )
          ) {
            this.toaster.error('Sorry, this opportunity has expired.');
            this.routerService.navigate('app.inbound.investor_pitch');
          } else {
            this.initialize();
          }
        });
    } else {
      this.initialize();
    }
  }

  initialize() {
    forkJoin([
      this.http.get('funds', { params: { profile: 'true' } }),
      this.http.post(`service/dvapi_service/get_investors_configs`, {
        investor_id: this.investor_id,
        hide_private: this.hide_private,
      }),
      this.http.post(`service/dvapi_service/product_search`, {
        include_contacts: false,
        include_custom_fields: false,
        include_dates: false,
        filters: {},
        search_for: 'strategy',
      }),
      this.http.post(`service/dvapi_service/vehicle_search`, {
        include_contacts: false,
        include_custom_fields: false,
        include_dates: false,
        filters: {},
        is_active: true,
      }),
    ]).subscribe((res: any) => {
      this.fund_list = res[0];
      this.vehicle_list = res[3].data;
      this.strategy_list = res[2].data;
      this.opportunities = res[1].data;
      if (!this.logoLink) {
        this.logoLink = this.opportunities[0].logo_link;
        this.investor_name = this.opportunities[0].investor_name;
      }
      if (this.redirectId) {
        this.isSelectedOpportunity = true;
        this.defaultOpportunity = this.opportunities.find((opportunity) =>
          opportunity.redirect_url.includes(this.redirectId)
        );
        if (this.defaultOpportunity?.description) {
          this.descriptionContent = this.defaultOpportunity.description;
        }
      }
      this.opportunityForm = new FormGroup({
        opportunityNameControl: new FormControl(
          {
            value: this.redirectId ? this.defaultOpportunity.id : null,
            disabled: this.redirectId,
          },
          [Validators.required]
        ),
        entityTypeControl: new FormControl(
          this.redirectId && this.defaultEnatitytype != ''
            ? this.defaultEnatitytype
            : null,
          [Validators.required]
        ),
        associatedEntityControl: new FormControl(),
        investorFirmControl: new FormControl({
          value: this.opportunities.length
            ? this.opportunities[0].investor_name
            : '',
          disabled: true,
        }),
        asOfDateControl: new FormControl(
          this.redirectId && this.defaultOpportunity.as_of_date
            ? new Date(this.defaultOpportunity.as_of_date)
            : new Date()
        ),
        dueDateControl: new FormControl({
          value:
            this.redirectId && this.defaultOpportunity.due_date
              ? new Date(this.defaultOpportunity.due_date)
              : new Date(moment().add(45, 'days').toDate()),
          disabled: true,
        }),
      });
      this.showSpinner = false;
      if (this.defaultEnatitytype) {
        this.onEntitySelection(this.defaultEnatitytype);
      }
    });
  }
  toggleShowMore() {
    this.showMore = !this.showMore;
  }
  onBack() {
    window.history.back();
  }

  onProceedToProjects() {
    if (this.opportunityForm.invalid || this.dueDateError) {
      this.showError = true;
      return;
    }
    this.showError = false;
    const selectedOpportunity = this.getSelectedOpportunity();
    const selectedEntityType = this.getEntityType();
    const param = {
      diligence_type: 'inbound',
      entities: [
        {
          id:
            selectedEntityType === 'Firm' || this.defaultEnatitytype === 'Firm'
              ? this.currentUser.firmInfo.id
              : this.opportunityForm.value.associatedEntityControl,
          notification_contacts: selectedOpportunity.contacts.map(
            (contact) => contact.id
          ),
          entity_type: selectedEntityType
            ? selectedEntityType
            : this.defaultEnatitytype,
          template_id: selectedOpportunity.template_id,
        },
      ],
      name: `${selectedOpportunity.name} ${
        selectedEntityType === 'Firm'
          ? this.currentUser.firmInfo.name
          : this.getSelectedEntityName()
      }`,
      due_at: this.datePipe.transform(
        this.opportunityForm.getRawValue().dueDateControl,
        'MM-dd-yyyy'
      ),
      as_of_date: this.datePipe.transform(
        this.opportunityForm.value.asOfDateControl,
        'MM-dd-yyyy'
      ),
      is_internal: true,
      investor_id: this.investor_id,
      inbound_configurations_id: selectedOpportunity.id,
    };
    this.loading = true;
    this.http.post(`v2/diligences`, param).subscribe(
      (res: any) => {
        this.loading = false;
        this.routerService.navigateWithParams(
          'app.diligence.project.questionnaire',
          {
            diligenceId: res.id,
          }
        );
      },
      (error) => (this.loading = false)
    );
  }

  onChange(event) {
    if (event) {
      this.isSelectedOpportunity = true;
      var selectedOpportunity;
      if (this.redirectId) {
        selectedOpportunity = this.defaultOpportunity;
      } else {
        selectedOpportunity = this.opportunities.find(
          (opportunity) => opportunity.id === event
        );
      }
      this.opportunityForm
        .get('dueDateControl')
        .setValue(
          selectedOpportunity?.due_date
            ? new Date(selectedOpportunity?.due_date)
            : new Date(moment().add(45, 'days').toDate())
        );
      this.opportunityForm
        .get('asOfDateControl')
        .setValue(
          new Date(
            selectedOpportunity?.as_of_date
              ? selectedOpportunity?.as_of_date
              : new Date()
          )
        );
      this.opportunityForm
        .get('entityTypeControl')
        .setValue(
          selectedOpportunity?.entity_type
            ? selectedOpportunity.entity_type
            : null
        );
      this.handleDateValidation();
      this.onEntitySelection(selectedOpportunity?.entity_type);
      if (selectedOpportunity?.description) {
        this.descriptionContent = selectedOpportunity?.description || '';
      } else {
        this.descriptionContent = '';
      }
    } else {
      this.isSelectedOpportunity = false;
    }
  }

  openNewDialog() {
    if (this.opportunityForm.value.entityTypeControl === 'Fund') {
      this.CustomModalFactory.invoke('manage-fund', {
        initialState: {
          isDDqCloseModel: true,
          fund_type: 'fund',
          response: (response) => {
            this.fund_list = [...this.fund_list, response];
            this.opportunityForm
              .get('associatedEntityControl')
              .setValue(response?.id);
          },
        },
        class: 'gray modal-lg',
      });
    }
    if (
      this.opportunityForm.value.entityTypeControl.toLowerCase() ===
      keywordConstants.Strategy.toLowerCase()
    ) {
      this.CustomModalFactory.invoke('manage-fund', {
        initialState: {
          isDDqCloseModel: true,
          fund_type: 'strategy',
          response: (response) => {
            this.strategy_list = [...this.strategy_list, response];
            this.opportunityForm
              .get('associatedEntityControl')
              .setValue(response?.id);
          },
        },
        class: 'gray modal-lg',
      });
    }
    if (
      this.opportunityForm.value.entityTypeControl.toLowerCase() ===
      keywordConstants.Vehicle.toLowerCase()
    ) {
      this.CustomModalFactory.invoke('manage-vehicle', {
        initialState: {
          isDDqCloseModel: true,
          response: (response: any) => {
            this.vehicle_list = [...this.vehicle_list, response];
            this.opportunityForm
              .get('associatedEntityControl')
              .setValue(response?.id);
          },
        },
        class: 'gray modal-lg',
      });
    }
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

  getSelectedOpportunity() {
    if (this.redirectId) {
      return this.defaultOpportunity;
    }
    return this.opportunities.find(
      (opportunity) =>
        opportunity.id === this.opportunityForm.value.opportunityNameControl
    );
  }

  getEntityType() {
    return this.opportunityForm.value.entityTypeControl === 'Product'
      ? keywordConstants.Product
      : this.opportunityForm.value.entityTypeControl;
  }

  onEntitySelection(event) {
    if (event !== 'Firm') {
      this.entityText = `Associated ${event == 'Fund' ? 'Product' : event}`;
      this.entityPlaceholder = `-- Select Associated ${
        event == 'Fund' ? 'Product' : event
      } --`;
      this.opportunityForm
        .get('associatedEntityControl')
        .setValidators(Validators.required);
    } else {
      this.opportunityForm.get('associatedEntityControl').clearValidators();
    }
    this.opportunityForm.get('associatedEntityControl').setValue(null);
  }

  getSelectedEntityName() {
    const selectedEntityType = this.getEntityType();
    const entityId = this.opportunityForm.value.associatedEntityControl;
    if (selectedEntityType === 'Product') {
      return this.fund_list.find((fund) => fund.id === entityId).name;
    } else if (selectedEntityType === 'Strategy') {
      return this.strategy_list.find((strategy) => strategy.id === entityId)
        .name;
    } else if (selectedEntityType === 'Vehicle') {
      return this.vehicle_list.find((vehicle) => vehicle.id === entityId).name;
    }
  }

  handleDateValidation() {
    this.dueDateError = moment(
      this.opportunityForm.get('asOfDateControl').value
    ).isAfter(this.opportunityForm.get('dueDateControl').value, 'day');
  }

  handleAsOfDate(date) {
    this.opportunityForm.patchValue({
      asOfDateControl: date,
    });
    this.handleDateValidation();
  }

  handleDueDate(date) {
    this.opportunityForm.patchValue({
      dueDateControl: date,
    });
    this.handleDateValidation();
  }
}
