export interface QAStateType {
  loading: boolean;
  notes: object;
  error: string;
  QAList: {
    [id: string]: object;
  };
  qaOrder: any[];
  QAFilterCount: number;
  QACount: number;
  QAOffset: number;
  QASearchStatus: number;
  selectedQuestions: [];
  activePanelId: string;
  qaBankFilters: any;
}
