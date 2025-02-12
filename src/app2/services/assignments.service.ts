import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { map } from 'rxjs/operators';
import {
  ResponseStatus,
  defaultColumn,
  diligenceStatusConstant,
  grid_widths_map,
  reviewStatusMap,
} from '../shared/constants/constant';
import { RouterService } from './router.service';
import { CurrentUserModel } from '../store/user/user.model';
import { DiligenceType } from '../apis/questionnaire/type/diligence.type';
import { ReviewType } from '../modules/questionnaire/constants/question-status.constant';
import { DvDatePipe } from '../shared/pipes/dv-date.pipe';
@Injectable({
  providedIn: 'root',
})
export class AssignmentsService {
  current_user: CurrentUserModel;
  diligence: DiligenceType;

  constructor(
    private http: HttpClient,
    private dvDatePipe: DvDatePipe,
    private router: RouterService
  ) {}

  updateData(diligence, user) {
    this.diligence = diligence;
    this.current_user = user;
  }

  getAssignmentsColDef(activatedRoute): ColDef[] {
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'fullName',
      headerName: 'Team Member / User Role',
      field: 'fullName',
      rowGroup: true,
      hide: true,
      minWidth: grid_widths_map.sm_column_xl,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by name',
      },
      suppressColumnsToolPanel: true,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'question_text',
      headerName: 'Question(s)',
      field: 'question_text',
      minWidth: grid_widths_map.lg_column_xl,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by question',
      },
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: true,
        checkbox: false,
        innerRenderer: (params) => {
          if (params.value)
            return `<a (click)="goToQuestion()">${params.value}</a>`;
        },
      },
      onCellClicked: (params) => {
        if (params.value) {
          if (params.node.group)
            this.redirectToQuestionSubcategory(
              params?.node?.childrenAfterGroup[0].data.parent_section_id,
              params?.node?.childrenAfterGroup[0]?.data.section_id,
              params?.node?.childrenAfterGroup[0]?.data.question_id,
              activatedRoute
            );
          else
            this.redirectToQuestionSubcategory(
              params?.data?.parent_section_id,
              params?.data?.section_id,
              params?.data?.question_id,
              activatedRoute
            );
        }
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'section_name',
      headerName: 'Sub-category',
      field: 'section_name',
      minWidth: grid_widths_map.sm_column_xl,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by sub-category',
      },
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: true,
        checkbox: false,
        innerRenderer: (params) => {
          if (params.value)
            return `<a (click)="goToQuestion()">${params.value}</a>`;
        },
      },
      onCellClicked: (params) => {
        if (params.value) {
          if (params.node.group)
            this.redirectToQuestionSubcategory(
              params?.node?.childrenAfterGroup[0].data.parent_section_id,
              params?.node?.childrenAfterGroup[0]?.data.section_id,
              null,
              activatedRoute
            );
          else
            this.redirectToQuestionSubcategory(
              params?.data?.parent_section_id,
              params?.data?.section_id,
              null,
              activatedRoute
            );
        }
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'status',
      headerName: 'Status',
      field: 'status',
      minWidth: grid_widths_map.sm_column_sm,
      cellRenderer: 'assignmentStatusRenderer',
    });
    return colDef;
  }

  getReviewColDef(activatedRoute): ColDef[] {
    let that = this;
    const colDef: ColDef[] = [];
    colDef.push({
      ...defaultColumn,
      colId: 'fullName',
      headerName: 'Reviewer',
      field: 'fullName',
      rowGroup: true,
      hide: true,
      minWidth: grid_widths_map.sm_column_xl,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by name',
      },
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: true,
        checkbox: false,
        innerRenderer: 'ReviewNameRenderer',
      },
      menuTabs: ['generalMenuTab'],
    });
    colDef.push({
      ...defaultColumn,
      colId: 'due_date',
      headerName: 'Due Date',
      field: 'due_date',
      cellRenderer: (params) => {
        const currDate = new Date();
        const dueDate = new Date(params.value);
        if (
          currDate >= dueDate &&
          params.data.status === ResponseStatus.INREVIEW
        )
          return `<span class="text-danger">${this.dvDatePipe.transform(
            params.value,
            ['isLocaleDate']
          )}</span>`;
        else return this.dvDatePipe.transform(params.value, ['isLocaleDate']);
      },
      minWidth: grid_widths_map.sm_column_sm,
    });

    colDef.push({
      ...defaultColumn,
      colId: 'status',
      headerName: 'Status',
      field: 'status',
      minWidth: grid_widths_map.sm_column_sm,
      cellRenderer: 'ReviewRenderer',
      cellRendererParams: {
        diligence: that.diligence,
      },
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by status',
      },
      filterParams: {
        textCustomComparator: function (filter, value, filterText) {
          return reviewStatusMap[
            value +
              (that.diligence.status === diligenceStatusConstant.Evaluation &&
              value === diligenceStatusConstant.ReviewFailed.toLowerCase()
                ? 'evaluation'
                : '')
          ]
            .toLowerCase()
            .includes(filterText.toLowerCase());
        },
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'description',
      headerName: 'Review/Evaluation Note',
      field: 'description',
      cellRenderer: 'descriptionCellRenderer',
      minWidth: grid_widths_map.sm_column_xl,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'question_text',
      headerName: 'Question(s)',
      field: 'question_text',
      menuTabs: ['generalMenuTab'],
      minWidth: grid_widths_map.lg_column_xl,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by question',
      },
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: true,
        checkbox: false,
        innerRenderer: (params) => {
          if (params.value)
            return `<a (click)="goToQuestion()">${params.value}</a>`;
        },
      },
      onCellClicked: (params) => {
        if (params.value) {
          if (params.node.group)
            this.redirectToQuestionSubcategory(
              params?.node?.childrenAfterGroup[0].data.parent_section_id,
              params?.node?.childrenAfterGroup[0]?.data.subcatId,
              params?.node?.childrenAfterGroup[0]?.data.question_id,
              activatedRoute
            );
          else
            this.redirectToQuestionSubcategory(
              params?.data?.parent_section_id,
              params?.data?.subcatId,
              params?.data?.question_id,
              activatedRoute
            );
        }
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'section_name',
      headerName: 'Sub-category',
      field: 'section_name',
      minWidth: grid_widths_map.sm_column_xl,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by sub-category',
      },
      menuTabs: ['generalMenuTab'],
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        suppressCount: true,
        checkbox: false,
        innerRenderer: (params) => {
          if (params.value)
            return `<a (click)="goToQuestion()">${params.value}</a>`;
        },
      },
      onCellClicked: (params) => {
        if (params.value) {
          if (params.node.group)
            this.redirectToQuestionSubcategory(
              params?.node?.childrenAfterGroup[0].data.parent_section_id,
              params?.node?.childrenAfterGroup[0]?.data.subcatId,
              null,
              activatedRoute
            );
          else
            this.redirectToQuestionSubcategory(
              params?.data?.parent_section_id,
              params?.data?.subcatId,
              null,
              activatedRoute
            );
        }
      },
    });

    colDef.push({
      ...defaultColumn,
      colId: 'lastUpdated',
      headerName: 'Last Updated On',
      field: 'lastUpdated',
      cellRenderer: (params) => {
        return this.dvDatePipe.transform(params.value);
      },
      minWidth: grid_widths_map.sm_column_sm,
    });
    colDef.push({
      ...defaultColumn,
      colId: 'assigned_by',
      headerName: 'Assigned By',
      field: 'assigned_by',
      minWidth: grid_widths_map.sm_column_xl,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      floatingFilterComponent: 'textFloatingFilterComponent',
      floatingFilterComponentParams: {
        suppressFilterButton: true,
        placeHolder: 'Search by keyword',
      },
    });
    colDef.push({
      ...defaultColumn,
      colId: 'assigned_on',
      headerName: 'Assigned On',
      cellRenderer: (params) => {
        return this.dvDatePipe.transform(params.value);
      },
      field: 'assigned_on',
      minWidth: grid_widths_map.sm_column_sm,
    });

    return colDef;
  }

  getAssignments(diligenceId: number) {
    return this.http.get(`v2/diligences/${diligenceId}/assignment_status`).pipe(
      map((response: any) =>
        response.map((assignment) => ({
          fullName: assignment.assigned_to,
          question_text: assignment.question_text,
          status: assignment.is_WIP
            ? 'WIP'
            : assignment.answered_at
            ? 'Answered'
            : 'Unanswered',
          section_id: assignment.section_id,
          parent_section_id: assignment.parent_section_id,
          question_id: assignment.question_id,
          section_name: assignment.section_name,
        }))
      )
    );
  }

  getReviewAssignments(diligenceId: number) {
    return this.http
      .get(`diligences/${diligenceId}/review_assignments_status`)
      .pipe(
        map((res: any) =>
          res.map((response) => ({
            id: response.assigned_to_user_id
              ? response.assigned_to_user_id
              : response.assigned_to_function_id,
            fullName:
              response.assigned_to_user_name !== ' '
                ? response.assigned_to_user_name
                : response.assigned_to_function_name +
                  (response.completed_by_name.trim()
                    ? ' - ' + response.completed_by_name
                    : ''),
            question_text: response.question_text,
            section_name: response.section_name,
            status: response.status,
            statusDisplay:
              reviewStatusMap[
                response.status +
                  (response.review_type === ReviewType.Evaluation &&
                  response.status === diligenceStatusConstant.ReviewFailed
                    ? 'Evaluation'
                    : '')
              ],
            description: response.note,
            review_type: response.review_type,
            lastUpdated: new Date(response.last_updated_at + 'Z'),
            assigned_by: response.assigned_by_name,
            assigned_on: new Date(response.assigned_at + 'Z'),
            due_date: new Date(response.due_at),
            subcatId: response.section_id,
            parent_section_id: response.parent_section_id,
            question_id: response.question_id,
          }))
        )
      );
  }

  redirectToQuestionSubcategory(
    catId,
    subcatId,
    questionId = null,
    activatedRoute
  ) {
    if (questionId) {
      this.router.navigateToRelativeRoute(
        `questionnaire/category/${catId}/question/${questionId}`,
        activatedRoute,
        {
          fragment: `child_section_${subcatId}`,
        }
      );
    } else
      this.router.navigateToRelativeRoute(
        `questionnaire/category/${catId}`,
        activatedRoute,
        {
          fragment: `child_section_${subcatId}`,
        }
      );
  }
}
