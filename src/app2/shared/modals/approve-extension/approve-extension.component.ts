import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { DueDiligenceDataService } from 'src/app2/services/duediligence-data-service';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { ModalComponent } from '../../components/modal/modal.component';
import { errorMessageMap, Regex } from '../../constants/constant';

@Component({
  selector: 'app-approve-extension',
  templateUrl: './approve-extension.component.html',
  styleUrls: ['./approve-extension.component.css'],
})
export class ApproveExtensionModal implements OnInit {
  loading: boolean;
  @Input() diligence: any;
  dueDateDetails: any;
  dueDateExtensionId: any;
  isRejectDueDatePanelOpen: boolean;
  isExtendDueDatePanelOpen: boolean;
  minDate: Date;
  errorMessageMap = errorMessageMap;
  extensionApprovedForm: FormGroup;
  extensionDeclinedForm: FormGroup;
  extending: boolean;
  rejecting: boolean;
  @ViewChild('extensionApprovalModal') extensionApprovalModal: ModalComponent;

  constructor(
    private readonly http: HttpClient,
    private readonly dueDiligenceDataService: DueDiligenceDataService,
    private readonly toaster: ToastrService,
    private readonly projectSummaryService: ProjectSummaryService
  ) {}

  ngOnInit(): void {
    this.minDate = new Date();
    this.getExtendedDueDate();
    this.initializeForms();
  }

  initializeForms() {
    this.extensionApprovedForm = new FormGroup({
      newDueDate: new FormControl('', [Validators.required]),
    });

    this.extensionDeclinedForm = new FormGroup({
      reason: new FormControl('', [
        Validators.required,
        Validators.maxLength(150),
        Validators.pattern(Regex.avoidFirstSplCharacter),
      ]),
    });
  }

  getExtendedDueDate() {
    const params = {
      dueDiligence_id: this.diligence.id,
    };
    this.http
      .get('dd_dueDate_extensions', { params: params })
      .subscribe((response: any) => {
        if (response.results.length) {
          this.dueDateDetails = response.results[0];
          this.dueDateExtensionId = response.results[0].id;
        }
      });
  }

  setDateValue(date: Date) {
    this.extensionApprovedForm.get('newDueDate').patchValue(date);
  }

  showRejectDueDatePanel() {
    this.isRejectDueDatePanelOpen = true;
    this.isExtendDueDatePanelOpen = false;
    this.extensionDeclinedForm.get('reason').patchValue(null);
  }

  showExtendDueDatePanel() {
    this.isExtendDueDatePanelOpen = true;
    this.isRejectDueDatePanelOpen = false;
    this.extensionApprovedForm.get('newDueDate').patchValue(null);
  }

  acceptExtendedDueDate() {
    this.isExtendDueDatePanelOpen = false;
    this.isRejectDueDatePanelOpen = false;
    this.extending = true;
    this.toaster.info('Accepting extension of due date...');
    this.dueDiligenceDataService
      .updateDueDate(this.dueDateExtensionId, { status: 'ExtensionApproved' })
      .subscribe((response: any) => {
        this.toaster.success('Accepted extension of due date');
        this.triggerEventsAndCloseModal();
      });
  }

  rejectDueDateExtension() {
    if (!this.extensionDeclinedForm.valid) {
      this.extensionDeclinedForm.markAllAsTouched();
      return;
    }
    this.rejecting = true;
    this.toaster.info('Rejecting extension of due date...');
    this.dueDiligenceDataService
      .updateDueDate(this.dueDateExtensionId, {
        status: 'ExtensionDeclined',
        action_reason: this.extensionDeclinedForm.value.reason,
      })
      .subscribe(() => {
        this.rejecting = false;
        this.toaster.success('Rejected extension of due date');
        this.triggerEventsAndCloseModal();
      });
  }

  extendDueDateExtension() {
    if (!this.extensionApprovedForm.valid) {
      this.extensionApprovedForm.markAllAsTouched();
      return;
    }
    this.toaster.info('Providing new extended due date...');
    this.dueDiligenceDataService
      .updateDueDate(this.dueDateExtensionId, {
        status: 'ExtensionDeclined',
        action_reason: 'Investor-Rejected',
      })
      .subscribe(() => {
        this.dueDiligenceDataService
          .extendDueDate({
            dueDiligence_id: this.diligence.id,
            requested_at: moment(
              this.extensionApprovedForm.value.newDueDate
            ).format('M-D-YYYY'),
            reason: null,
            status: 'ExtensionApproved',
          })
          .subscribe((response: any) => {
            this.toaster.success('Provided new due date');
            this.triggerEventsAndCloseModal();
          });
      });
  }

  triggerEventsAndCloseModal() {
    this.projectSummaryService.loadLatestAuditTrigger();
    this.projectSummaryService.loadLatestDiligenceTrigger();
    this.extensionApprovalModal.closeModal();
  }

  submit(modalCallback) {}
}
