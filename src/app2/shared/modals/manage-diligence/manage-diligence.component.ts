import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  DiligenceTypeEnum,
  errorMessageMap,
  Regex,
} from '../../constants/constant';
import { DvValidators, noHtmlValidator } from 'src/app2/shared/validators/no-white-space.validator';
@Component({
  selector: 'app-manage-diligence',
  templateUrl: './manage-diligence.component.html',
  styleUrls: ['./manage-diligence.component.css'],
})
export class ManageDiligenceModal implements OnInit {
  loading: boolean;
  @Input() diligence: any;
  diligenceForm: FormGroup;
  maxAsOfDate: Date;
  minDate: Date;
  errorMessageMap = errorMessageMap;
  dueDateError: boolean = false;
  isPreapproved = false;
  constructor(
    private readonly Utils: UtilsService,
    private readonly toaster: ToastrService,
    private readonly projectSummaryService: ProjectSummaryService,
  ) {}

  ngOnInit(): void {
    this.isPreapproved =
      this.diligence.diligence_type == DiligenceTypeEnum.dd_profile;
    this.maxAsOfDate = this.Utils.getMaxAsOfDateDiligence();
    this.minDate = new Date();

    this.diligenceForm = new FormGroup({
      name: new FormControl(this.diligence.name, [
        DvValidators.required,
        Validators.required,
        Validators.pattern(Regex.avoidFirstSplCharacter),
        noHtmlValidator
      ]),
      due_at: new FormControl(
        this.diligence.due_at ? moment(this.diligence.due_at).toDate() : null,
        Validators.required
      ),
      as_of_date: new FormControl(
        this.diligence.as_of_date
          ? moment(this.diligence.as_of_date).toDate()
          : null,
        Validators.required
      ),
    });
    if (this.isPreapproved) this.diligenceForm.get('due_at').clearValidators();
  }
  handleDateValidation() {
    this.dueDateError = moment(
      this.diligenceForm.get('as_of_date').value
    ).isAfter(this.diligenceForm.get('due_at').value, 'day');
  }

  setDateValue(control: string, date: Date) {
    this.diligenceForm.get(control).patchValue(date);
    this.handleDateValidation();
  }

  submit(modalCallback) {
    if (!this.diligenceForm.valid) {
      this.diligenceForm.markAllAsTouched();
      return;
    }
    if (!this.isPreapproved && this.dueDateError) return;
    this.loading = true;
    const formValue = this.diligenceForm.value;
    const payload: any = { ...this.diligence };
    payload.name = formValue.name;
    if (!this.isPreapproved)
      payload.due_at = moment(formValue.due_at).format('YYYY-MM-DD');
    payload.as_of_date = moment(formValue.as_of_date).format('YYYY-MM-DD');
    this.projectSummaryService
      .updateData(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe((response: any) => {
        if (response) {
          this.projectSummaryService.loadLatestAuditTrigger();
          this.projectSummaryService.loadLatestDiligenceTrigger();
          this.loading = false;
          const message = 'Diligence project updated';
          this.toaster.success(message);
          modalCallback();
        }
      });
  }
}
