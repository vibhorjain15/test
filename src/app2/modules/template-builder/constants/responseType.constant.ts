export enum responseType {
  TextEmail = 'TextEmail',
  Numeric = 'Numeric',
  Integer = 'Integer',
  Percentage = 'Percentage',
  TextPhone = 'TextPhone',
  Text = 'Text',
  Identifier = 'Identifier',
  Boolean = 'Boolean',
  BooleanPlus = 'BooleanPlus',
  TextMultiLine = 'TextMultiLine',
  Date = 'Date',
  Bookends = 'Bookends',
  CheckBox = 'CheckBox',
  Dropdown = 'Dropdown',
  Grid = 'Grid',
  NoPlus = 'NoPlus',
  ReturnTable = 'ReturnTable',
  aumTable = 'aumTable',
  DynamicGrid = 'DynamicGrid',
  Attachment = 'Attachment',
}

export const responseTypeList = [
  {
    id: 17,
    text: 'Attachment',
    description: 'Attachment',
  },
  {
    id: 12,
    text: 'aumTable',
    description: 'AUM History',
  },
  {
    id: 20,
    text: 'DynamicGrid',
    description: 'Customize Grid / Table ',
  },
  {
    id: 11,
    text: 'Date',
    description: 'Date',
  },
  {
    id: 7,
    text: 'TextEmail',
    description: 'Email',
  },
  {
    id: 4,
    text: 'Grid',
    description: 'Grid / Table',
  },
  {
    id: 19,
    text: 'Identifier',
    description: 'Identifier',
  },
  {
    id: 3,
    text: 'CheckBox',
    description: 'List of multiple choices / Checkbox',
  },
  {
    id: 13,
    text: 'Dropdown',
    description: 'List of single choice / Dropdown',
  },
  {
    id: 10,
    text: 'Bookends',
    description: 'Min-max range',
  },
  {
    id: 2,
    text: 'Numeric',
    description: 'Numeric - Decimal',
  },
  {
    id: 8,
    text: 'Integer',
    description: 'Numeric - Integer',
  },
  {
    id: 9,
    text: 'Percentage',
    description: 'Percentage',
  },
  {
    id: 6,
    text: 'TextPhone',
    description: 'Phone #',
  },
  {
    id: 1,
    text: 'Text',
    description: 'Text Explanation - One Line',
  },
  {
    id: 5,
    text: 'TextMultiLine',
    description: 'Text Explanation - Paragraph',
  },
  {
    id: 18,
    text: 'ReturnTable',
    description: 'Track Record',
  },
  {
    id: 0,
    text: 'Boolean',
    description: 'Yes/No',
  },
  {
    id: 15,
    text: 'NoPlus',
    description: 'Yes/No with explanation for No',
  },
  {
    id: 14,
    text: 'BooleanPlus',
    description: 'Yes/No with explanation for Yes',
  },
];

export const typeMapper = {
  text: 'Text',
  textmultiline: 'Paragraph',
  int: 'Integer',
  numeric: 'Numeric',
  dropdown: 'Dropdown',
  link: 'Link',
  checkbox: 'CheckBox',
  dynamic: 'Dynamic',
};

export const placeholder = {
  TextEmail: 'Their email response',
  Numeric: 'Their numeric response',
  Identifier: 'Their identifier response',
  Integer: 'Their integer response',
  Percentage: 'Their percentage response',
  TextPhone: 'Their phone number response',
  Text: 'Their one line text response',
  TextMultiLine: 'Their multiline text response',
};

export const response_types_to_allow_for_score = [
  'Boolean',
  'BooleanPlus',
  'NoPlus',
  'Numeric',
  'Integer',
  'Percentage',
  'Date',
  'Text',
  'TextMultiLine',
  'TextEmail',
  'TextPhone',
  'Dropdown',
  'CheckBox',
];

export enum responseTypeExplanation {
  TextEmail = 'Email',
  Numeric = 'Numeric - Decimal',
  Integer = 'Numeric - Integer',
  Percentage = 'Percentage',
  TextPhone = 'Phone #',
  Text = 'Text Explanation - One Line',
  Identifier = 'Identifier',
  Boolean = 'Yes/No',
  BooleanPlus = 'Yes/No with explanation for Yes',
  TextMultiLine = 'Text Explanation - Paragraph',
  Date = 'Date',
  Bookends = 'Min-max range',
  CheckBox = 'Checkbox',
  Dropdown = 'Dropdown',
  Grid = 'Grid / Table',
  NoPlus = 'Yes/No with explanation for No',
  ReturnTable = 'Track Record',
  aumTable = 'AUM History',
  DynamicGrid = 'Customize Grid / Table',
  Attachment = 'Attachment',
}
