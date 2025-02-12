export interface ReportsListType {
  id: number;
  name: string;
  report_template_id: number;
  entity_id: number;
  entity_type: string;
  as_of_date: Date;
  definition?: any;
  firm_id: number;
  created_by: number;
  created_at: Date;
  active: boolean;
  updated_by?: any;
  updated_at?: any;
  blob_name?: any;
  container_name?: any;
  diligence_ids: any[];
  report_template_name: string;
  created_by_name: string;
  orientation: number;
  output_blob_name: string;
}
