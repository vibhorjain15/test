import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecommendationTrackerService } from 'src/app2/apis/recommendationTracker.service';
import { RouterService } from 'src/app2/services/router.service';

@Component({
  selector: 'app-project-stats',
  templateUrl: './project-stats.component.html',
  styleUrls: ['./project-stats.component.css'],
})
export class ProjectStatsComponent implements OnInit {
  @Input() diligence: any;
  @Input() issueTrackerDefaultName: string;
  followups_count: number = 0;
  notes_count: number = 0;
  todos: any;
  attachments_count: number = 0;
  recommendationCounts: any;
  constructor(
    private http: HttpClient,
    private readonly recommendationTrackerService: RecommendationTrackerService
  ) {}

  ngOnInit(): void {
    this.getProjectStats();
  }

  getProjectStats() {
    this.followups_count = this.diligence.open_followups_count;
    this.http
      .get(`notes/count`, {
        params: { entity_type: 'Duediligence', entity_id: this.diligence.id },
      })
      .subscribe((response: any) => (this.notes_count = response.count));
    this.http
      .get(`todos/count`, {
        params: { entity_id: this.diligence.id },
      })
      .subscribe((response: any) => (this.todos = response));
    this.http
      .get(`attachmentassignments/count`, {
        params: { entity_type: 'Duediligence', entity_id: this.diligence.id },
      })
      .subscribe((response: any) => (this.attachments_count = response.count));
    this.recommendationTrackerService
      .getIssueCounts({
        entity_id: this.diligence.id,
        entity_type: 'Duediligence',
      })
      .subscribe((response: any) => (this.recommendationCounts = response));
  }
}
