export const dayFilters = [
  { label: ' In 5 Days', key: 'five', active: false },
  { label: ' In 10 Days', key: 'ten', active: false },
  { label: ' In 30 Days', key: 'thirty', active: false },
  { label: ' All Expired Responses', key: 'all', active: false },
];

export const BulkActions = [
  {
    label: 'Manage Tags',
    key: 'tags',
  },
  {
    label: 'Manage SME',
    key: 'SME',
  },
  {
    label: 'Manage Expiry Date',
    key: 'expiry',
  },
];

export const QuestionAnswerFilter = [
  { name: 'Question', id: 'Question' },
  { name: 'Response', id: 'Answer' },
  { name: 'Question & Response', id: 'Both' },
];

export enum QaTabType {
  Library = 'Library',
  ProjectHistory = 'Project Responses',
  Archives = 'Archived',
}
