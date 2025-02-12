// export class GetGridState {
//   static readonly type = '[Grid] GetGridState';
//   constructor() {}
// }
export class DeleteGridState {
  static readonly type = '[Grid] DeleteGridState';
  constructor(public gridName: any) {}
}

export class UpdateGridState {
  static readonly type = '[Grid] UpdateGridState';
  constructor(public payload: any) {}
}

export class SetDefaultColumnDef {
  static readonly type = '[Grid] SetDefaultColumnDef';
  constructor(public payload: any) {}
}

export class UpdateLocalGridState {
  static readonly type = '[Grid] UpdateLocalGridState';
  constructor(public payload: any) {}
}
