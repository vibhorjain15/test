
export const ParserSelectionType = {
    SELECT: 'select',
    SELECT_SIMILAR: 'select_similar',
    DESELECT: 'deselect',
    DESELECT_SIMILAR: 'deselect_similar',
    DESELECT_TYPE: 'deselect_type',
    DESELECT_ALL: 'deselect_all', // Reset file or table
}

export const ParserElementType = {
    SECTION: 'Section',
    SUB_SECTION: 'SubSection',
    INSTRUCTION: 'Instruction',
    QUESTION: 'Question',
    SUB_QUESTION: 'SubQuestion',
    ANSWER: 'Answer',
    COMMENT: 'Comment',
    GRID_TITLE: 'GridTitle',
    GRID: 'Static',
    DYNAMIC_GRID: 'Dynamic',
    CUSTOM_TABLE: 'CustomTable',
    QA_ANSWER_DIV: 'QAContainer',
    QA_ANSWER: 'QAAnswer'
}

export const ParserElementAttributes = {
    ASSOCIATED_TO: 'associated_to',
    IS_PARENT: 'is_parent',
    CELL_COORDS: 'cell-coordinates',
    [ParserElementType.SECTION]: 'associated_to_section_id',    
    [ParserElementType.SUB_SECTION]: 'associated_to_subsection_id',    
    [ParserElementType.INSTRUCTION]: 'associated_to_instruction_id',
    [ParserElementType.QUESTION]: 'associated_to_question_id',    
}

Object.freeze(ParserSelectionType);
Object.freeze(ParserElementType);
Object.freeze(ParserElementAttributes);
