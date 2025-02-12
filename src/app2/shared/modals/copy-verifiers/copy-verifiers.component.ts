import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { DueDiligenceDataService } from 'src/app2/services/duediligence-data-service';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  diligenceStatusConstant,
  keywordConstants,
} from '../../constants/constant';
import { Select, Store } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import {
  GetTeamMembers,
} from 'src/app2/store/user/user.action';
@Component({
  selector: 'app-copy-verifiers',
  templateUrl: './copy-verifiers.component.html',
  styleUrls: ['./copy-verifiers.component.css'],
})
export class CopyVerifiersModal implements OnInit {
  @Input() diligence: any;
  loading: boolean;
  review_started: boolean;
  minDate: Date;
  assignForm: FormGroup;
  assigned_to_user: any;
  maxDate: Date;
  is_investor: boolean;
  is_manager: boolean;
  current_user: any;
  diligences: any[] = new Array<any>();
  tabType: string;
  diligenceFilters: { label: string; value: string }[];
  entity_types: { name: string; value: string }[];
  diligenceStatusConstant = diligenceStatusConstant;
  functions: any;
  keywordConstants = keywordConstants;
  teamMembers: any;
  copyForm: FormGroup;
  diligencesBackup: any[] = new Array<any>();
  firms: any[] = new Array<any>();
  funds: any[] = new Array<any>();
  vehicles: any[] = new Array<any>();
  strategies: any[] = new Array<any>();
  firm_pref: any;
  customDateFilter: any;
  pref_loading: boolean;
  loading_verifiers: boolean;
  verifiersForProject: any[];
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @Select(UserState.getTeamMembersData) teamMembers$;
  constructor(
    private readonly Utils: UtilsService,
    private readonly projectSummaryService: ProjectSummaryService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient,
    private readonly dueDiligenceDataService: DueDiligenceDataService,
    private readonly store: Store
  ) {}

