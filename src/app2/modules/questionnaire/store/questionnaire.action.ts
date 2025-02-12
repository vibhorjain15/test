export class GetQuestionCount {
  static readonly type = '[Questionnaire] GetQuestionCount';
  constructor() {}
}
export class UpdateIds {
  static readonly type = '[Questionnaire] UpdateIds';
  constructor(public params: any) {}
}
export class GetDiligenceData {
  static readonly type = '[Questionnaire] GetDiligenceData';
  constructor() {}
}
export class UpdateDiligenceData {
  static readonly type = '[Questionnaire] UpdateDiligenceData';
  constructor(public data: any) {}
}
export class UpdateActiveSection {
  static readonly type = '[Questionnaire] UpdateActiveSection';
  constructor(public data: any) {}
}

export class PatchActiveSection {
  static readonly type = '[Questionnaire] PatchActiveSection';
  constructor(public data: any) {}
}
export class GetDiligenceSectionData {
  static readonly type = '[Questionnaire] GetDiligenceSectionData';
  constructor() {}
}
export class DeleteCategoryData {
  static readonly type = '[Questionnaire] DeleteCategoryData';
  constructor() {}
}
export class UpdateDraftData {
  static readonly type = '[Questionnaire] UpdateDraftData';
  constructor(public data: any, public isSave: boolean = false) {}
}
export class UpdateActivePanelId {
  static readonly type = '[Questionnaire] UpdateActivePanelId';
  constructor(public id: any) {}
}
export class GetSequenceId {
  static readonly type = '[Questionnaire] GetSequenceId';
  constructor(public data: any) {}
}
export class UpdateSectionFilterCounter {
  static readonly type = '[Questionnaire] UpdateSectionFilterCounter';
  constructor(public sectionFilterCounter: any) {}
}
export class UpdateCategory {
  static readonly type = '[Questionnaire] UpdateCategory';
  constructor(public data: any) {}
}
export class UpdateQuestionData {
  static readonly type = '[Questionnaire] UpdateQuestionData';
  constructor(public catID, public sectionId, public question) {}
}
export class DeleteQuestionData {
  static readonly type = '[Questionnaire] DeleteQuestionData';
  constructor(public sectionId: any, public question: any) {}
}
export class UpdateAttachmentMap {
  static readonly type = '[Questionnaire] UpdateAttachmentMap';
  constructor(public data: any) {}
}
export class UpdateSequenceSectionQuestionMap {
  static readonly type = '[Questionnaire] UpdateSequenceSectionQuestionMap';
  constructor(public data: any) {}
}
export class UpdateFilterMap {
  static readonly type = '[Questionnaire] UpdateFilterMap';
  constructor(public filterStatus: any) {}
}
export class UpdateSearchQuery {
  static readonly type = '[Questionnaire] UpdateSearchQuery';
  constructor(public search: any, public filterType: any) {}
}
export class GetRatingScheme {
  static readonly type = '[Questionnaire] GetRatingScheme';
  constructor() {}
}
export class GetQuestionData {
  static readonly type = '[Questionnaire] GetQuestionData';
  constructor(public activeSectionParam?: any) {}
}
export class UpdateLocalQuestionMap {
  static readonly type = '[Questionnaire] UpdateLocalQuestionMap';
  constructor(public id: any, public params: any) {}
}
export class DeleteLocalQuestionMap {
  static readonly type = '[Questionnaire] DeleteLocalQuestionMap';
  constructor(public id: any) {}
}
export class DeleteDraftQuestionData {
  static readonly type = '[Questionnaire] DeleteDraftQuestionData';
  constructor(public ids: any) {}
}
export class UpdateColorData {
  static readonly type = '[Questionnaire] UpdateColorData';
  constructor(public data: any) {}
}
export class GetReviewMappingsData {
  static readonly type = '[Questionnaire] GetReviewMappingsData';
  constructor() {}
}
export class TriggerSilentReload {
  static readonly type = '[Questionnaire] TriggerSilentReload';
  constructor(public silentReload, public closeSidePanel: boolean = true) {}
}
export class UpdateLocalGridMap {
  static readonly type = '[Questionnaire] UpdateLocalGridMap';
  constructor(public localGridMap) {}
}

