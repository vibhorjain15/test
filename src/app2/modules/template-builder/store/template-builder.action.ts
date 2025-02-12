export class GetCategories {
  static readonly type = '[Template] GetCategories';
  constructor() {}
}
export class GetQuestions {
  static readonly type = '[Template] GetQuestions';
  constructor(public params: any) {}
}
export class GetAllQuestions {
  static readonly type = '[Template] GetAllQuestions';
  constructor(public params: any) {}
}
export class CreateQuestions {
  static readonly type = '[Template] CreateQuestions';
  constructor(public id: any, public params: any) {}
}

export class ToggleTemplateState {
  static readonly type = '[Template] ToggleTemplateState';
  constructor() {}
}

export class GetSubCategories {
  static readonly type = '[Template] GetSubCategories';
  constructor(public params: any) {}
}

export class CreateBulkCategories {
  static readonly type = '[Template] CreateBulkCategories';
  constructor(public params: any) {}
}
export class CreateBulkSubCategories {
  static readonly type = '[Template] CreateBulkSubCategories';
  constructor(public params: any) {}
}
export class CreateCategories {
  static readonly type = '[Template] CreateCategories';
  constructor(public params: any) {}
}
export class CreateSubCategories {
  static readonly type = '[Template] CreateSubCategories';
  constructor(public params: any) {}
}

export class UpdateCategories {
  static readonly type = '[Template] UpdateCategories';
  constructor(public id: any, public params: any) {}
}
export class UpdateSubCategories {
  static readonly type = '[Template] UpdateSubCategories';
  constructor(public id: any, public params: any) {}
}

export class MoveQuestions {
  static readonly type = '[Template] MoveQuestions';
  constructor(public payload: any) {}
}

export class MoveSubCategories {
  static readonly type = '[Template] MoveSubCategory';
  constructor(public payload: any) {}
}
export class DeleteSubCategories {
  static readonly type = '[Template] DeleteSubCategories';
  constructor(public id: any) {}
}
export class DeleteCategories {
  static readonly type = '[Template] DeleteCategories';
  constructor(public id: any) {}
}
export class DeleteQuestions {
  static readonly type = '[Template] DeleteQuestions';
  constructor(
    public id: any,
    public questionId: any,
    public nestedQuestionId = null
  ) {}
}

//not getting used for now
export class ModifyCategory {
  static readonly type = '[Template] ModifyCategory';
  constructor(public catData: any) {}
}
export class UpdateActiveQuestionRow {
  static readonly type = '[Template] UpdateActiveQuestionRow';
  constructor(public id: any) {}
}
export class SetTemplateId {
  static readonly type = '[Template] SetTemplateId';
  constructor(public id: any) {}
}
export class UpdateQuestion {
  static readonly type = '[Template] UpdateQuestion';
  constructor(public id: any, public params: any) {}
}
export class ConvertCategory {
  static readonly type = '[Template] ConvertCategory';
  constructor(public payload: any) {}
}

export class CopyQuestions {
  static readonly type = '[Template] CopyQuestions';
  constructor(public payload: any) {}
}

export class GetTemplateInfo {
  static readonly type = '[Template] GetTemplateInfo';
  constructor(public isDraft = false) {}
}

export class GetFrequency {
  static readonly type = '[Template] GetFrequency';
}
export class UpdateActivePanelId {
  static readonly type = '[Template] GetUpdateActivePanelId';
  constructor(public id: string) {}
}
export class EditTemplate {
  static readonly type = '[Template] EditTemplate';
  constructor(public payload: any) {}
}
export class DeleteTemplateState {
  static readonly type = '[Template] DeleteTemplateState';
  constructor() {}
}
export class UpdateLocalQuestion {
  static readonly type = '[Template] UpdateLocalQuestion';
  constructor(public id: string | number, public data: any) {}
}
export class SaveDescription {
  static readonly type = '[Template] SaveDescription';
  constructor(public desc: string) {}
}
export class ActivateTemplate {
  static readonly type = '[Template]  ActivateTemplate';
  constructor() {}
}
export class UpdateCategoryList {
  static readonly type = '[Template] UpdateCategoryList';
  constructor(public list: any) {}
}
export class UpdateSubcategoryList {
  static readonly type = '[Template] UpdateSubcategoryList';
  constructor(public list: any, public id: any) {}
}
export class UpdateQuestionList {
  static readonly type = '[Template] UpdateQuestionList';
  constructor(public list: any, public id: any) {}
}

export class UpdateError {
  static readonly type = '[Template] UpdateError';
  constructor(public error: any) {}
}
export class UpdateActiveSectionId {
  static readonly type = '[Template] UpdateActiveSectionId';
  constructor(public error: any) {}
}

export class UpdateTemplate {
  static readonly type = '[Template] UpdateTemplate';
  constructor(public template: any) {}
}

export class UpdateRouteParams {
  static readonly type = '[Template] UpdateRouteParams';
  constructor(public params: any) {}
}
export class DeleteAllCategories {
  static readonly type = '[Template] DeleteAllCategories';
  constructor() {}
}

export class GetEntityScoreRules {
  static readonly type = '[Template] GetEntityScoreRules';
  constructor() {}
}
