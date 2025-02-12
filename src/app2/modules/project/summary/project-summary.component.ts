import { Component, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-project-summary',
  templateUrl: './project-summary.component.html',
  styleUrls: ['./project-summary.component.css'],
})
export class ProjectSummaryComponent implements OnInit {
  is_investor: boolean;
  @Select(UserState.getCurrentUserData) user;

  constructor(
    private activateRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.is_investor = data.isInvestor;
        }
      });
  }

  navigateToPendingReview(isReviewerAssigned: boolean) {
    if (!isReviewerAssigned) return;

    this.router.navigate(['../questionnaire'], {
      relativeTo: this.activateRoute,
      queryParams: {
        status: 'TotalReviewPending',
      },
    });
  }
}
