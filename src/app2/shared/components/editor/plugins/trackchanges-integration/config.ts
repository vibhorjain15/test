type ResponseType = (data: any) => Promise<any>;

export interface DVTrackChangesConfig {
  getSuggestion: ResponseType;
  addSuggestion: ResponseType;
  updateSuggestion: ResponseType;
}
