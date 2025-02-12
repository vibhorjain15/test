export class GetAllQA {
  static readonly type = '[QA] GetAllQA';
  constructor(public payload: any) {}
}
export class UpdateSelectedQuestions {
  static readonly type = '[QA] UpdateSelectedQuestions';
  constructor(public payload: any) {}
}

export class UpdateActivePanelId {
  static readonly type = '[Questionnaire] UpdateActivePanelId';
  constructor(public id: any) {}
}

export class GetQaBankFilters {
  static readonly type = '[Questionnaire] GetQaBankFilters';
  constructor() {}
}
