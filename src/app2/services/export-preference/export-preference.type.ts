export interface ManagePrefTemplates {
  id: number;
  name: string;
  blob_name: string;
  container_name: string;
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  is_active: boolean;
  created_by_name: string;
  updated_by_name?: any;
  is_system_template: boolean;
}
