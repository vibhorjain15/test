export interface IRatingtypes {
  id: number;
  name: string;
  description?: any;
  firm_id: number;
  created_by: number;
  created_at: Date;
  updated_by?: any;
  updated_at?: any;
  is_active: boolean;
  source: string;
  rating_scale_id: number;
  rating_scale_version: number;
  rating_scale_mode: 'Absolute' | 'ScoreBand';
  rating_level: string;
  version: number;
  has_ratings: boolean;
  is_system: boolean;
}
