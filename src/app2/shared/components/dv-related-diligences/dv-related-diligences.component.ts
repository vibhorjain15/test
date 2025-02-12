import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { RouterService } from 'src/app2/services/router.service';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';

@Component({
  selector: 'app-dv-related-diligences',
  templateUrl: './dv-related-diligences.component.html',
  styleUrls: ['./dv-related-diligences.component.css'],
})
export class DvRelatedDiligencesComponent implements OnInit {
  @Input() diligences: Array<any> = [];
  @Input() isModal: boolean = false;
  @Input() isInvestor: boolean;
  @Output() refreshLinkedProjects = new EventEmitter();
  selectedDiligenceRecords: Array<any> = [];
  show_bulk_actions: boolean;

  constructor(
    private readonly route: RouterService,
    private readonly SweetAlert: SweetAlertService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService
  ) {}

  ngOnInit(): void {}

  diligenceSelectionChanged(diligence: any) {
    if (diligence.isSelected) {
      this.selectedDiligenceRecords.push(diligence);
    } else {
      const index = this.selectedDiligenceRecords.findIndex(
        (x) => x.id === diligence.id
      );
      this.selectedDiligenceRecords.splice(index, 1);
    }
  }

  confirmBulkAction(action: any) {
    const custom_class = 'danger';
    const confirm_button_text = 'Withdraw';
    this.SweetAlert.confirm({
      title: `Are you sure you want to ${action} the selected  projects?`,
      customClass: custom_class,
      confirmButtonText: confirm_button_text,
      showLoaderOnConfirm: true,
      preConfirm: () => {
        return new Promise<void>((resolve) => {
          this.performBulkActions(resolve);
        });
      },
    });
  }

  performBulkActions(resolve) {
    const request_payload: any = {};
    const withdrawn_diligences = [];

    this.selectedDiligenceRecords.forEach((item: any) => {
      if (item.status === 'Sent' || item.status === 'Started') {
        withdrawn_diligences.push(item.id);
      }
    });
    if (withdrawn_diligences.length) {
      let toaster_message: string;
      request_payload.entity_ids = withdrawn_diligences;
      request_payload.status = 'Withdrawn';
      if (
        withdrawn_diligences.length === this.selectedDiligenceRecords.length
      ) {
        if (withdrawn_diligences.length === 1) {
          toaster_message =
            'Selected ' +
            withdrawn_diligences.length +
            ' project is  withdrawn';
        } else {
          toaster_message =
            'Selected ' +
            withdrawn_diligences.length +
            ' projects are withdrawn';
        }
      } else {
        toaster_message =
          withdrawn_diligences.length +
          ' out of ' +
          this.selectedDiligenceRecords.length +
          ' project(s) withdrawn';
      }
      const headers = new HttpHeaders().set(
        'diligence-status',
        request_payload.status.toLowerCase()
      );
      this.http
        .put('v2/diligences/bulk_actions', request_payload, {
          headers: headers,
        })
        .pipe(finalize(() => resolve()))
        .subscribe((response: any) => {
          this.toaster.success(toaster_message);
          this.refreshLinkedProjects.emit();
        });
    } else {
      this.toaster.error(
        'No projects available for submission in the selection'
      );
      this.show_bulk_actions = false;
    }
  }

  redirectToProject(url: string, params) {
    this.route.navigateWithParams(url, params);
  }
}
