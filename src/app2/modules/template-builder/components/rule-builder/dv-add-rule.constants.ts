import { ResponseType } from 'src/app2/modules/questionnaire/constants/Response-type.constant';
import { keywordConstants } from 'src/app2/shared/constants/constant';

export const compareList = [
  { label: 'Greater Than', value: 'gt' },
  { label: 'Greater Than or Equal To', value: 'gte' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Less Than or Equal To', value: 'lte' },
];

export const yesNoList = [
  { value: 'Yes', id: true },
  { value: 'No', id: false },
];

export const optionsList = [
  { label: 'Options 1', value: 'opt1' },
  { label: 'Options 2', value: 'opt2' },
  { label: 'Options 3', value: 'opt3' },
];

export const entityTypes = [
  {
    id: keywordConstants.Question,
    name: 'Question',
    plural: 'Questions',
  },
  {
    id: keywordConstants.Subcategory,
    name: 'Sub-category',
    plural: 'Sub-categories',
  },
  {
    id: keywordConstants.Category,
    name: 'Category',
    plural: 'Categories',
  },
];

export const ruleTypes = [
  {
    id: 1,
    name: 'Specific',
  },
  {
    id: 2,
    name: 'Aggregate',
  },
];

export const diffTypes = [
  {
    id: 'Percentage',
    name: 'Percentage',
  },
  {
    id: 'Absolute',
    name: 'Absolute',
  },
];

export const changeTypes = [
  {
    id: 'Increase',
    name: 'Increase',
  },
  {
    id: 'Decrease',
    name: 'Decrease',
  },
];

export const matchTypes = [
  {
    id: 'Percentage',
    name: 'Percent',
  },
  {
    id: 'Absolute',
    name: 'Count',
  },
];

export const parentEntityTypes = [
  {
    id: keywordConstants.Subcategory,
    name: 'Sub-category',
  },
  {
    id: keywordConstants.Category,
    name: 'Category',
  },
  {
    id: keywordConstants.Project,
    name: 'Project',
  },
  {
    id: 'Questionlist',
    name: 'List of Questions',
  },
  {
    id: 'Subcategorylist',
    name: 'List of sub-categories',
  },
  {
    id: 'Categorylist',
    name: 'List of categories',
  },
];

export const globalOperators = [
  {
    id: 'AND',
    name: 'All',
  },
  {
    id: 'OR',
    name: 'Any',
  },
];

export const ruleKeywordConstants = {
  Questionlist: 'Questionlist',
  Subcategorylist: 'Subcategorylist',
  Categorylist: 'Categorylist',
  ResponseHistory: 'ResponseHistory',
  Response: 'Response',
  BlankResponse: 'BlankResponse',
  NAResponse: 'NAResponse',
  Rating: 'Rating',
  Percentage: 'Percentage',
  Absolute: 'Absolute',
  AND: 'AND',
  OR: 'OR',
  Increase: 'Increase',
  Decrease: 'Decrease',
};

export const entityTypeToText = {
  Question: 'Question',
  Section: 'Category',
  Subsection: 'Sub-category',
  Duediligence: 'Project',
};

export const entityTypeToPluralText = {
  Question: 'questions',
  Section: 'categories',
  Subsection: 'sub-categories',
};

export const signChangeOperatorSwitchMap = {
  lte: 'gte',
  lt: 'gt',
  gt: 'lt',
  gte: 'lte',
  eq: 'eq',
  noteq: 'noteq',
};

export const responseTypes = [
  {
    id: ResponseType.Numeric,
    name: 'Numeric',
  },
  {
    id: ResponseType.Text,
    name: 'Text',
  },
  {
    id: ResponseType.Boolean,
    name: 'Yes / No',
  },
  {
    id: ResponseType.Dropdown,
    name: 'Checkbox / Dropdown',
  },
  {
    id: ResponseType.Date,
    name: 'Date',
  },
  {
    id: 'All',
    name: 'All',
  },
];
