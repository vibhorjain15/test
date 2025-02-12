import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ReportTemplateDataservice } from 'src/app2/services/report-template-data.service';
import {
  DeleteCurrentTemplateData,
  GetAllTemplates,
  GetCurrentTemplateData,
  SetCurrentTemplate,
  UpdateAllTemplates,
} from './reports.actions';
import { ReportsState } from './reports.model';

@State<ReportsState>({
  name: 'reports',
  defaults: {
    loading: false,
    templates: null,
    currentTemplate: null,
    error: null,
  },
})
@Injectable()
export class ReportState {
  constructor(
    private readonly templateService: ReportTemplateDataservice,
    private readonly toaster: ToastrService
  ) {}

  @Selector()
  static getTemplatesList(state: ReportsState) {
    return state.templates;
  }

  @Selector()
  static getCurrentTemplate(state: ReportsState) {
    return state.currentTemplate;
  }

  @Action(GetAllTemplates)
  GetAllTemplates({ patchState }: StateContext<ReportsState>, data) {
    patchState({
      loading: true,
      error: null,
    });
    return this.templateService.getTemplates(data.payload).pipe(
      tap((result: any) => {
        patchState({
          loading: false,
          templates: result,
          error: null,
        });
      })
    );
  }

  @Action(UpdateAllTemplates)
  UpdateAllTemplates(
    { getState, patchState }: StateContext<ReportsState>,
    { payload }
  ) {
    let { templates } = getState();
    templates = templates.filter((val) => val.id != payload.id);
    patchState({
      loading: false,
      templates: [...templates, payload],
      error: null,
    });
  }

  @Action(SetCurrentTemplate)
  SetCurrentTemplate({ patchState }: StateContext<ReportsState>, data) {
    return patchState({
      error: null,
      currentTemplate: data.payload,
    });
  }

  @Action(GetCurrentTemplateData)
  GetCurrentTemplateData({ patchState }: StateContext<ReportsState>, data) {
    patchState({
      loading: true,
      error: null,
    });
    return this.templateService.getTemplate(data.payload).pipe(
      tap((result: any) => {
        patchState({
          loading: false,
          currentTemplate: result,
          error: null,
        });
      }),
      catchError(() => {
        patchState({
          loading: false,
          error: 'Somethig went wrong',
        });
        return of([]);
      })
    );
  }

  @Action(DeleteCurrentTemplateData)
  DeleteCurrentTemplateData(
    { getState, patchState }: StateContext<ReportsState>,
    data
  ) {
    patchState({
      loading: true,
      error: null,
    });
    return this.templateService.deleteReportTemplate(data.payload).pipe(
      tap((result: any) => {
        const state = getState();
        patchState({
          loading: false,
          templates: [
            ...state.templates.filter((val) => val.id !== data.payload.id),
          ],
          currentTemplate: state.templates[0],
          error: null,
        });
        this.toaster.success('Report Design deleted successfully');
      }),
      catchError(() => {
        patchState({
          loading: false,
          error: 'Somethig went wrong',
        });
        return of([]);
      })
    );
  }
}
