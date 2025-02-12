import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import {
  SetDefaultColumnDef,
  DeleteGridState,
  UpdateGridState,
  UpdateLocalGridState,
} from './grid.action';
import { DeleteAllGridData, GridModel } from './grid.model';

@State<GridModel>({
  name: 'grid',
  defaults: {
    gridState: {},
    defaultColumnDef: {},
  },
})
@Injectable()
export class GridState {
  constructor(
  ) {}
  @Selector()
  static getGridState(state: GridModel) {
    return state.gridState;
  }

  @Selector()
  static getDefaultColumnDef(state: GridModel) {
    return state.defaultColumnDef;
  }

  @Action(UpdateGridState)
  UpdateGridState(
    { getState, patchState }: StateContext<GridModel>,
    { payload }
  ) {
    const previousGridState = getState().gridState;
    patchState({
      gridState: { ...previousGridState, ...payload },
    });
  }

  @Action(DeleteGridState)
  DeleteGridState(
    { getState, patchState }: StateContext<GridModel>,
    { gridName }
  ) {
    let previousGridState = getState().gridState;
    let newGridState = {
      ...previousGridState,
      [gridName]: null,
    };
    patchState({
      gridState: { ...newGridState },
    });
  }

  @Action(SetDefaultColumnDef)
  setDefaultColumnDef(
    { getState, patchState }: StateContext<GridModel>,
    { payload }: SetDefaultColumnDef
  ) {
    const previousDefaultColumnDef = getState().defaultColumnDef;
    patchState({
      defaultColumnDef: { ...previousDefaultColumnDef, ...payload },
    });
  }

  @Action(UpdateLocalGridState)
  UpdateLocalGridState(
    { getState, patchState }: StateContext<GridModel>,
    { payload }
  ) {
    const previousGridState = getState().gridState;
    patchState({
      gridState: { ...previousGridState, ...payload },
    });
  }

  @Action(DeleteAllGridData)
  DeleteAllGridData({ patchState }: StateContext<GridModel>) {
    patchState({
      gridState: {},
      defaultColumnDef: {},
    });
  }
}
