export interface RatingType {
  id: number;
  rating_scale_id: number;
  rating_scale_version: number;
  name: string;
  value: number;
  range_min_value: number;
  range_max_value: number;
  color_code: string;
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  scale_mode: string;
  is_active: boolean;
}
