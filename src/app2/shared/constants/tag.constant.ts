export const typeOptions = [
  { text: 'Text', id: 'text' },
  { text: 'Paragraph', id: 'textmultiline' },
  { text: 'Integer', id: 'int' },
  { text: 'Numeric', id: 'numeric' },
  { text: 'Dropdown', id: 'dropdown' },
  { text: 'Link', id: 'link' },
  { text: 'CheckBox', id: 'checkbox' },
  { text: 'Dynamic', id: 'dynamic', hiddenFrom: 'rating' },
  { text: 'Date', id: 'date' },
  { text: 'DateTime', id: 'datetime' },
  {
    text: 'Question',
    id: 'question',
    hiddenFrom: ['rating', 'duediligence', 'contact', 'bulk-upload'],
  },
  {
    text: 'Rating',
    id: 'rating',
    hiddenFrom: [
      'rating',
      'duediligence',
      'contact',
      'bulk-upload',
      'manager', // user level check
      'freeInvestor', // subscription level check
      'issue',
    ],
  },
];

export const TagType = {
  Text: 'text',
  Paragraph: 'textmultiline',
  Integer: 'int',
  Numeric: 'numeric',
  Dropdown: 'dropdown',
  Link: 'link',
  CheckBox: 'checkbox',
  Dynamic: 'dynamic',
  Date: 'date',
  DateTime: 'datetime',
  Question: 'question',
  Rating: 'rating',
};
