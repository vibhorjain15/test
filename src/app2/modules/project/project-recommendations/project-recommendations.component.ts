import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { take } from 'rxjs/operators';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { RouterService } from 'src/app2/services/router.service';
import { IssueType } from 'src/app2/shared/constants/constant';
import { UserState } from 'src/app2/store/user/user.state';

@Component({
  selector: 'project-recommendations',
  templateUrl: './project-recommendations.component.html',
  styleUrls: ['./project-recommendations.component.css'],
})
export class ProjectRecommendationsComponent implements OnInit {
  diligenceId: number;
  entity_type = IssueType.Project;
  diligence: any;
  note_count: number;
  grouped_notes: any;
  tinyMceInit: { menubar: boolean; statusbar: boolean; toolbar: string };
  @Select(UserState.getCurrentUserData) user;
  current_user: any;
  constructor(
    private readonly route: RouterService,
    private readonly projectSummaryService: ProjectSummaryService,
  ) {}

  ngOnInit(): void {
    this.diligenceId = parseInt(this.route.getState().params.diligenceId);
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.getCurrentDiligence();
        }
      });
  }
  getCurrentDiligence() {
    this.projectSummaryService
      .getCurrentDiligence(this.diligenceId, this.current_user)
      .subscribe((diligence: any) => {
        this.diligence = diligence;
      });
  }
}

