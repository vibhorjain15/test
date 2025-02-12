export interface RuleType {
  id: number;
  section_id: number;
  question_id: number;
  template_id: number;
  version: number;
  operator_id: string;
  value: string;
  score: number;
  has_flag: boolean;
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
}
