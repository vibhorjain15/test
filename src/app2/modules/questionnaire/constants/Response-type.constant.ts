export enum ResponseType {
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

export const EntityType = {
  Firm: 1220,
  Fund: 1219,
  Product: 1219,
  Vehicle: 1217,
  Strategy: 5004,
  DueDiligence: 1105,
  Myfirm: 1220,
};
