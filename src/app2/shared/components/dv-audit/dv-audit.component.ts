import { HttpClient } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';

@Component({
  selector: 'app-dv-audit',
  templateUrl: './dv-audit.component.html',
  styleUrls: ['./dv-audit.component.css'],
})
export class DvAuditComponent implements OnInit, OnDestroy {
  @Input() diligence: any;
  audit: any;
  subscription: Subscription;
  constructor(
    private readonly http: HttpClient,
    private readonly projectSummaryService: ProjectSummaryService
  ) {}

  ngOnInit(): void {
    this.getAudit();
    this.subscribeToLoadLatestAudit();
  }

  getAudit() {
    this.http
      .get('audit', { params: { entity_id: this.diligence.id } })
      .subscribe((response: any) => {
        this.audit = response;
      });
  }

  subscribeToLoadLatestAudit() {
    this.subscription = this.projectSummaryService.loadLatestAudit$.subscribe(
      () => {
        this.getAudit();
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
