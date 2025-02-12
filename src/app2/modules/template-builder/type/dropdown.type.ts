export interface Option {
  dropdown_option_id: number;
  dropdown_option_text: string;
  dropdown_value_groupid: number;
  order: number;
  is_active: boolean;
  created_by: number;
  created_at: Date;
  updated_by: number;
  updated_at?: any;
  created_by_name: string;
  updated_by_name?: any;
}

export interface DropdownType {
  options: Option[];
  id: number;
  name: string;
  firm_id: number;
  version: number;
  is_active: boolean;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  created_by_name: string;
  updated_by_name?: any;
}
