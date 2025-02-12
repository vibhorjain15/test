import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';

import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { RouterService } from 'src/app2/services/router.service';
import {
  DownloadMedium,
  ErrorStatusCode,
  ResponseSource,
  diligenceStatusConstant,
  reviewStatusMap,
} from 'src/app2/shared/constants/constant';
import { ReviewHistory } from 'src/app2/shared/models/responseHistory.model';
import { UserState } from 'src/app2/store/user/user.state';
import { CurrentUserModel } from 'src/app2/store/user/user.model';
import { DatePipe } from '@angular/common';
import { ReviewType } from '../../questionnaire/constants/question-status.constant';
import { GridDataType } from '../../questionnaire/types/grid.type';
import { responseType } from '../../template-builder/constants/responseType.constant';
import { CacheUtil } from '../../questionnaire/service/cache.service';
import { QuestionnaireService } from 'src/app2/apis/questionnaire/questionnaire.service';
import { take, tap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { ProjectsService } from 'src/app2/apis/projects/projects.service';
import { ActivatedRoute, Router } from '@angular/router';
import { diligenceTagMapper } from '../../questionnaire/constants/quick-view-headers.constant';
@Component({
  selector: 'app-response-history',
  templateUrl: './response-history.component.html',
  styleUrls: ['./response-history.component.css'],
})
export class ResponseHistoryComponent implements OnInit, OnDestroy {
  diligenceId: number;
  diligence: any;
  responses_count: number;
  grouped_responses: Array<any>;
  @Select(UserState.getCurrentUserData) user;
  current_user: CurrentUserModel;
  responseHistory: ReviewHistory[] = [];
  loading: boolean;
  teamMembers;
  reviewStatus = reviewStatusMap;
  downloading: boolean = false;
  diligenceConstants = diligenceStatusConstant;
  diligenceTagMapper = diligenceTagMapper;
  isFree: boolean;
  responseSource = ResponseSource;
  isEvaluation: boolean;
  gridData: GridDataType;
  @Select(UserState.getTeamMembersData) teamMembers$;
  @Select(UserState.getFirmPreferenceData) firmPref$;
  firmPref;
  indexObj = {};
  downloadMedium;
  teamSub;
  firmPrefSub;

  constructor(
    private readonly route: RouterService,
    private readonly projectSummaryService: ProjectSummaryService,
    private readonly toaster: ToastrService,
    public readonly datePipe: DatePipe,
    private cache: CacheUtil,
    private questionnaire: QuestionnaireService,
    private projectService: ProjectsService,
    private routeState: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.diligenceId = parseInt(this.route.getState().params.diligenceId);
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.teamSub = this.teamMembers$
          .pipe(take(2))
          .subscribe((teamMembers) => {
            this.teamMembers = teamMembers;
            this.current_user = data;
            this.isFree = this.current_user.isFreeSubscription;
            this.getCurrentDiligence();
          });
      }
    });

    this.firmPrefSub = this.firmPref$.pipe(take(2)).subscribe((data) => {
      this.firmPref = data;
      this.downloadMedium = data.doc_access_preference;
    });
  }

  toggleHistoryDetails(response, parentIndex) {
    response.showDetails = !response.showDetails;
    if (response.showDetails) {
      // set li element id and its corresponding index in the parent children list to show the correct revision index
      setTimeout(() => {
        const parent = document.getElementById(`${parentIndex}_parentDiv`);
        Array.from(parent.children).forEach((childElem, index) => {
          this.indexObj[childElem.id] = parent.children.length - index;
        });
      });
    }
  }

  getCurrentDiligence() {
    this.projectSummaryService
      .getCurrentDiligence(this.diligenceId, this.current_user)
      .subscribe((diligence: any) => {
        this.diligence = diligence;
        this.isEvaluation =
          this.diligence.status === diligenceStatusConstant.Evaluation;
        this.getResponseHistory();
      });
  }

  getResponseHistory() {
    this.projectService
      .fetchResponseHistory({
        type: this.isEvaluation ? ReviewType.Evaluation : ReviewType.InReview,
        diligenceId: this.diligenceId,
      })
      .subscribe(
        (responses: any) => {
          let grid = false;
          let gridObj = [];
          this.responseHistory = responses;
          const showFirmNameAsAuthor =
            this.current_user.isInvestor && !this.diligence.is_internal;

          this.responseHistory.forEach((response) => {
            response.created_by = showFirmNameAsAuthor
              ? this.diligence.managerfirm_name
              : this.teamMembers.find(
                  (teamMember) => teamMember.id === response.created_by
                )?.fullName;

            // latest followup audit will be clubbed with the main response if it is unsubmitted else it will be under details
            response.showFollowupLabel =
              this.current_user.isInvestor &&
              response.audits?.length &&
              response.audits[0].followup_id &&
              !response.is_submitted;

            if (response.review && response.review.completed_by)
              response.review.completed_by = this.teamMembers.find(
                (teamMember) => teamMember.id === response.review.completed_by
              )?.fullName;

            response.audits?.forEach((audit) => {
              audit.created_by = showFirmNameAsAuthor
                ? this.diligence.managerfirm_name
                : this.teamMembers.find(
                    (teamMember) => teamMember.id === audit.created_by
                  )?.fullName;

              if (audit.review && audit.review.completed_by)
                audit.review.completed_by = this.teamMembers.find(
                  (teamMember) => teamMember.id === audit.review.completed_by
                )?.fullName;
            });
            if (
              response.response_type === responseType.Grid ||
              response.response_type === responseType.DynamicGrid
            ) {
              gridObj.push(this.getGridStruct(response));
              grid = true;
            }
          });

          this.responseHistory = this.responseHistory
            .filter((history) => history.audits?.length)
            .sort((a, b) => a.sequence_id - b.sequence_id);

          forkJoin(gridObj).subscribe((data) => {
            this.loading = false;
          });
          if (!grid) this.loading = false;
        },
        (err) => (this.loading = false)
      );
  }

  redirectToQuestionnaire() {
    this.route.navigateToRelativeRoute('questionnaire', this.routeState);
  }

  handleSubSectionRoute(response) {
    this.route.navigateToRelativeRoute(
      `questionnaire/category/${response.parent_section_id}`,
      this.routeState,
      {
        fragment: `child_section_${response.section_id}`,
      }
    );
  }

  handleSectionRoute(response) {
    this.route.navigateToRelativeRoute(
      `questionnaire/category/${response.parent_section_id}`,
      this.routeState
    );
  }

  handleQuestionRoute(response) {
    this.route.navigateToRelativeRoute(
      `questionnaire/category/${response.parent_section_id}/question/${
        response.sequence_id + '-' + response.question_id
      }`,
      this.routeState,
      {
        fragment: `child_section_${response.section_id}`,
      }
    );
  }

  handleExport() {
    this.downloading = true;
    this.projectService
      .revisionExportToDoc({
        diligence_id: this.diligenceId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      .subscribe(
        (response: any) => {
          let message =
            "Once the document is ready for download, it will be accessible in the 'My Downloads' section.";
          if (this.downloadMedium == DownloadMedium.BOTH) {
            message =
              "Once the document is ready for download, it will be accessible in the 'My Downloads' section and in your inbox.";
          }
          this.toaster.success(
            message,
            `Export request received and is being processed`
          );
          this.downloading = false;
        },
        (err) => {
          this.downloading = false;
          if (
            !(
              err &&
              err.status &&
              Object.values(ErrorStatusCode).includes(err.status)
            )
          ) {
            this.toaster.error(
              '',
              'Something went wrong while downloading AUM/TR file. Please try again.',
              {
                timeOut: 1500,
              }
            );
          }
        }
      );
  }

  getGridStruct(response) {
    let expandedId = null;
    if (response.response_type === responseType.Grid)
      expandedId = `${response.sequence_id}-${response.section_id}-${response.question_id}`;
    else
      expandedId = `${response.sequence_id}-${response.section_id}-${response.question_id}-columnData`;
    if (expandedId in this.cache.GRIDCACHE) {
      this.loading = false;
    } else
      return this.questionnaire
        .getQuestionGridData(response.grid_id, response.grid_version, null)
        .pipe(
          tap((data) => {
            this.cache.GRIDCACHE[expandedId] = data;
          })
        );
  }

  getMetaData(history: any, prevHistory: any = null) {
    if (history.review?.completed_by) {
      if (history.review.assigned_to_function_name) {
        return (
          history.review.assigned_to_function_name +
          ' - ' +
          history.review.completed_by_name
        );
      } else {
        return history.review.completed_by_name;
      }
    } else if (history.review?.status === diligenceStatusConstant.InReview) {
      return history.review.assigned_by_name;
    } else if (
      history.review_status === diligenceStatusConstant.InReview &&
      !history.review &&
      history.audits?.length === 1 &&
      history.audits[0].review?.status === diligenceStatusConstant.InReview
    ) {
      // when you assign reviewers to any unchanged response, it was picking response created by so instead pick reviewer detail from first audit as the only audit is related to review since there are no response changes
      return history.audits[0].review.assigned_by_name;
    } else if (
      (this.current_user.isInvestor && history.is_submitted_by_investor) ||
      (this.current_user.isManager && prevHistory?.is_submitted_by_investor)
    ) {
      return;
    } else {
      return history.created_by;
    }
  }

  getDisplayDate(history: any) {
    if (history.review?.completed_by) {
      return history.review.completed_at;
    } else if (history.review?.status === diligenceStatusConstant.InReview) {
      return history.review.assigned_at;
    } else if (
      history.review_status === diligenceStatusConstant.InReview &&
      !history.review &&
      history.audits?.length === 1 &&
      history.audits[0].review?.status === diligenceStatusConstant.InReview
    ) {
      // when you assign reviewers to any unrevised response, it was picking response created at so instead pick reviewer detail from first audit as the only audit is related to review since there are no response changes
      return history.audits[0].review.assigned_at;
    } else {
      return history.created_at;
    }
  }

  ngOnDestroy(): void {
    this.teamSub?.unsubscribe();
    this.firmPrefSub?.unsubscribe();
  }
}
