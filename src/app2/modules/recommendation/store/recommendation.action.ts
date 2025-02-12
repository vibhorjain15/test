export class getIssuePriorities {
  static readonly type = '[recommendation] getIssuePriorities';
  constructor() {}
}
export class getIssueStatuses {
  static readonly type = '[recommendation] getIssueStatuses';
  constructor() {}
}
export class getIssueTags {
  static readonly type = '[recommendation] getIssueTags';
  constructor() {}
}
export class updateIssuePriorities {
  static readonly type = '[recommendation] updateIssuePriorities';
  constructor(public payload: any) {}
}
export class updateIssueTags {
  static readonly type = '[recommendation] updateIssueTags';
  constructor(public tagsList: any[]) {}
}
export class deleteIssueTag {
  static readonly type = '[recommendation] deleteIssueTag';
  constructor(public tag: any) {}
}
export class DeleteAllRecommendationData {
  static readonly type = '[User] DeleteAllRecommendationData';
  constructor() {}
}
