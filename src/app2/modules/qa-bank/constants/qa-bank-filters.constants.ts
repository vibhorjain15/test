export const ResponseFilter = {
  filter_label: 'Response',
  filter_name: 'response_text',
  filter_type: 'str',
  search_type: 'contains',
  filter_value: null,
};

export const QuestionFilter = {
  filter_label: 'Question',
  filter_name: 'question_text',
  filter_type: 'str',
  search_type: 'contains',
  filter_value: null,
};

export const PreApprovedFilter = {
  filter_label: 'Project Type',
  filter_name: 'diligence_type',
  filter_type: 'dropdown',
  filter_value: -1,
  search_type: 'exact',
};

export const StandardFilter = {
  filter_label: 'Project Type',
  filter_name: 'diligence_type',
  filter_type: 'dropdown',
  filter_value: 1241,
  search_type: 'exact',
};

export const ArchiveFilter = {
  filter_label: 'Deactivated',
  filter_name: 'is_archived',
  filter_type: 'bool',
  filter_value: false,
  search_type: 'exact',
};

export const DuplicateFilter = {
  filter_label: 'Marked as duplicate',
  filter_name: 'is_merged',
  filter_type: 'bool',
  filter_value: false,
  search_type: 'exact',
};

export const DateSortLibrary = [
  { name: 'Sort by : Recent responses', id: 'response_date_sort_desc' },
  { name: 'Sort by : Oldest responses', id: 'response_date_sort_asc' },
  { name: 'Sort by : Expiry date (Descending)', id: 'expiry_date_sort_desc' },
  { name: 'Sort by : Expiry date (Ascending)', id: 'expiry_date_sort_asc' },
];

export const DateSortHistory = [
  { name: 'Sort by : Recent responses', id: 'response_date_sort_desc' },
  { name: 'Sort by : Oldest responses', id: 'response_date_sort_asc' },
];

export const ProjectSort = {};

export const archiveTabSortList = [
  { name: 'Sort by : Recent responses', id: 'response_date_sort_desc' },
  { name: 'Sort by : Oldest responses', id: 'response_date_sort_asc' },
  { name: 'Sort by : Expiry date (Descending)', id: 'expiry_date_sort_desc' },
  { name: 'Sort by : Expiry date (Ascending)', id: 'expiry_date_sort_asc' },
  {
    name: 'Sort by : Archive date (Descending)',
    id: 'archived_date_sort_desc',
  },
  { name: 'Sort by : Archive date (Ascending)', id: 'archived_date_sort_asc' },
];

export const archiveQuickFilter = [
  { name: 'Filter by : All archived', id: 'all' },
  { name: 'Marked duplicates', id: 'duplicates' },
  { name: 'Manually archived', id: 'archived' },
];

export const projectQuickFilter = [
  { name: 'Filter by : All projects', id: 'all' },
  {
    name: 'Standard DDQs',
    id: 'Standard DDQs',
    premiumOnly: true,
    disabled: true,
    tooltip: '',
  },
  { name: 'Investor requests', id: 'Investor Requests' },
];

export const showInvestorRequest = {
  filter_name: 'is_investor_request',
  filter_type: 'bool',
  filter_value: true,
  search_type: 'exact',
};

export const showStandardDDQ = {
  filter_name: 'is_standard_ddq',
  filter_type: 'bool',
  filter_value: true,
  search_type: 'exact',
};

export const dayFilters = [
  { name: 'Filter by : Expiry date', id: 'none' },
  { name: ' In 5 days', id: 'five', active: false },
  { name: ' In 10 days', id: 'ten', active: false },
  { name: ' In 30 days', id: 'thirty', active: false },
  { name: ' All expired responses', id: 'all', active: false },
];
