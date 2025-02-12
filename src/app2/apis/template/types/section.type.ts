export interface SectionType {
  templateID: number;
  id: number;
  name: string;
  parentID?: any;
  isMultiple: boolean;
  headerText?: any;
  isParent: boolean;
  order: number;
  questions?: any;
  assignedTo: number;
  question_counts: number;
  active_response_count: number;
  is_system_generated: boolean;
  version: number;
  note_count: number;
  section_status: number;
  destination_index?: any;
}