export class GetMyFunctions {
  static readonly type = '[Questionnaire] GetMyFunctions';
  constructor(public id: any) {}
}

export class getCustomFieldDatamap {
  static readonly type = '[Questionnaire] getCustomFieldDatamap';
  constructor(public param: any) {}
}
export class GetQuestionsUserRoles {
  static readonly type = '[Questionnaire] GetQuestionsUserRoles';
  constructor() {}
}
export class UpdateSubCatData {
  static readonly type = '[Questionnaire] UpdateSubCatData';
  constructor(public subCat: any, public data: any) {}
}
export class GetFunctionAssignment {
  static readonly type = '[Questionnaire] GetFunctionAssignment';
  constructor() {}
}

export class GetSubSectionData {
  static readonly type = '[Questionnaire] GetSubSectionData';
}

export class GetTrackChanges {
  static readonly type = '[Questionnaire] GetTrackChanges';
  constructor() {}
}

export class UndoQuestionData {
  static readonly type = '[Questionnaire] UndoQuestionData';
  constructor(public question: any) {}
}

export class HandleReviewStatus {
  static readonly type = '[Questionnaire] HandleReviewStatus';
  constructor(public reviewStatus: any) {}
}

export class UpdateReviewCommentsData {
  static readonly type = '[Questionnaire] UpdateReviewCommentsData';
  constructor(
    public id: string,
    public sectionId: number,
    public questionId: number,
    public parentQuestionId: number,
    public data: any
  ) {}
}
export class UpdateShownModal {
  static readonly type = '[Questionnaire] UpdateShownModal';
  constructor(public shown: boolean) {}
}

export class IsSavingDraft {
  static readonly type = '[Questionnaire] IsSavingDraft';
  constructor(public draftData) {}
}
export class SidePanelUpdate {
  static readonly type = '[Questionnaire] SidePanelUpdate';
  constructor(public responseTypeFromPanel) {}
}
export class UpdateBulkLocalQuestionMapQuestionMap {
  static readonly type =
    '[Questionnaire] UpdateBulkLocalQuestionMapQuestionMap';
  constructor(public data) {}
}
export class DeleteOnlyDraftQuestionData {
  static readonly type = '[Questionnaire] DeleteOnlyDraftQuestionData';
  constructor(public ids) {}
}

export class getReviewAssignments {
  static readonly type = '[Questionnaire] GetReviewAssignment';
  constructor(public diligenceId: number, public sectionId: number) {}
}

export class updateReviewAssignments {
  static readonly type = '[Questionnaire] updateReviewAssignments';
  constructor(public reviewAssignments) {}
}
export class FilterReload {
  static readonly type = '[Questionnaire] FilterReload';
  constructor(public reload) {}
}

export class ClearCategory {
  static readonly type = '[Questionnaire] ClearCategory';
  constructor() {}
}

export class GetEntityScoreRules {
  static readonly type = '[Questionnaire] GetEntityScoreRules';
}

export class SetTemplateQuestions {
  static readonly type = '[Questionnaire] SetTemplateQuestions';
  constructor(public templateQuestions) {}
}

export class SetQuestionOptions {
  static readonly type = '[Questionnaire] SetQuestionOptions';
  constructor(public questionOptions) {}
}
export class DeleteActiveSection {
  static readonly type = '[Questionnaire] DeleteActiveSection';
  constructor() {}
}
export class DeleteReviewMapData {
  static readonly type = '[Questionnaire] DeleteReviewMapData';
  constructor() {}
}
export class GetReviewers {
  static readonly type = '[Questionnaire] GetReviewers';
  constructor() {}
}

export class UpdateSequenceIdInLocalGridMap {
  static readonly type = '[Questionnaire] UpdateSequenceIdInLocalGridMap';
  constructor(public updatedSequenceMap) {}
}
