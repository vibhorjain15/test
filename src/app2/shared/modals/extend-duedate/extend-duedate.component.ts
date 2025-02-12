import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { errorMessageMap, Regex } from 'src/app2/shared/constants/constant';
import { DueDiligenceDataService } from 'src/app2/services/duediligence-data-service';
import { ToastrService } from 'ngx-toastr';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { DvValidators } from 'src/app2/shared/validators/no-white-space.validator';
@Component({
  selector: 'app-extend-duedate',
  templateUrl: './extend-duedate.component.html',
  styleUrls: ['./extend-duedate.component.css'],
})
export class ExtendDueDateModal implements OnInit {
  loading: boolean;
  @Input() diligence: any;
  dueDateForm: FormGroup;
  minDate: Date;
  errorMessageMap = errorMessageMap;
  constructor(
    private readonly dueDiligenceDataService: DueDiligenceDataService,
    private readonly toaster: ToastrService,
    private readonly projectSummaryService: ProjectSummaryService
  ) {}

  ngOnInit(): void {
    this.minDate = new Date();
    this.dueDateForm = new FormGroup({
      reason: new FormControl('', [
        DvValidators.required,
        Validators.required,
        Validators.maxLength(150),
        Validators.pattern(Regex.avoidFirstSplCharacter),
      ]),
      extendedDueDate: new FormControl('', Validators.required),
    });
  }

  setDateValue(date: Date) {
    this.dueDateForm.get('extendedDueDate').patchValue(date);
  }

  submit(modalCallback) {
    if (!this.dueDateForm.valid) {
      this.dueDateForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const formValue = this.dueDateForm.value;
    const dueDateParams: any = {
      dueDiligence_id: this.diligence.id,
      requested_at: moment(formValue.extendedDueDate).format('M-D-YYYY'),
      reason: formValue.reason,
    };
    dueDateParams.status = this.diligence.is_internal
      ? 'ExtensionApproved'
      : 'ExtensionRequested';
    this.dueDiligenceDataService.extendDueDate(dueDateParams).subscribe(
      (response: any) => {
        if (this.diligence.is_internal) {
          this.toaster.success('Updated due date');
        } else {
          this.toaster.success('Requested due date extension');
        }
        this.projectSummaryService.loadLatestAuditTrigger();
        this.projectSummaryService.loadLatestDiligenceTrigger();
        this.loading = false;
        modalCallback();
      },
      (error: any) => {
        this.loading = false;
      }
    );
  }
}
