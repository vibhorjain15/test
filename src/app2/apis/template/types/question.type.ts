
export interface QuestionType {
    id: number;
    text: string;
    hint_text: string;
    disable_autofill: boolean;
    is_mandatory: boolean;
    responseType: string;
    listDesignationID: number;
    grid_id?: any;
    grid_version? : any;
    response_count: number;
    responseOptions?: any;
    isPublic: boolean;
    isEditable: boolean;
    order: number;
    authorUser?: any;
    usage: number;
    responseCount: number;
    firmCount: number;
    isNested: boolean;
    lastResponseDateTime?: any;
    nestingRuleIds: number[];
    nestingRules?: any;
    sectionID: number;
    section_name?: any;
    line_item_id: number;
    template_id: number;
    formadv_question_id: number;
    tag_ids?: any;
    grid?: any;
    response?: any;
    has_mapped_questions: boolean;
    has_standardized_text: boolean;
    is_na_entity_score_rule_id?: number;
    is_mapped: boolean;
    response_coordinates?: any;
    comment_coordinates?: any;
    has_response: boolean;
    response_word_limit?: any;
    has_formulas: boolean;
    group_id: number;
    destination_index?: any;
  }
  