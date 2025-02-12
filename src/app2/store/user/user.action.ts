export class GetCurrentUser {
  static readonly type = '[User] GetCurrentUser';
  constructor() {}
}

export class GetSubscriptionLimit {
  static readonly type = '[User] GetSubscriptionLimit';
  constructor() {}
}

export class UpdateFirmPreference {
  static readonly type = '[User] UpdateFirmPreference';
  constructor(public payload: any) {}
}
export class UpdateCurrentUser {
  static readonly type = '[User] UpdateCurrentUser';
  constructor(public payload: any) {}
}

export class GetTeamMembers {
  static readonly type = '[User] GetTeamMembers';
  constructor() {}
}

export class GetLanguageCode {
  static readonly type = '[User] GetLanguageCode';
  constructor() {}
}

export class DeleteAllData {
  static readonly type = '[User] DeleteAllData';
  constructor() {}
}

export class SetDefaultColumnDef {
  static readonly type = '[User] SetDefaultColumnDef';
  constructor(public payload: any) {}
}

export class SetPartnershipData {
  static readonly type = '[User] SetPartnershipData';
  constructor(
    public entity_id: string,
    public entity_type: string,
    public entity_name: string
  ) {}
}
export class DeletePartnershipData {
  static readonly type = '[User] DeletePartnershipData';
  constructor() {}
}

export class GetRatingCalculationTypes {
  static readonly type = '[Rating] GetRatingCalculationTypes';
  constructor() {}
}

export class GetDocumentTags {
  static readonly type = '[Document] GetDocumentTags';
  constructor() {}
}

export class UpdateActivePanelId {
  static readonly type = '[User] UpdateActivePanelId';
  constructor(public id) {}
}

export class GetWebsocketToken {
  static readonly type = '[Websocket] GetWebsocketToken';
  constructor() {}
}
export class GetTeamRoles {
  static readonly type = '[User] GetTeamRoles';
  constructor() {}
}
export class ToggleWritetoUs {
  static readonly type = '[User] ToggleWritetoUs';
  constructor() {}
}

export class UpdateEUCAccepted {
  static readonly type = '[User] UpdateEUCAccepted';
  constructor() {}
}
export class UpdateFirstLoginUser {
  static readonly type = '[User] UpdateFirstLoginUser';
}
export class GetAiPromptFlag {
  static readonly type = '[User] GetAiPromptFlag';
  constructor() {}
}
export class GetUserNotification {
  static readonly type = '[User] GetUserNotification';
  constructor() {}
}
