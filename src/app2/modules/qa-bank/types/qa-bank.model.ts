export interface Tag {
  id: number;
  value: string;
}

export type buttonList = {
  key: string;
  name: string;
  disabled?: boolean;
  color?: any;
  tooltip?: string;
  type:
    | 'primary'
    | 'default'
    | 'orange'
    | 'orange-fill'
    | 'transparent'
    | 'secondary'
    | 'darkBlue'
    | 'link'
    | 'success'
    | 'orange-border'
    | 'btn-link'
    | 'blue-border'
    | any;
  placement?: string;
  icon?: boolean;
  noHoverColor?: boolean;
  count?: number;
  label: string;
  isLink?: boolean;
  link?: any;
};
export interface Questions {
  score: number;
  question_text_short: string;
  question_text: string;
  question_help_text?: any;
  response_text_copy?: any;
  response_text_short: string;
  response_text?: any;
  tags: Tag[];
  question_sme: any[];
  section_sme: any[];
  notes: any[];
  grid_response: any;
  checkbox_response: any[];
  comments: any[];
  response_id: number;
  response_type: string | any;
  isExpired: boolean;
  fund_firm_id: number;
  response_is_na: number;
  response_created_by_name: string;
  tags_text_short: string;
  tags_text: string[];
  associated_template_id: number;
  associated_investor_short: string;
  associated_investor: string;
  child_section_id: number;
  response_created_at: string;
  associated_entity_id: number;
  associated_entity_type_id: number;
  associated_entity_type: string;
  is_active: boolean;
  diligence_type: number;
  question_id: number;
  is_verified: number;
  associated_template: string;
  associated_entity_short: string;
  associated_entity: string;
  duediligence_id: number;
  response_created_by: number;
  parent_section_id: number;
  last_reviewed_by_name: string;
  last_reviewed_at;
  text: string;
  expiry_date: string;
  exact_duplicates: number[];
  semi_duplicates: any[];
  isSelected: boolean;
  rightIcons: buttonList[];
  showAnswer: boolean;
  archived_date: string;
  note_count: number;
  is_archived: boolean;
  is_merged: boolean;
  response_status: string;
  hasActiveComments: boolean;
}
