import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ManageAumService } from 'src/app2/services/manage-aum.service';
import { errorMessageMap } from '../../constants/constant';
import { DvValidators } from '../../validators/no-white-space.validator';

@Component({
  selector: 'app-manage-aum',
  templateUrl: './manage-aum.component.html',
  styleUrls: ['./manage-aum.component.css'],
})
export class ManageAumModal implements OnInit {
  loading: boolean;
  edit_mode: boolean;
  types: { label: string; value: string }[];
  currencies: any;
  periods: any[];
  aumForm: FormGroup;
  @Input() table: any;
  @Input() entity_id: number;
  @Input() entity_type: string;
  errorMessageMap = errorMessageMap;

  constructor(
    private readonly http: HttpClient,
    private readonly manageAumService: ManageAumService
  ) {}

  ngOnInit(): void {
    this.types = [
      { label: 'AUM', value: 'aum' },
      { label: 'Track Record', value: 'track_record' },
    ];
    this.periods = [
      { id: 'Monthly', name: 'Monthly' },
      { id: 'Quarterly', name: 'Quarterly' },
    ];

    this.createAumForm();
    this.getCurrencies();
    if (this.table) {
      this.edit_mode = true;
    }
  }

  getCurrencies() {
    this.http.get('currency').subscribe((response: any) => {
      this.currencies = response;
      if (this.table && this.table.currency_id) {
        this.aumForm.get('currency_id').patchValue(this.table.currency_id);
      }
    });
  }

  createAumForm() {
    this.aumForm = new FormGroup({
      name: new FormControl(
        this.table ? this.table.name : '',
        DvValidators.required
      ),
      period: new FormControl(
        this.table ? this.table.period : this.periods[0].id,
        Validators.required
      ),
      type: new FormControl(
        this.table ? this.table.type : this.types[0].value,
        Validators.required
      ),
      currency_id: new FormControl(null, Validators.required),
      profile_type: new FormControl(
        this.table && this.table.profile_type
          ? this.table.profile_type
          : 'Gross',
        Validators.required
      ),
      entity_id: new FormControl(this.entity_id, Validators.required),
      entity_type: new FormControl(this.entity_type, Validators.required),
    });
  }

  onRadioClick(selection: string) {
    this.aumForm.get('profile_type').patchValue(selection);
  }

  submit(modalCallback) {
    if (!this.aumForm.valid) {
      this.aumForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const formObj: any = this.aumForm.value;
    if (this.table) {
      formObj.id = this.table.id;
    }
    formObj.is_active = 1;

    if (this.edit_mode) {
      this.manageAumService.updateTable(formObj, (error: boolean) => {
        if (error) {
          this.loading = false;
          return;
        }
        this.successCallback(modalCallback);
      });
    } else {
      this.manageAumService.createTable(formObj, (error: boolean) => {
        if (error) {
          this.loading = false;
          return;
        }
        this.successCallback(modalCallback);
      });
    }
  }

  successCallback(modalCallback) {
    this.loading = false;
    modalCallback();
  }
}
