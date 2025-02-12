export interface SectionAttributes {
  templateID: number;
  id: number;
  name: string;
  parentID: number;
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

  // custom key internal purpose
  isOpen: boolean;
}

export interface SectionType {
  type: string;
  id: number;
  attributes: SectionAttributes;
}

export interface SectionResponseType {
  data: SectionType[];
  included: any[];
}
