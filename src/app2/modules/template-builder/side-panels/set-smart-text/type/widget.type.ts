export interface WidgetType {
  id: number;
  name: string;
  tag: string;
  type: string;
  type_options: string[];
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  is_active: boolean;
}
