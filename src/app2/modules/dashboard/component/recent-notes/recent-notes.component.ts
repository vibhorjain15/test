import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-recent-notes',
  templateUrl: './recent-notes.component.html',
})
export class RecentNotesComponent implements OnInit {
  @Input('dateRange') private dateRange;
  public dataSource: any = [];
  isLoading = false;
  constructor(
    private readonly router: RouterService,
    private readonly toaster: ToastrService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.getDataSource(this.dateRange);
  }

  getDataSource(dateRange) {
    let self = this;
    // self.toaster.info('Please wait...');
    self.isLoading = true;
    let url =
      dateRange && dateRange.startDate
        ? `notes/history?entity_id=0&entity_type=Firm&start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
        : `notes/history?entity_id=0&entity_type=Firm`;
    try {
      self.toaster.clear();
      self.http.get(url).subscribe(
        (response: any) => {
          self.toaster.clear();
          self.dataSource = response;
          self.isLoading = false;
        },
        (error: any) => {
          self.toaster.clear();
        }
      );
    } catch (error) {
      self.toaster.clear();
    }
  }

  redirectToDetail(note) {
    this.redirectToEntityPage(note.entity_type, note.entity_id);
  }

  redirectToEntityPage(entity_type, entity_id) {
    switch (entity_type) {
      case 'Duediligence':
        this.router.navigateWithParams('app.diligence.project.notes', {
          diligenceId: entity_id,
        });
        break;
      case 'Fund':
        this.router.navigateWithParams('app.funds.profile.monitor', {
          fundId: entity_id,
        });
        break;
      case 'Strategy':
        this.router.navigateWithParams('app.strategies.profile.monitor', {
          strategyId: entity_id,
        });
        break;
      case 'Firm':
        this.router.navigateWithParams('app.firms.profile.monitor', {
          firmId: entity_id,
        });
        break;
      case 'User':
        this.router.navigateWithParams('app.contacts', {
          Id: entity_id,
        });
        break;
      case 'Workflow':
        this.router.navigateWithParams(
          'app.workflow_automation.detail.detail',
          {
            Id: entity_id,
          }
        );
        break;
      case 'Attachment':
        this.router.navigateWithParams('app.content.document.detail', {
          documentId: entity_id,
        });
        break;
      case 'FormADV':
        this.router.navigateWithParams('app.form_adv.firm.filings_history', {
          firmCRD: entity_id,
        });
        break;
      case 'Meeting':
        this.router.navigateWithParams('app.monitor.meetings.detail', {
          Id: entity_id,
        });
        break;
      case 'Vehicle':
        this.router.navigateWithParams('app.vehicles.profile.monitor', {
          vehicleId: entity_id,
        });
        break;
    }
  }
}
