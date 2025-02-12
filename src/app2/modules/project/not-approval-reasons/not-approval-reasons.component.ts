import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { RouterService } from 'src/app2/services/router.service';
import { Select } from '@ngxs/store';
import { finalize, take } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';
@Component({
  selector: 'app-not-approval-reasons',
  templateUrl: './not-approval-reasons.component.html',
  styleUrls: ['./not-approval-reasons.component.css'],
})
export class NotApprovalReasonsComponent implements OnInit {
  diligenceId: number;
  diligence: any;
  dataIsLoaded: boolean;
  note: any;
  reasons: Array<any>;
  investment_reasons: Array<any>;
  business_reasons: Array<any>;
  saving: boolean;
  @Select(UserState.getCurrentUserData) user;
  current_user: any;

  constructor(
    private readonly route: RouterService,
    private readonly projectSummaryService: ProjectSummaryService,
    private readonly http: HttpClient,
    private readonly toaster: ToastrService,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.diligenceId = parseInt(this.route.getState().params.diligenceId);
    this.user.pipe(take(1))
      .subscribe((data) => {
        if (data) {
          this.current_user = data;
          this.getCurrentDiligence();
          this.getReasons();
        }
      });
  }

  getCurrentDiligence() {
    this.projectSummaryService
      .getCurrentDiligence(this.diligenceId, this.current_user)
      .subscribe((diligence: any) => {
        this.diligence = diligence;
        if (this.diligence.status !== 'NotApproved') {
          this.route.navigateAngular('questionnaire', {
            relativeTo: this.activatedRoute.parent,
          });
        }
      });
  }

  getReasons() {
    const params = {
      entity_type: 'DueDiligence',
      entity_id: this.diligenceId,
      type: 'NotApproved',
    };
    this.http.get('notes', { params: params }).subscribe((response: any) => {
      if (response.length) {
        this.initReadOnlyMode(response);
      } else {
        this.initReadWriteMode();
      }
    });
  }

  initReadOnlyMode(notes) {
    this.dataIsLoaded = true;
    this.note = notes[0];
    this.reasons = this.note.text.split(',');
  }

  initReadWriteMode() {
    const observables = [];
    observables.push(
      this.http.get('reasons', { params: { type: 'notapprove_investments' } })
    );
    observables.push(
      this.http.get('reasons', { params: { type: 'notapprove_business' } })
    );

    forkJoin(observables).subscribe((responses: Array<any>) => {
      this.investment_reasons = responses[0];
      this.business_reasons = responses[1];
      this.dataIsLoaded = true;
    });
  }

  submit() {
    const investment_reasons = this.investment_reasons.filter(
      (x) => x.selected
    );
    const business_reasons = this.business_reasons.filter((x) => x.selected);
    const reasons = [...investment_reasons, ...business_reasons];

    const params: any = {};
    params.type = 'NotApproved';
    params.text = reasons.map((x) => x.value).join(',');
    params.entity_id = this.diligenceId;
    params.entity_type = 'DueDiligence';
    params.type = 'NotApproved';
    this.saving = true;

    this.http
      .post('notes', params)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(() => {
        const message = 'Your feedback has been recorded!';
        this.toaster.success(message);
        this.route.navigateWithParams('app.diligence.projects.activity', {
          type: 'closed',
        });
      });
  }

  redirectToSummary() {
    this.route.navigateToRelativeRoute('summary', this.activatedRoute);
  }
}
