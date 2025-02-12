export interface IRatingTypes {
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
  rating_scale_mode: any;
  rating_level: string;
  version: number;
  has_ratings: boolean;
  is_system: boolean;

  // added new field
  isEdit: boolean;
}

export interface IRatingScales {
  id: number;
  name: string;
  firm_id: number;
  version: number;
  created_by: number;
  created_at: Date;
  updated_by?: number;
  updated_at?: Date;
  is_active: boolean;
  scale_mode: string;
  allow_decimal_score_bands: boolean;
}

export interface IRatingDefCategories {
  id: number;
  name: string;
  description?: any;
  weightage: number;
  parent_id?: any;
  rating_scheme_id: number;
  category_level: number;
  created_by: number;
  created_at: Date;
  updated_by: number;
  updated_at: Date;
  is_active: boolean;
  group_id: number;
  rating_scheme_version: number;
  rating_scale_id: number;
  order: number;
  exceeding_weight: number;
}

export interface IRatingScheme {
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
  rating_scale_mode: string;
  rating_level: string;
  version: number;
  has_ratings: boolean;
  is_system: boolean;
}

export interface IManageRiskRatingsRequest {
  id: number;
  name: string;
  description?: any;
  weightage: any;
  category_level: number;
  parent_id?: any;
  rating_scheme_id: number;
  is_active: boolean;
  rating_scheme_version: number;
}

export interface ISelectedCategory {
  category_level: number;
  created_at: Date;
  created_by: number;
  description?: any;
  group_id: number;
  id: number;
  weightage: number;
}

export interface RatingScaleDefinitions {
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
  scale_mode: number;
  is_active: boolean;
}