  ngOnInit(): void {
    this.minDate = moment().subtract(5, 'years').toDate();
    this.maxDate = new Date();
    this.tabType = 'assign_verifier';
    this.getTeamMembers();
    this.getMyFunctions();
    this.diligenceFilters = [
      {
        label: 'All Questions',
        value: 'all',
      },
      {
        label: 'Only Mandatory Questions',
        value: 'mandatory',
      },
    ];
    if (
      this.diligence.status ===
        this.diligenceStatusConstant.PRECOMPLETIONREVIEW ||
      this.diligence.status ===
        this.diligenceStatusConstant.POSTCOMPLETIONREVIEW ||
      (this.is_manager && this.diligence.alwaysOpen)
    ) {
      this.review_started = true;
    } else {
      this.review_started = false;
    }

    this.entity_types = [
      { name: 'Product', value: 'Fund' },
      { name: 'Firm', value: 'Firm' },
      { name: 'Vehicle', value: 'Vehicle' },
      { name: 'Strategy', value: 'Strategy' },
    ];
    if (this.is_manager) {
      this.entity_types = [
        { name: 'Product', value: 'Fund' },
        { name: 'My Firm', value: 'Myfirm' },
        { name: 'Vehicle', value: 'Vehicle' },
        { name: 'Strategy', value: 'Strategy' },
      ];
    }
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.is_investor = data.isInvestor;
          this.is_manager = data.isManager;
          this.createForms();
        }
      });
  }

  createForms() {
    this.assignForm = new FormGroup({
      due_date: new FormControl(moment().add(3, 'days').toDate()),
      selected_filter: new FormControl(this.diligenceFilters[0].value),
    });

    this.copyForm = new FormGroup({
      source_diligence: new FormControl(''),
      entity_type: new FormControl(''),
      entity_id: new FormControl(''),
    });

    if (this.review_started) {
      this.assignForm.get('due_date').setValidators(Validators.required);
      this.assignForm.get('selected_filter').setValidators(Validators.required);
      this.copyForm.get('source_diligence').setValidators(Validators.required);
      this.copyForm.get('entity_id').setValidators(Validators.required);
    }
  }

  getTeamMembers() {
    this.teamMembers$
      .pipe(
        take(2),
        tap((userData) => {
          if (!userData) {
            this.store.dispatch(new GetTeamMembers());
          }
        })
      )
      .subscribe((teamMembers) => {
        if (teamMembers)
          this.teamMembers = teamMembers.map((teamMember) => ({
            ...teamMember,
            fullname: `${teamMember.firstName} ${teamMember.lastName}`,
          }));
      });
  }

  getMyFunctions() {
    let params: { entity_type: any; entity_id: any };
    if (this.diligence.entity_type === 'Review') {
      params = {
        entity_type: this.keywordConstants.Project,
        entity_id: this.diligence.id,
      };
    } else {
      params = {
        entity_type: this.diligence.entity_type,
        entity_id: this.diligence.entity_id,
      };
    }
    this.projectSummaryService
      .getMyFunctions(params)
      .subscribe((response: any) => {
        this.functions = response;
      });
  }

  setDateValue(date) {
    this.assignForm.get('due_date').patchValue(date);
  }

  actionChanged(selection) {
    this.assigned_to_user = selection;
  }

  setTabType(type: any) {
    this.tabType = type;
    if (this.tabType === 'assign_verifier') {
      this.getTeamMembers();
    } else {
      this.getFirmPref();
      this.getDiligences();
    }
  }

  getFirmPref() {
    if (!this.firm_pref) {
      this.pref_loading = true;
      this.firmPref.pipe(take(2)).subscribe((response) => {
        if (response) {
          this.firm_pref = response;
          this.customDateFilter = this.Utils.getPredefinedDateRanges(
            response.default_daterange_months
          );
          this.customDateFilter.selectedRange = 'No Filter';
          // this.Utils.getDateRanges()[response.default_daterange_months].label;
          if (this.customDateFilter.selectedRange === 'No Filter') {
            this.customDateFilter.startDate = null;
            this.customDateFilter.endDate = null;
          }
          if (
            this.is_manager &&
            this.diligence.entity_type === this.keywordConstants.Firm
          ) {
            this.setEntityType(this.keywordConstants.MyFirm);
          } else {
            this.setEntityType(
              this.diligence.entity_type,
              this.diligence.entity_id
            );
          }
          this.pref_loading = false;
        }
      });
    }
  }

  onEntityTypeChanged() {
    this.setEntityType(this.copyForm.get('entity_type').value);
  }

  onEntityChanged() {
    this.filterDiligences();
  }

  getDiligences(start_date = null, end_date = null) {
    const params: any = {
      template_id: this.diligence.template_id,
      template_version: this.diligence.template_version,
      task_type:
        this.diligence.status === this.diligenceStatusConstant.COMPLETED ||
        this.diligence.status ===
          this.diligenceStatusConstant.POSTCOMPLETIONREVIEW
          ? 1701
          : 1702,
    };
    if (start_date) {
      params.start_date = start_date;
    }
    if (end_date) {
      params.end_date = end_date;
    }

    this.http
      .get('diligences', { params: params })
      .subscribe((response: any) => {
        this.diligencesBackup = response;
        if (this.diligencesBackup.length) {
          this.generateEntities();
          this.filterDiligences();
        } else {
          this.copyForm.get('entity_id').patchValue(null);
        }
      });
  }

  filterDiligences() {
    this.diligences = this.diligencesBackup.filter(
      (x) => x.entity_id === this.copyForm.get('entity_id').value
    );
  }

  generateEntities() {
    this.firms = [];
    this.funds = [];
    this.vehicles = [];
    this.strategies = [];
    this.diligencesBackup.forEach((diligence: any) => {
      switch (diligence.entity_type) {
        case this.keywordConstants.Product:
          this.funds.push({
            id: diligence.entity_id,
            type: diligence.entity_type,
            name: diligence.entity_name,
          });
          break;
        case this.keywordConstants.Firm:
          this.firms.push({
            id: diligence.entity_id,
            type: diligence.entity_type,
            name: diligence.entity_name,
          });
          break;
        case this.keywordConstants.Vehicle:
          this.vehicles.push({
            id: diligence.entity_id,
            type: diligence.entity_type,
            name: diligence.entity_name,
          });
          break;
        case this.keywordConstants.Strategy:
          this.strategies.push({
            id: diligence.entity_id,
            type: diligence.entity_type,
            name: diligence.entity_name,
          });
          break;
      }
    });
  }

  setEntityType(entity_type: string, entity_id: number = null) {
    let new_entity_type = entity_type;
    let new_entity_id = entity_id ?? null;
    this.diligences = [];
    this.copyForm.get('source_diligence').patchValue(null);
    this.copyForm.get('source_diligence').markAsUntouched();

    if (new_entity_type === this.keywordConstants.MyFirm) {
      new_entity_id = this.current_user.firmInfo.id;
    } else if (
      new_entity_type === this.keywordConstants.Product &&
      !new_entity_id
    ) {
      if (this.funds.length) {
        new_entity_id = this.funds[0].id;
      }
    } else if (
      new_entity_type === this.keywordConstants.Firm &&
      !new_entity_id
    ) {
      if (this.firms.length) {
        new_entity_id = this.firms[0].id;
      }
    } else if (
      new_entity_type === this.keywordConstants.Vehicle &&
      !new_entity_id
    ) {
      if (this.vehicles.length) {
        new_entity_id = this.vehicles[0].id;
      }
    } else if (
      new_entity_type === this.keywordConstants.Strategy &&
      !new_entity_id
    ) {
      if (this.strategies.length) {
        new_entity_id = this.strategies[0].id;
      }
    }
    this.copyForm.get('entity_type').patchValue(new_entity_type);
    this.copyForm.get('entity_id').patchValue(new_entity_id);
    this.filterDiligences();
  }

  getVerifiers() {
    this.verifiersForProject = [];
    if (this.copyForm.get('source_diligence').value) {
      this.loading_verifiers = true;
      const params = {
        task_type:
          this.diligence.status === this.diligenceStatusConstant.COMPLETED ||
          this.diligence.status ===
            this.diligenceStatusConstant.POSTCOMPLETIONREVIEW
            ? 1701
            : 1702,
      };
      this.http
        .get(
          `diligences/${
            this.copyForm.get('source_diligence').value.id
          }/reviewers`,
          { params: params }
        )
        .subscribe(
          (response: any) => {
            this.verifiersForProject = response;
            this.loading_verifiers = false;
          },
          (error: any) => {
            return (this.loading_verifiers = false);
          }
        );
    }
  }

  submit(modalCallback) {
    if (this.tabType === 'assign_verifier') {
      this.assignReviewer(modalCallback);
    } else {
      this.copyReviewer(modalCallback);
    }
  }

  copyReviewer(modalCallback: any) {
    if (!this.copyForm.valid) {
      this.copyForm.markAllAsTouched();
      return;
    }
    if (
      this.copyForm.get('source_diligence').value &&
      this.copyForm.get('source_diligence').value.id
    ) {
      this.loading = true;
      const params = {
        source_diligence_id: this.copyForm.get('source_diligence').value.id,
        diligence_id: this.diligence.id,
        task_type:
          this.diligence.status === this.diligenceStatusConstant.COMPLETED ||
          this.diligence.status ===
            this.diligenceStatusConstant.POSTCOMPLETIONREVIEW
            ? 1701
            : 1702,
      };
      this.http
        .post(`diligences/${this.diligence.id}/assign_reviewers`, params)
        .subscribe(
          (response: any) => {
            this.toaster.success('Reviewers copied');
            this.startReview(modalCallback);
          },
          (error: any) => {
            this.loading = false;
          }
        );
    } else {
      this.startReview(modalCallback);
    }
  }

  assignReviewer(modalCallback: any) {
    if (!this.assignForm.valid) {
      this.assignForm.markAllAsTouched();
      return;
    }
    if (this.review_started && !this.assigned_to_user) {
      this.toaster.error('Please assign to a user role/team member');
      return;
    }
    this.loading = true;
    if (this.assigned_to_user && this.assignForm.get('due_date').value) {
      const params: any = {
        diligence_id: this.diligence.id,
        task_type:
          this.diligence.status === this.diligenceStatusConstant.COMPLETED ||
          this.diligence.status ===
            this.diligenceStatusConstant.POSTCOMPLETIONREVIEW
            ? 1701
            : 1702,
        due_at: this.Utils.getToDateTimeFormatted(
          this.assignForm.get('due_date').value
        ),
        assignment_filter: this.assignForm.get('selected_filter').value,
      };
      if (this.assigned_to_user.type === 'function') {
        params.assigned_to_function_id = this.assigned_to_user.id;
      } else {
        params.assigned_to = this.assigned_to_user.id;
      }
      this.http
        .post(`diligences/${this.diligence.id}/assign_reviewer`, params)
        .subscribe(
          (response: any) => {
            this.toaster.success('Reviewer assigned');
            this.startReview(modalCallback);
          },
          (error: any) => {
            this.loading = false;
          }
        );
    } else {
      this.startReview(modalCallback);
    }
  }

  startReview(modalCallback) {
    if (!this.review_started) {
      let status: any;
      if (this.diligence.is_internal) {
        if (this.diligence.status === this.diligenceStatusConstant.COMPLETED) {
          status = this.diligenceStatusConstant.POSTCOMPLETIONREVIEW;
        } else {
          status = this.diligenceStatusConstant.PRECOMPLETIONREVIEW;
        }
      } else {
        if (this.current_user.firmInfo.id === this.diligence.fromfirm_id) {
          status = this.diligenceStatusConstant.POSTCOMPLETIONREVIEW;
        } else if (this.current_user.firmInfo.id === this.diligence.tofirm_id) {
          status = this.diligenceStatusConstant.PRECOMPLETIONREVIEW;
        }
      }

      this.dueDiligenceDataService
        .setStatus(this.diligence.id, status)
        .subscribe(
          (response: any) => {
            this.toaster.success('Verification Started');
            this.loading = false;
            this.projectSummaryService.loadLatestDiligenceTrigger();
          },
          (error: any) => {
            this.loading = false;
          }
        );
    } else {
      this.loading = false;
    }
    modalCallback();
  }
}
