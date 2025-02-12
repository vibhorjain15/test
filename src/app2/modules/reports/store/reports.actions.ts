export class GetAllTemplates {
  static readonly type = '[Reports] GetAllTemplates';
  constructor(public payload: any) {}
}
export class UpdateAllTemplates {
  static readonly type = '[Reports] UpdateAllTemplates';
  constructor(public payload: any) {}
}
export class GetCurrentTemplateData {
  static readonly type = '[Reports] GetCurrentTemplateData';
  constructor(public payload: any) {}
}
export class DeleteCurrentTemplateData {
  static readonly type = '[Reports] DeleteCurrentTemplateData';
  constructor(public payload: any) {}
}
export class SetCurrentTemplate {
  static readonly type = '[Reports] SetCurrentTemplate';
  constructor(public payload: any) {}
}
