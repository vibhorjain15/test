export interface TemplateInfo {
  id: number;
  name: string;
  desc: string;
  ownership: string;
  author?: any;
  typeID: number;
  type: string;
  structureID: number;
  strategyID: number;
  active: boolean;
  is_draft: boolean;
  sections?: any;
  version: number;
  frequency_id?: any;
  isSystem: boolean;
  isExpiredTemplateVersion: boolean;
  baseTemplateId: number;
  mappedRatingSchemes?: any;
  diligence_counts: number;
  response_coordinates?: any;
  permissions?: any;
}

export interface TemplateType {
  templateInfo: TemplateInfo;
  questionCount: number;
  type: string;
  strategy: string;
  structure?: any;
  last_updated_at?: Date;
  frequency_id?: any;
  version: number;
}
