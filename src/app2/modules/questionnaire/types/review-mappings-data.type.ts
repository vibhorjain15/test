import { DiligenceTypeEnum } from './diligence-enum.type';

export interface ReviewMappingsData {
  question_mappings: QuestionMappingData[];
  mapped_diligences: MappedDiligence[];
}

export interface QuestionMappingData {
  id: number;
  template_id: number;
  template_version: number;
  template_name: string;
  section_id: number;
  question_id: number;
  question_Text: string;
  mapped_template_id: number;
  mapped_template_version: number;
  mapped_template_name: string;
  mapped_questions: MappedQuestion[];
  firm_id: number;
  created_by: number;
  created_at: string;
  updated_by?: number;
  updated_at?: string;
  question_group_id: number;
  mapped_question_group_id: number;
  section_group_id: number;
}

export interface MappedQuestion {
  mapped_section_id: number;
  mapped_question_id: number;
  mapped_question_text: string;
  section_group_id: number;
  question_group_id: number;
  template_id: number;
}

export interface MappedDiligence {
  id: number;
  name: string;
  entity_id: number;
  entity_name: string;
  entity_type: string;
  template_id: number;
  template_name: string;
  type: DiligenceTypeEnum;
  due_at: string;
  status: string;
  closed_at?: string;
  completed_at?: string;
  as_of_date: string;
  strategy_name?: string;
  question_count: number;
  percentage_completed: number;
  tofirm_id: number;
  tofirm_name?: string;
  fromfirm_id: string;
  fromfirm_name?: string;
  created_by: number;
  created_by_name?: string;
  scheduled_for?: any;
  created_at: string;
  followup_count: number;
  view_count: number;
  acknowledged_at?: string;
  lastupdated_at?: string;
  is_internal: boolean;
  basediligence_id?: number;
  parent_entity_id?: number;
  enable_auto_entity_permissions: boolean;
  inbound_configurations_name?: string;
  linked_duediligence_id?: number;
  display_name?: string;
}
