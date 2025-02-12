import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ColDef } from 'ag-grid-community';
import { AssignmentsService } from 'src/app2/services/assignments.service';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { RouterService } from 'src/app2/services/router.service';
import { SetDefaultColumnDef } from 'src/app2/store/grid/grid.action';
import { take } from 'rxjs/operators';
import { UserState } from 'src/app2/store/user/user.state';
import {
  DiligenceTypeEnum,
  diligenceStatusConstant,
} from 'src/app2/shared/constants/constant';
import { DiligenceType } from 'src/app2/apis/questionnaire/type/diligence.type';
import { UtilsService } from 'src/app2/services/utils.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-assignments',
  templateUrl: './assignments.component.html',
  styleUrls: ['./assignments.component.css'],
})
export class AssignmentsComponent implements OnInit {
  diligenceId: number;
  gridData: any;
  columnDefs: ColDef[];
  gridName: string = 'project-assignments';
  render_grid: boolean;
  diligence: DiligenceType;
  mode: 'Review' | 'Assignment' = 'Assignment';
  @Select(UserState.getCurrentUserData) user;
  current_user: any;
  reviewVisible: boolean;
  questionAssignmentVisible;
  constructor(
    private readonly route: RouterService,
    private readonly assignmentsService: AssignmentsService,
    private readonly store: Store,
    private readonly projectSummaryService: ProjectSummaryService,
    private readonly utils: UtilsService,
    private readonly activatedRoute: ActivatedRoute
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
        this.assignmentsService.updateData(this.diligence, this.current_user);
        // Question assignments are only visible to
        // 1. Manager
        // 2. Internal Projects
        this.questionAssignmentVisible =
          this.diligence.is_internal || !this.current_user.isInvestor;
        // Review assignments is visible in every status except started status
        this.reviewVisible =
          this.diligence.status !== diligenceStatusConstant.Started ||
          this.diligence.diligence_type === DiligenceTypeEnum.dd_profile;

        if (this.questionAssignmentVisible) this.mode = 'Assignment';
        else this.mode = 'Review';
        this.initGrid();
      });
  }

  initGrid() {
    this.render_grid = false;
    if (this.mode === 'Assignment') {
      this.columnDefs = this.assignmentsService.getAssignmentsColDef(
        this.activatedRoute
      );
      this.store.dispatch(
        new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
      );
      this.assignmentsService
        .getAssignments(this.diligenceId)
        .subscribe((response: Array<any>) => {
          response.forEach((x) => {
            x.question_text = this.utils.getSafeHtml(x.question_text);
            x.section_name = this.utils.getSafeHtml(x.section_name);
          });
          this.gridData = response.sort((a, b) =>
            b.fullName.localeCompare(a.fullName)
          );
          this.render_grid = true;
        });
    } else {
      this.columnDefs = this.assignmentsService.getReviewColDef(
        this.activatedRoute
      );
      this.store.dispatch(
        new SetDefaultColumnDef({ [this.gridName]: this.columnDefs })
      );
      this.assignmentsService
        .getReviewAssignments(this.diligenceId)
        .subscribe((response) => {
          response.forEach((x) => {
            x.question_text = this.utils.getSafeHtml(x.question_text);
            x.section_name = this.utils.getSafeHtml(x.section_name);
          });
          this.gridData = response
            .filter((res) => res.status !== 'UnAssigned')
            .sort((a: any, b: any) => {
              let date1 = new Date(a.due_date);
              let date2 = new Date(b.due_date);
              if (date1 < date2) return -1;
              if (date2 > date1) return 1;
              return 0;
            });
          this.render_grid = true;
        });
    }
  }

  setMode(mode) {
    this.mode = mode;
    this.initGrid();
  }
}
