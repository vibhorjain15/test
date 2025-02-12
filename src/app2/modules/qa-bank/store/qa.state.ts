import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { tap } from 'rxjs/operators';
import {
  GetAllQA,
  GetQaBankFilters,
  UpdateActivePanelId,
  UpdateSelectedQuestions,
} from './qa.actions';
import { QAStateType } from './qa.model';
import { QaBankApiService } from 'src/app2/apis/qa-bank/qa-bank.service';

@State<QAStateType>({
  name: 'qa',
  defaults: {
    loading: false,
    error: null,
    notes: {},
    qaOrder: null,
    QAList: null,
    QAFilterCount: null,
    QACount: null,
    QAOffset: null,
    QASearchStatus: null,
    selectedQuestions: null,
    activePanelId: null,
    qaBankFilters: null,
  },
})
@Injectable()
export class QAState {
  constructor(private qaBankService: QaBankApiService) {}

  @Selector()
  static getAllNotes(state: QAStateType) {
    return state.notes;
  }

  @Selector()
  static getQAList(state: QAStateType) {
    return state.QAList;
  }

  @Selector()
  static getSelectedQAList(state: QAStateType) {
    return state.selectedQuestions;
  }
  @Selector()
  static getActivePanelId(state: QAStateType) {
    return state.activePanelId;
  }

  @Selector()
  static getFilters(state: QAStateType) {
    return state.qaBankFilters;
  }

  @Action(GetAllQA)
  GetAllQA({ getState, patchState }: StateContext<QAStateType>, { payload }) {
    patchState({
      loading: true,
      error: null,
    });
    return this.qaBankService.questionSearch(payload.filter_params).pipe(
      tap((response: any) => {
        let qaList = {};
        let qaOrder = [];
        response.data.forEach((val) => {
          val.showTags = false;
          val.isSelected = false;
          val.showAnswer = false;
          qaList[val.question_id] = val;
          qaOrder.push(val);
        });
        patchState({
          loading: false,
          QAList: qaList,
          qaOrder: qaOrder,
          QAFilterCount: response.filtered_count,
          QACount: response.count,
          QAOffset: response.offset,
          QASearchStatus: response.search_status,
          error: null,
        });
      })
    );
  }

  @Action(UpdateSelectedQuestions)
  UpdateSelectedQuestions(
    { getState, patchState, setState }: StateContext<QAStateType>,
    { payload }
  ) {
    setState({
      ...getState(),
      selectedQuestions: payload,
    });
  }

  @Action(UpdateActivePanelId)
  UpdateActivePanelId({ patchState }: StateContext<QAStateType>, { id }: any) {
    patchState({
      activePanelId: id,
    });
  }

  @Action(GetQaBankFilters)
  GetQaBankFilters({ patchState }: StateContext<QAStateType>) {
    return this.qaBankService.getQAFilters({ filters: {} }).pipe(
      tap((response: any) => {
        // Grouping categories based on their names for ease
        let catObj = response.custom_filter.filter(
          (res) => res.filter_name === 'parent_section_id'
        );
        let groupedCat = {};
        if (catObj?.length) {
          catObj[0].options.forEach((cat) => {
            if (!groupedCat[cat.value]) {
              groupedCat[cat.value] = {
                value: '',
                id: [],
              };
            }
            groupedCat[cat.value].value = cat.value;
            groupedCat[cat.value].id.push(cat.id);
          });
          Object.values(groupedCat).forEach(
            (obj: any) => (obj.id = JSON.stringify(obj.id))
          );
          catObj[0].options = Object.values(groupedCat);
        }

        patchState({
          qaBankFilters: response,
        });
      })
    );
  }
}
