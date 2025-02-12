export const ParserSelectionType = {
  SELECT: "select",
  SELECT_SIMILAR: "select_similar",
  DESELECT: "deselect",
  DESELECT_SIMILAR: "deselect_similar",
  DESELECT_TYPE: "deselect_type",
  DESELECT_ALL: "deselect_all", // Reset file or table
};

export const ParserElementType = {
  SECTION: "Section",
  SUB_SECTION: "SubSection",
  INSTRUCTION: "Instruction",
  QUESTION: "Question",
  SUB_QUESTION: "SubQuestion",
  ANSWER: "Answer",
  COMMENT: "Comment",
  GRID_TITLE: "GridTitle",
  GRID: "Static",
  DYNAMIC_GRID: "Dynamic",
  CUSTOM_TABLE: "CustomTable",
  QA_ANSWER_DIV: "QAContainer",
  QA_ANSWER: "QAAnswer",
};

export const ParserType = {
  WORD_PARSER: "word_parser",
  EXCEL_PARSER: "excel_parser",
  QA_WORD_UPLOAD: "qa_word_upload",
};

export const ParserResponseType = {
  Boolean: 0,
  Text: 1,
  Numeric: 2,
  CheckBox: 3,
  Grid: 4,
  TextMultiLine: 5,
  TextPhone: 6,
  TextEmail: 7,
  Integer: 8,
  Percentage: 9,
  Bookends: 10,
  Date: 11,
  AumTable: 12,
  Dropdown: 13,
  BooleanPlus: 14,
  NoPlus: 15,
  Attachment: 17,
  ReturnTable: 18,
  Identifier: 19,
  DynamicGrid: 20,
};

export const ParserElementAttributes = {
  INSTRUCTION_ASSOCIATED_TO: "associated-to",
  QUESTION_ASSOCIATED_TO: "associated-to-question-id",
  IS_PARENT_QUESTION: "parent-question",
  ASSOCIATED_TO: "associated_to",
  IS_PARENT: "is_parent",
  CELL_COORDS: "cell-coordinates",
  [ParserElementType.SECTION]: "associated-to-section-id",
  [ParserElementType.SUB_SECTION]: "associated-to-subsection-id",
  [ParserElementType.INSTRUCTION]: "associated-to-instruction-id",
  [ParserElementType.QUESTION]: "associated-to-question-id",
};

export const ParserParentElementAttributes = {
  [ParserElementType.SECTION]: "parent-section",
  [ParserElementType.SUB_SECTION]: "parent-subsection",
  [ParserElementType.QUESTION]: "parent-question",
};

Object.freeze(ParserSelectionType);
Object.freeze(ParserElementType);
Object.freeze(ParserResponseType);
Object.freeze(ParserElementAttributes);
