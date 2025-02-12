export interface PartnershipTypes {
  id: number;
  name: string;
}

export interface PartnersTypes {
  id: number;
  name: string;
  website: string;
  description: string;
  contact_email: string;
  type_ids: number[];
  type_names: string[];
  created_at: Date;
  created_by: number;
  is_active: boolean;
  updated_at?: any;
  updated_by?: any;
}
